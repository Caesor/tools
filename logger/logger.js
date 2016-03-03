(function(root, factory){
    root['MLogger'] = factory();
})(window, function(){
    // options to use to load resources
    var options = {
        'logCss' : 'logger.css'
    };

    // used to storage the cgi information
    window.Logger = {
        'IS_CONSOLE_OPEN': false,
        'LOG_ARR': [],
        'PAGE_SIZE': 5,
        'index': -1
    };

    var _Console = {
        record: function(logLevel){
            var log = {
                'level': logLevel,
                'time': Date.now(),
                'content': []
            }

            for(var i = 1; i < arguments.length; i++){
                try {
                    log.content.push(arguments[i]);
                }catch(e){
                    log.content.push(arguments[i]);
                }
            }
            if(logLevel !== 'REPORT'){
                
                if(window.Logger.IS_CONSOLE_OPEN){
                    this.renderLog(log);
                }else{
                    this.saveLog(log);
                }
            }else{// report
                new Image().src = 'http://report.blog.com/report?information=[' + log.content.join('&') + ']&t=' + Date.now();
            }

        },
        log: function(){
            Array.prototype.unshift.call(arguments, 'LOG');
            this.record.apply(this, arguments);
        },
        info: function(){
            Array.prototype.unshift.call(arguments, 'INFO');
            this.record.apply(this, arguments);
        },
        warn: function(){
            Array.prototype.unshift.call(arguments, 'WARN');
            this.record.apply(this, arguments);
        },
        error: function(){
            Array.prototype.unshift.call(arguments, 'ERROR');
            this.record.apply(this, arguments);
        },
        report: function(){
            Array.prototype.unshift.call(arguments, 'REPORT');
            this.record.apply(this, arguments);
        },
        saveLog: function(log){
            window.Logger.LOG_ARR.push(log);
        },
        renderLog: function(log, history){
            var contents = log.content,
                arr = [];
            for(var i = 0; i < contents.length ;i++){
                content = contents[i];
                try{
                    arr[i] = formatJSON(content, 0);
                }catch(e){
                    log.level = 'ERROR';
                    arr[i] = e;
                }
            }

            var ul = document.getElementById('logger-list'),
                first = ul.firstChild,
                last = ul.lastChild,
                li = document.createElement('li'),
                html = "<p class='logger-time'>"
                    + formatDate(log.time, 'MM-dd h:mm')
                    + "<span class='logger-type'>"
                    + log.level
                    + "</span></p>" + "<div class='logger-content'>"
                    + arr.join('|')
                    + "</div>";
            li.className = "logger-item " + log.level;
            li.innerHTML = html;
            
            if(!history || !first){
                ul.appendChild(li);
                // scroll to bottom
                ul.scrollTop = ul.scrollHeight - ul.offsetHeight;
            }else{
                ul.insertBefore(li, first);
            }
        }
    }

    function initDOM(){
        var container = document.createElement('div'),
            html = document.createDocumentFragment(),
            ul = document.createElement('ul'),
            controller = document.createElement('div'),
            clear = document.createElement('span'),
            dragger = document.createElement('span');

        container.className = 'logger';
        container.id = 'logger';

        ul.className = 'logger-list';
        ul.id = 'logger-list';

        clear.id = 'logger-clear';
        clear.innerHTML = "clear";

        dragger.id = 'logger-dragger';

        html.appendChild(ul)
        html.appendChild(clear);
        html.appendChild(dragger);
        container.appendChild(html);
        document.body.appendChild(container);

        // render the latest ten loggers
        var data = window.Logger.LOG_ARR,
            index = window.Logger.index = data.length,
            size = window.Logger.PAGE_SIZE,
            i;

        window.Logger.index = i = index - size >= 0 ? index - size : 0;
        for(; i < index; i++){
            _Console.renderLog(data[i]);
        }

        // scroll to bottem
        var list = document.getElementById('logger-list');
        list.scrollTop = list.scrollHeight - list.offsetHeight;
        
    }

    function loadSource(){
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = options.logCss;
        document.head.appendChild(link);
    }

    var initEvent = function(){
        var clear = document.getElementById('logger-clear'),
            log = document.getElementById('logger'),
            list = document.getElementById('logger-list'),
            dragger = document.getElementById('logger-dragger');

        // clear
        clear.addEventListener('touchstart', function(){
            list.innerHTML = '';
        }, false);

        // dragger
        dragger.addEventListener('touchmove', function(e){
            e.preventDefault();
            e.stopPropagation();
            var y = e.touches[0].pageY;
            if(y < 20){
                document.getElementById('logger').style.display = 'none';
            }else{
                log.style.height = y + 'px';
            }
        }, false);

        // json DOM strech
        log.addEventListener('touchstart', function(e){
            var target = e.touches[0].target,
                classlist = target.classList,
                nextElementClassList = target.nextElementSibling && target.nextElementSibling.classList;

            if(classlist.contains('tree-node') || classlist.contains('html-node')){
                classlist.toggle('off');
                if(nextElementClassList.contains('wrapper')){
                    nextElementClassList.toggle('hidden');
                }else{
                    (function($) {
                        var e = {
                            nextAll: function(s) {
                                var $els = $(),
                                    $el = this.next();

                                while ($el.length) {
                                    if (typeof s === 'undefined' || $el.is(s)) $els = $els.add($el)
                                    $el = $el.next();
                                }

                                return $els;
                            },
                            prevAll: function(s) {
                                var $els = $(),
                                    $el = this.prev();

                                while ($el.length) {
                                    if (typeof s === 'undefined' || $el.is(s)) $els = $els.add($el)
                                    $el = $el.prev();
                                }

                                return $els;
                            }
                        };

                        $.extend($.fn, e);
                    })(Zepto);
                    $(target).nextAll('.quot').toggleClass('hidden'); //parentElement.querySelector('.quot').classList.toggle('hidden');
                    //target.parentElement.querySelector('.wrapper').classList.toggle('hidden');
                    $(target).nextAll('.wrapper').toggleClass('hidden');
                }
            }
        }, false);

        list.addEventListener('scroll', function(){
            // console.info('scrolling');
            if(list.scrollTop <= 0) {
                // console.warn('top');
                getHistory();
            }
        });
    }

    // obj is the dest!
    var _extend = function(obj){
        if(typeof obj !== 'object'){
            return obj;
        }
        var source, prop;

        // first argument is the destination, so start from second
        for(var i = 1, len = arguments.length; i < len; i++){
            source = arguments[i];
            for(prop in source){
                if(source.hasOwnProperty(prop)){
                    (function(obj, prop){
                        if(typeof obj[prop] === 'function'){// 方法
                            var oldFun = obj[prop];

                            obj[prop] = function(){
                                // arguments of this current function
                                source[prop].apply(source, arguments);
                                oldFun.apply(obj, arguments);
                            };
                        }else{// 属性直接覆盖
                            obj[prop] = source[prop];
                        }
                    })(obj, prop);
                }
            }
        }
    }

    var formatDate = function(num, format) { //.format('MM-dd h:mm:ss.S')
        num = new Date(num);
        format = 'MM-dd h:mm:ss.S';
        var date = {
            "M+": num.getMonth() + 1,
            "d+": num.getDate(),
            "h+": num.getHours(),
            "m+": num.getMinutes(),
            "s+": num.getSeconds(),
            "S+": num.getMilliseconds()
        };

        for (var k in date) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
            }
        }

        return format;
    };

    var formatJSON = function(obj, indent){
        var html = '',
            type = Object.prototype.toString.call(obj);

        if(type == '[object Array]'){
            html += parseArray(obj, indent);
        }else if(type === '[object Object]'){
            html += parseObject(obj, indent);
        }else if(type === '[object Number]'){
            html += '<span class="number">' + obj + '</span>';
        }else if(type === '[object Boolean]'){
            html += '<span class="boolean">' + obj + '</span>';
        }else if(type === '[object Undefined]'){
            html += 'undefined';
        }else if(type === '[object Null]'){
            html += '<span class="null">' + obj + "</span>";
        }else if(type === '[object String]'){
            html += '<span class="string">' + obj.replace('<br>','').split("<").join("&lt;").split(">").join("&gt;") + "</span>";
        }else if(type === '[object Storage]'){
            html += parseObject(getLocalStorage(), indent);
        }else if(type.match(/^\[object HTML([a-zA-Z]+)Element\]$/)){
            html += parseHTML(obj, indent);
        }else{
            html += '<span class="string">' + type + '</span>';
        }

        return html;
    }

    var addIndent = function(num, str, useIndent){
        if(!useIndent){
            var result = '';

            for(var i = 0; i < num; i++){
                result += '&nbsp&nbsp';
            }
            return result + str;
        }else{
            return str;
        }
    }

    var parseArray = function(obj, indent){
        var html ='';

        if(obj.length === 0){
            html += addIndent(indent, '[]');
        }else{
            html += '[' + '<br>';
            for(var i = 0; i < obj.length; i++){
                html += addIndent(indent + 1, formatJSON(obj[i], indent + 1) + (i == obj.length - 1 ? '' : ',') + '<br>');
            }

            html += addIndent(indent, ']');
        }
        return html;
    }

    var parseObject = function(obj, indent){
        var html = '';

        try {
            JSON.stringify(obj);
        } catch(e){
            throw e.message;
        }

        var count = 0,
            key;

        for(key in obj){
            if(obj.hasOwnProperty(key)){
                count++;
            }
        }

        if(count === 0){
            html += addIndent(indent, '{}');
        }else{
            var j = 0;

            html += '{<span class="tree-node off"></span><span class="wrapper hidden">' + '<br>';

            for(key in obj){
                if(obj.hasOwnProperty(key)){
                    j++;
                    var objArr = [];
                    html += addIndent(indent + 1, '<span class="key">' + key + '</span>' + ':' + formatJSON(obj[key], indent + 1) + (j === count? '':',') + '<br>');
                }
            }
            html += addIndent(indent, '</span>}');
        }

        return html;
    }

    var parseHTML = function(obj, indent){
        var html = '',
            attributes = obj.attributes,
            str = '',
            isChild;

        for(var i = 0; i < attributes.length; i++){
            str += '&nbsp;<span class="attr-name">' + attributes[i].nodeName + '</span><span class="tag-name">="</span><span class="attr-value">' + attributes[i].nodeValue + '</span><span class="tag-name">"</span>';
        }
        isChild = obj.childElementCount || (obj.nodeName.toLowerCase() === 'script' && !obj.src);
        html += isChild ? '<span class="html-node"></span>': '';
        html += '<span class="tag-name">&lt;' + obj.nodeName.toLowerCase() + '</span>' + str + '<span class="tag-name">&gt;</span>' + (obj.childElementCount ? '': '');
        html += isChild ? '<span class="quot">...</span><span class="wrapper hidden">' : '';
        var children = obj.children;

        for(var j = 0; j < children.length; j++){
            html += (isChild ? '<br>' : '');
            html += addIndent(indent + 1,  formatJSON(children[j], indent + 1));
        }
        html += obj.childElementCount ? '' : obj.textContent.split('<').join('&lt;').split('>').join('&gt;');
        html += (isChild ? '<br>' : '');
        html += isChild ? addIndent(indent + 1, '</span><span class="tag-name">&lt;/' + obj.nodeName.toLowerCase() + '&gt;</span>') : '<span class="tag-name">&lt;/' + obj.nodeName.toLowerCase() + '&gt;</span>';

        return html;
    }

    var getLocalStorage = function(){
        var storage = {},
            i = 0;
        for(var key in window.localStorage){
            i++;
            var data = window.localStorage.getItem(key);
            if(typeof data === 'string'){
                // if(data.length < 50){
                    try{
                        data = JSON.parse(data);
                    }catch(e){
                        data = data;
                    }
                    storage[key] = data;   
                // }
            }
        }
        return storage;
    }

    var getHistory = function(){
        var index = window.Logger.index - 1,
            end = index - 10 >= 0 ? index - 10 : 0;
        for(var i = index;i >= end; i--){
            _Console.renderLog(window.Logger.LOG_ARR[i], true);
        }
        window.Logger.index = end;
    }

    var triggerLog = function(callback){
        var flag1, flag2, distance = 50,
            first = {
                x: document.documentElement.clientWidth,
                y: document.documentElement.clientHeight
            },
            second = {
                x: document.documentElement.clientWidth / 2,
                y: 0
            },
            third = {
                x: 0,
                y: document.documentElement.clientHeight
            };

        document.addEventListener('touchstart', function(e){
            flag1 = flag2 = false;
            if(Math.abs(e.targetTouches[0].clientX - first.x) < distance && Math.abs(e.targetTouches[0].clientY - first.y) < distance){
                flag1 = true;
                e.preventDefault();
            }
        }, false);

        document.addEventListener('touchmove', function(e){
            if(flag1 && Math.abs(e.targetTouches[0].clientX - second.x) < distance && Math.abs(e.targetTouches[0].clientY - second.y) < distance){
                flag2 = true;
            }

            if(flag2 && Math.abs(e.targetTouches[0].clientX - third.x) < distance && Math.abs(e.targetTouches[0].clientY - third.y) < distance){
                callback();
                flag1 = flag2 = false;
            }
        }, false);

        document.addEventListener('touchend', function(e){
            flag1 = flag2 = false;
        }, false);
    }

    // Core Algorithm, rewrite the console method of system
    _extend(window.console, _Console);

    var init = function(opt){    
        loadSource();
        initDOM();
        initEvent();
    };

    triggerLog(function(){ 
        var logger = document.getElementById('logger');
        if(logger){
            logger.style.display = 'block';
            logger.style.height = '200px';
        }else{
            window.Logger.IS_CONSOLE_OPEN = true;
            init();    
        }
    });
});


