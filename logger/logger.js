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

    var _extend = function(obj){
        if(typeof obj !== 'object'){
            return obj;
        }
        var source, prop;

        for(var i = 1, len = arguments.length; i < len; i++){
            source = arguments[i];
            for(prop in source){
                if(source.hasOwnProperty(prop)){
                    (function(obj, prop){
                        if(typeof obj[prop] === 'function'){// 方法
                            var oldFun = obj[prop];

                            obj[prop] = function(){
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
            if(obj.length === 0){
                html += addIndent(indent, '[]');
            }else{
                html += '[' + '<br>';
                for(var i = 0; i < obj.length; i++){
                    html += addIndent(indent + 1, formatJSON(obj[i], indent + 1) + (i == obj.length - 1 ? '' : ',') + '<br>');
                }

                html += addIndent(indent, ']');
            }
        }else if(type === '[object Object]'){
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
                        html += addIndent(indent + 1, '<span class="key">' + key + '</span>' + ':' + formatJSON(obj[key], indent + 1) + (i === count? '':',') + '<br>');
                    }
                }
                html += addIndent(indent, '</span>}');
            }
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
            // html += ''
        }else if(type.match(/^\[object HTML([a-zA-Z]+)Element\]$/)){
            var attributes = obj.attributes,
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
            }else{
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
                    obj.level = 'ERROR';
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
            if(list.scrollTop < 0) {
                // console.warn('top');
                getHistory();
            }
        });
    }

    var getHistory = function(){
        var index = window.Logger.index - 1,
            end = index - 10 >= 0 ? index - 10 : 0;
        for(var i = index;i >= end; i--){
            _Console.renderLog(window.Logger.LOG_ARR[i], true);
        }
        window.Logger.index = end;
    }

    var getLocalStorage = function(){
        // for(var key in window.localStorage){
        //     var data = window.localStorage.getItem(key);
        //     if(typeof data === 'string'){
        //         if(data.length < 50){
        //             var 
        //         }
        //     }
        // }
    }

    var triggerLog = function(callback){
        var flag1, flag2, distance = 50,
            first = {
                x: 0,
                y: document.documentElement.clientHeight
            },
            second = {
                x: document.documentElement.clientWidth / 2,
                y: 0
            },
            third = {
                x: document.documentElement.clientWidth,
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

    _extend(window.console, _Console);

    var init = function(opt){    
        loadSource();
        initDOM();
        initEvent();
    };

    // init();

    triggerLog(function(){ 
        var logger = document.getElementById('logger');
        if(logger){
            logger.style.display = 'block';
            logger.style.height = '200px';
        }else{
            window.Logger.IS_CONSOLE_OPEN = true;
            init();    
        }

        // setInterval(function(){
        //     console.warn('try insert a new log');
        // }, 3000);
    });

    console.log(1);
    console.log(2);
    console.log(3);
    console.log(4);
    console.log(5);
    console.log(6);
    console.log(7);
    console.log(8);
    console.log(9);
    console.log(10);
    console.log(11);
    console.log('hello','world','prettyp');
    console.info('nemo');
    console.error('buluo');
    console.report('CGI ERROR');
    console.log(4561);
    console.info('<div class="name"></div>');
    console.info(document.getElementsByTagName('html')[0]);
    console.log(window.localStorage);
    console.warn({a:1,b:2,c:3,d:function(){alert(3);}});
    console.warn(JSON.stringify({a:1,b:2,c:3,d:function(){alert(3);}}));

    console.log({"result":{"commentnum":1558,"admin_ext":0,"is_ad":1,"errMsg":"get from cmem","errCode":0,"pid":"2021571-1453776986","uin":0,"bid":10437,"comments":[{"index":1,"replay":0,"liketotal":188,"ispostor":0,"uin":0,"pid":"2021571-1453776986","tlist_index":1,"like":0,"cid":"8203390-1453777506","time":1453777506,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"难道所以杨家将都建群骂丽颖吗？\n你别就用一件事否定所以人","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":null,"longnick":null,"city":"巴音郭楞","nick_name":"爱情给不了姐妹的喜欢♛","title":null,"admin_ext":0,"level":1,"age":13,"province":"新疆","gender":2,"year":2003,"headimgurl":"http://q2.qlogo.cn/g?b=qq\u0026k=ibQ8Htr4mbOibtUq4PzSsjJQ\u0026s=100\u0026t=1453471195","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"pic":"http://q2.qlogo.cn/g?b=qq\u0026k=ibQ8Htr4mbOibtUq4PzSsjJQ\u0026s=100\u0026t=1453471195","country":"中国","errno":0,"flag":null,"continue":0,"owner":0,"month":1,"day":1,"level_title":"颖动心弦","vipno":0},"iscommentor":0},{"index":2,"replay":0,"liketotal":128,"ispostor":0,"uin":0,"addr":{"building":"桃源","buzId":"","street":"","province":"江西省","longitude":118182800,"latitude":28492849,"city":"上饶市","country":"中国"},"pid":"2021571-1453776986","tlist_index":2,"like":0,"cid":"7104636-1453777777","time":1453777777,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"{{239524664:1}}大家全部进群\u0026nbsp;\u0026nbsp;骂回","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"pic":"http://q2.qlogo.cn/g?b=qq\u0026k=XLujLSppYRjToQFFZ96EEw\u0026s=100\u0026t=1448700070","lnick":null,"longnick":null,"country":"","city":"","nick_name":"那一抹灿烂的阳光","title":null,"errno":0,"flag":null,"admin_ext":0,"level":5,"continue":2,"month":0,"province":"","owner":0,"gender":1,"year":0,"day":0,"level_title":"追寻颖踪","headimgurl":"http://q2.qlogo.cn/g?b=qq\u0026k=XLujLSppYRjToQFFZ96EEw\u0026s=100\u0026t=1448700070","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"vipno":0},"iscommentor":0},{"index":3,"replay":0,"liketotal":14,"ispostor":0,"uin":0,"addr":{"building":"张庄","buzId":"","street":"","province":"安徽省","longitude":117789864,"latitude":33292938,"city":"宿州市","country":"中国"},"pid":"2021571-1453776986","tlist_index":3,"like":0,"cid":"6689511-1453777788","time":1453777788,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"盖楼，","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":null,"longnick":null,"city":"","nick_name":"最美的痕迹叫回忆","title":null,"admin_ext":0,"level":2,"age":15,"province":"","gender":1,"year":2001,"headimgurl":"http://q3.qlogo.cn/g?b=qq\u0026k=q2e8vvs9TFKbcdpIYmYZSA\u0026s=100\u0026t=1449924965","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"pic":"http://q3.qlogo.cn/g?b=qq\u0026k=q2e8vvs9TFKbcdpIYmYZSA\u0026s=100\u0026t=1449924965","country":"","errno":0,"flag":null,"continue":0,"owner":0,"month":1,"day":1,"level_title":"颖象深刻","vipno":0},"iscommentor":0},{"index":4,"replay":0,"liketotal":32,"ispostor":0,"uin":0,"addr":{"building":"汇星豪庭","buzId":"","street":"东华路","province":"广东省","longitude":113395454,"latitude":22543453,"city":"中山市","country":"中国"},"pid":"2021571-1453776986","tlist_index":4,"like":0,"cid":"6522302-1453777794","time":1453777794,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"神经病","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"pic":"http://q3.qlogo.cn/g?b=qq\u0026k=Gd40tNpY1AqM8wugX6ic16A\u0026s=100\u0026t=1451960072","lnick":null,"longnick":null,"country":"","city":"","nick_name":"Q","title":null,"errno":0,"flag":null,"admin_ext":0,"level":4,"continue":0,"month":0,"province":"","owner":0,"gender":0,"year":0,"day":0,"level_title":"与颖为伴","headimgurl":"http://q3.qlogo.cn/g?b=qq\u0026k=Gd40tNpY1AqM8wugX6ic16A\u0026s=100\u0026t=1451960072","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"vipno":0},"iscommentor":0},{"index":5,"replay":0,"liketotal":168,"ispostor":0,"uin":0,"addr":{"building":"华侨城","buzId":"","street":"石洲中路","province":"广东省","longitude":113967339,"latitude":22533436,"city":"深圳市","country":"中国"},"pid":"2021571-1453776986","tlist_index":5,"like":0,"cid":"5682008-1453777807","time":1453777807,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"不听流言蜚语，唯爱丽颖","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":null,"longnick":null,"city":"深圳","nick_name":"刘小萱","title":null,"admin_ext":0,"level":7,"age":14,"province":"广东","gender":2,"year":2002,"headimgurl":"http://q2.qlogo.cn/g?b=qq\u0026k=HZfianUDZF3oRdKOZepQ6gg\u0026s=100\u0026t=1449064633","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"pic":"http://q2.qlogo.cn/g?b=qq\u0026k=HZfianUDZF3oRdKOZepQ6gg\u0026s=100\u0026t=1449064633","country":"中国","errno":0,"flag":null,"continue":16,"owner":0,"month":1,"day":1,"level_title":"颖往情深","vipno":0},"iscommentor":0},{"index":6,"replay":0,"liketotal":13,"ispostor":0,"uin":0,"addr":{"building":"张庄","buzId":"","street":"","province":"安徽省","longitude":117789864,"latitude":33292938,"city":"宿州市","country":"中国"},"pid":"2021571-1453776986","tlist_index":6,"like":0,"cid":"6689511-1453777817","time":1453777817,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"再盖一楼","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":null,"longnick":null,"city":"","nick_name":"最美的痕迹叫回忆","title":null,"admin_ext":0,"level":2,"age":15,"province":"","gender":1,"year":2001,"headimgurl":"http://q3.qlogo.cn/g?b=qq\u0026k=q2e8vvs9TFKbcdpIYmYZSA\u0026s=100\u0026t=1449924965","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"pic":"http://q3.qlogo.cn/g?b=qq\u0026k=q2e8vvs9TFKbcdpIYmYZSA\u0026s=100\u0026t=1449924965","country":"","errno":0,"flag":null,"continue":0,"owner":0,"month":1,"day":1,"level_title":"颖象深刻","vipno":0},"iscommentor":0},{"index":8,"replay":0,"liketotal":142,"ispostor":0,"uin":0,"addr":{"building":"美域花园","buzId":"","street":"金牛路","province":"安徽省","longitude":117236458,"latitude":31866957,"city":"合肥市","country":"中国"},"pid":"2021571-1453776986","tlist_index":8,"like":0,"cid":"5765791-1453777856","time":1453777856,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"真是的一群脑残\u0026nbsp;，干嘛骂丽颖呀!","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":"一场没有硝烟的战争只在于不经意的瞬间一根电线……一根火柴……一根蜡烛……无情的灾难，珍惜生命","longnick":"一场没有硝烟的战争只在于不经意的瞬间一根电线……一根火柴……一根蜡烛……无情的灾难，珍惜生命","city":"合肥","nick_name":"伞*","title":null,"admin_ext":0,"level":4,"age":13,"province":"安徽","gender":2,"year":2003,"headimgurl":"http://q1.qlogo.cn/g?b=qq\u0026k=aVqcy0BHfrD4Q964aiaT3Qw\u0026s=41\u0026t=1448142454","cover_list":["http://ugc.qpic.cn/gbar_pic/v6yHg9haO5dqhKnzrLNkQibByWMq0dWoUl9IgRhLiaS1zlub1HgQruPg/"],"pic":"http://q1.qlogo.cn/g?b=qq\u0026k=aVqcy0BHfrD4Q964aiaT3Qw\u0026s=41\u0026t=1448142454","country":"中国","errno":0,"flag":null,"continue":2,"owner":0,"month":1,"day":1,"level_title":"与颖为伴","vipno":0},"iscommentor":0},{"index":9,"replay":0,"liketotal":58,"ispostor":0,"uin":0,"addr":{"building":"和顺家园","buzId":"","street":"106省道","province":"四川省","longitude":105051949,"latitude":30626751,"city":"德阳市","country":"中国"},"pid":"2021571-1453776986","tlist_index":9,"like":0,"cid":"6335429-1453777879","time":1453777879,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"不见的你们有好多素质","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":"我被你遗忘在，你遗忘的角落！","longnick":"我被你遗忘在，你遗忘的角落！","city":"德阳","nick_name":"- ①个人的独角戏 ²,","title":null,"admin_ext":0,"level":1,"age":14,"province":"四川","gender":2,"year":2002,"headimgurl":"http://q4.qlogo.cn/g?b=qq\u0026k=AFDp7IqGt7JOhL9msFAocQ\u0026s=140\u0026t=1450892191","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"pic":"http://q4.qlogo.cn/g?b=qq\u0026k=AFDp7IqGt7JOhL9msFAocQ\u0026s=140\u0026t=1450892191","country":"中国","errno":0,"flag":null,"continue":0,"owner":0,"month":1,"day":1,"level_title":"颖动心弦","vipno":0},"iscommentor":0},{"index":10,"replay":0,"liketotal":19,"ispostor":0,"uin":0,"addr":{"building":"桃源","buzId":"","street":"","province":"江西省","longitude":118182800,"latitude":28492849,"city":"上饶市","country":"中国"},"pid":"2021571-1453776986","tlist_index":10,"like":0,"cid":"7104636-1453777884","time":1453777884,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"加群啊","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"pic":"http://q2.qlogo.cn/g?b=qq\u0026k=XLujLSppYRjToQFFZ96EEw\u0026s=100\u0026t=1448700070","lnick":null,"longnick":null,"country":"","city":"","nick_name":"那一抹灿烂的阳光","title":null,"errno":0,"flag":null,"admin_ext":0,"level":5,"continue":2,"month":0,"province":"","owner":0,"gender":1,"year":0,"day":0,"level_title":"追寻颖踪","headimgurl":"http://q2.qlogo.cn/g?b=qq\u0026k=XLujLSppYRjToQFFZ96EEw\u0026s=100\u0026t=1448700070","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"vipno":0},"iscommentor":0},{"index":11,"replay":0,"liketotal":107,"ispostor":0,"uin":0,"addr":{"building":"名山区人民医院","buzId":"","street":"陵园路","province":"四川省","longitude":103109192,"latitude":30081051,"city":"雅安市","country":"中国"},"pid":"2021571-1453776986","tlist_index":11,"like":0,"cid":"3170053-1453777900","time":1453777900,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"如果不喜欢丽颖就不要去黑她","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":null,"longnick":null,"city":"","nick_name":"猫街北巷","title":null,"admin_ext":0,"level":2,"age":11,"province":"","gender":2,"year":2005,"headimgurl":"http://q4.qlogo.cn/g?b=qq\u0026k=3fYyU9aSwfMyJpTNWWEMoQ\u0026s=100\u0026t=1453781709","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"pic":"http://q4.qlogo.cn/g?b=qq\u0026k=3fYyU9aSwfMyJpTNWWEMoQ\u0026s=100\u0026t=1453781709","country":"中国","errno":0,"flag":null,"continue":2,"owner":0,"month":1,"day":1,"level_title":"颖象深刻","vipno":0},"iscommentor":0},{"index":12,"replay":0,"liketotal":180,"ispostor":0,"uin":0,"addr":{"building":"西渡","buzId":"","street":"沪杭公路","province":"","longitude":121430923,"latitude":30991175,"city":"上海市","country":"中国"},"pid":"2021571-1453776986","tlist_index":12,"like":0,"cid":"7963423-1453777909","time":1453777909,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"再多黑粉也无卵用。那个明星身后没有一群喷子黑粉。我们只要坚持爱丽颖就行了。不必理会一群狗。","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"pic":"http://q4.qlogo.cn/g?b=qq\u0026k=VFEzp6PAd8HUSlR2iaq5LVw\u0026s=100\u0026t=1448936203","lnick":null,"longnick":null,"country":"中国","city":"","nick_name":"心如柠檬自然酸°","title":null,"errno":0,"flag":null,"admin_ext":0,"level":2,"continue":0,"month":0,"province":"","owner":0,"gender":2,"year":0,"day":0,"level_title":"颖象深刻","headimgurl":"http://q4.qlogo.cn/g?b=qq\u0026k=VFEzp6PAd8HUSlR2iaq5LVw\u0026s=100\u0026t=1448936203","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"vipno":0},"iscommentor":0},{"index":13,"replay":0,"liketotal":61,"ispostor":0,"uin":0,"addr":{"building":"新桥","buzId":"","street":"申浜公路","province":"上海市","longitude":121324371,"latitude":31061943,"city":"上海市","country":"中国"},"pid":"2021571-1453776986","tlist_index":13,"like":0,"cid":"2607425-1453777941","time":1453777941,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"这些人真没素质","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":"Each  person  ar  happiness  is  to  be  give  their  own.","longnick":"Each  person  ar  happiness  is  to  be  give  their  own.","city":"松江","nick_name":"﹊薍ぅfεη寸の心動","title":null,"admin_ext":0,"level":1,"age":12,"province":"上海","gender":2,"year":2003,"headimgurl":"http://q4.qlogo.cn/g?b=qq\u0026k=KBBLKFCXkKqXiazVkTBtnJQ\u0026s=140\u0026t=1448142454","cover_list":["http://ugc.qpic.cn/gbar_pic/ApMaLibsicoxr6oc7cXvGiaB05qUiaJWNMXLrINwG88BVY3b49lFibHQIxQ/"],"pic":"http://q4.qlogo.cn/g?b=qq\u0026k=KBBLKFCXkKqXiazVkTBtnJQ\u0026s=140\u0026t=1448142454","country":"中国","errno":0,"flag":null,"continue":0,"owner":0,"month":10,"day":20,"level_title":"颖动心弦","vipno":0},"iscommentor":0},{"index":14,"replay":0,"liketotal":52,"ispostor":0,"uin":0,"addr":{"building":"金三角(九华店)","buzId":"6509466","street":"华山路","province":"江苏省","longitude":120691528,"latitude":32140610,"city":"南通市","country":"中国"},"pid":"2021571-1453776986","tlist_index":14,"like":0,"cid":"2177615-1453777954","time":1453777954,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"干嘛骂丽疑","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"pic":"http://q4.qlogo.cn/g?b=qq\u0026k=8FgXZqKE5e5nqs8icbk7cfA\u0026s=100\u0026t=1453600546","lnick":null,"longnick":null,"country":"","city":"","nick_name":"静谧❄时光\n\n　\n　","title":null,"errno":0,"flag":null,"admin_ext":0,"level":2,"continue":1,"month":0,"province":"","owner":0,"gender":0,"year":0,"day":0,"level_title":"颖象深刻","headimgurl":"http://q4.qlogo.cn/g?b=qq\u0026k=8FgXZqKE5e5nqs8icbk7cfA\u0026s=100\u0026t=1453600546","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"vipno":0},"iscommentor":0},{"index":15,"replay":0,"liketotal":30,"ispostor":0,"uin":0,"addr":{"building":"柳树湾","buzId":"","street":"","province":"湖北省","longitude":110622223,"latitude":30502119,"city":"宜昌市","country":"中国"},"pid":"2021571-1453776986","tlist_index":15,"like":0,"cid":"5931590-1453777955","time":1453777955,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"贱人","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":null,"longnick":null,"city":"宜昌","nick_name":"你嘴角的微笑、好勉强っ","title":null,"admin_ext":0,"level":1,"age":13,"province":"湖北","gender":2,"year":2003,"headimgurl":"http://q4.qlogo.cn/g?b=qq\u0026k=MKzMMBKTUxx0OqxPzKhwOw\u0026s=100\u0026t=1453707722","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"pic":"http://q4.qlogo.cn/g?b=qq\u0026k=MKzMMBKTUxx0OqxPzKhwOw\u0026s=100\u0026t=1453707722","country":"中国","errno":0,"flag":null,"continue":0,"owner":0,"month":1,"day":1,"level_title":"颖动心弦","vipno":0},"iscommentor":0},{"index":16,"replay":0,"liketotal":33,"ispostor":0,"uin":0,"addr":{"building":"大丰","buzId":"","street":"中汽大道","province":"四川省","longitude":104069695,"latitude":30763288,"city":"成都市","country":"中国"},"pid":"2021571-1453776986","tlist_index":16,"like":0,"cid":"8145623-1453777956","time":1453777956,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"好烦，不要脸","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"pic":"http://q1.qlogo.cn/g?b=qq\u0026k=zHfrjfvXMTkSlAauT62wTg\u0026s=100\u0026t=1453519287","lnick":null,"longnick":null,"country":"","city":"","nick_name":"淡了记忆忘了痛","title":null,"errno":0,"flag":null,"admin_ext":0,"level":4,"continue":1,"month":0,"province":"","owner":0,"gender":0,"year":0,"day":0,"level_title":"与颖为伴","headimgurl":"http://q1.qlogo.cn/g?b=qq\u0026k=zHfrjfvXMTkSlAauT62wTg\u0026s=100\u0026t=1453519287","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"vipno":0},"iscommentor":0},{"index":17,"replay":0,"liketotal":26,"ispostor":0,"uin":0,"addr":{"building":"名山区人民医院","buzId":"","street":"陵园路","province":"四川省","longitude":103109192,"latitude":30081051,"city":"雅安市","country":"中国"},"pid":"2021571-1453776986","tlist_index":17,"like":0,"cid":"3170053-1453777960","time":1453777960,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"LL把我们加进去，我们和你一起并肩战斗","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":null,"longnick":null,"city":"","nick_name":"猫街北巷","title":null,"admin_ext":0,"level":2,"age":11,"province":"","gender":2,"year":2005,"headimgurl":"http://q4.qlogo.cn/g?b=qq\u0026k=3fYyU9aSwfMyJpTNWWEMoQ\u0026s=100\u0026t=1453781709","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"pic":"http://q4.qlogo.cn/g?b=qq\u0026k=3fYyU9aSwfMyJpTNWWEMoQ\u0026s=100\u0026t=1453781709","country":"中国","errno":0,"flag":null,"continue":2,"owner":0,"month":1,"day":1,"level_title":"颖象深刻","vipno":0},"iscommentor":0},{"index":18,"replay":0,"liketotal":18,"ispostor":0,"uin":0,"addr":{"building":"根竹坪","buzId":"","street":"","province":"广西壮族自治区","longitude":110085907,"latitude":22995390,"city":"贵港市","country":"中国"},"pid":"2021571-1453776986","tlist_index":18,"like":0,"cid":"1199049-1453777984","time":1453777984,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"怎么可以这样","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"pic":"http://q1.qlogo.cn/g?b=qq\u0026k=mReBwF73NgPffg2IXFzicOg\u0026s=100\u0026t=1453783266","lnick":null,"longnick":null,"country":"中国","city":"贵港","nick_name":"有时候 …","title":null,"errno":0,"flag":null,"admin_ext":0,"level":2,"continue":1,"month":0,"province":"广西","owner":0,"gender":2,"year":0,"day":0,"level_title":"颖象深刻","headimgurl":"http://q1.qlogo.cn/g?b=qq\u0026k=mReBwF73NgPffg2IXFzicOg\u0026s=100\u0026t=1453783266","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"vipno":0},"iscommentor":0},{"index":19,"replay":0,"liketotal":58,"ispostor":0,"uin":0,"addr":{"building":"益阳电脑美术学校综合楼","buzId":"","street":"江海路","province":"湖南省","longitude":112347092,"latitude":28556589,"city":"益阳市","country":"中国"},"pid":"2021571-1453776986","tlist_index":19,"like":0,"cid":"3911953-1453777992","time":1453777992,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"讨厌杨家将","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":"你哭了，眼泪是你自己的；你痛了，没有人能体会。你一定要坚强，即使受过伤流过泪，也要咬牙走过。","longnick":"你哭了，眼泪是你自己的；你痛了，没有人能体会。你一定要坚强，即使受过伤流过泪，也要咬牙走过。","city":"益阳","nick_name":"ROSE GIRL","title":null,"admin_ext":0,"level":5,"age":11,"province":"湖南","gender":2,"year":2005,"headimgurl":"http://q1.qlogo.cn/g?b=qq\u0026k=qG4GaMZY4NnFWibHrEapbpg\u0026s=140\u0026t=1452935967","cover_list":["http://ugc.qpic.cn/gbar_pic/Oy7ICyNOLVcZlnNnjl23JDM6LOiauuzQq2SibGEcxGFKDfWKlYOLXdjg/"],"pic":"http://q1.qlogo.cn/g?b=qq\u0026k=qG4GaMZY4NnFWibHrEapbpg\u0026s=140\u0026t=1452935967","country":"中国","errno":0,"flag":null,"continue":10,"owner":0,"month":1,"day":1,"level_title":"追寻颖踪","vipno":0},"iscommentor":0},{"index":20,"replay":0,"liketotal":23,"ispostor":0,"uin":0,"addr":{"building":"贵阳国际中心","buzId":"","street":"","province":"贵州省","longitude":106686440,"latitude":26562910,"city":"贵阳市","country":"中国"},"pid":"2021571-1453776986","tlist_index":20,"like":0,"cid":"8642528-1453777996","time":1453777996,"native":1,"postsrc":1,"isdel":0,"comment":{"content":"靠一群傻逼","urlInfo":[],"keyInfo":[]},"bid":10437,"user":{"isdiy":1,"uin":0,"lnick":null,"longnick":null,"city":"发罗拉","nick_name":"내 마음 당신 없이 어떻게","title":null,"admin_ext":0,"level":3,"age":19,"province":"","gender":1,"year":1997,"headimgurl":"http://q1.qlogo.cn/g?b=qq\u0026k=UE9UvOXuvfcQFDPicr6NaUw\u0026s=100\u0026t=1437856447","cover_list":["http://pub.idqqimg.com/pc/misc/files/20151106/528061a5f8bc400f921ca2ca61001fff.png"],"pic":"http://q1.qlogo.cn/g?b=qq\u0026k=UE9UvOXuvfcQFDPicr6NaUw\u0026s=100\u0026t=1437856447","country":"阿尔巴尼亚","errno":0,"flag":null,"continue":0,"owner":0,"month":1,"day":1,"level_title":"颖人入胜","vipno":0},"iscommentor":0}],"isend":0},"retcode":0})
});


