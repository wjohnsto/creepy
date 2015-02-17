var system = require('system');

(function(host) {
    function Creepy(options) {
        if(!(this instanceof Creepy)) {
            return new Creepy(options);
        }
        options = options || {};
        this.visited = {};
        this.rootUrl = options.rootUrl;
        this.initialDelay = options.initialDelay || 5000;
        this.delay = options.delay || this.initialDelay;
        this.urls = [];
        this.sort = options.sort || function(u) { return u; };
        if(!!options.ignore && options.ignore.length > 0) {
            this.ignore = new RegExp(options.ignore.join('|'));
        } else {
            this.ignore = {
                test: function() { 
                    return false; 
                }
            };
        }
    }
    
    Creepy.webpage = require('webpage');
    
    Creepy.prototype = {
        crawl: function(onSuccess, onFailure, onFinished) {
            this.onSuccess = onSuccess;
            this.onFailure = function() { onFailure.apply(null, arguments); onFinished(); };
            this.onFinished = onFinished;

            var url = this.rootUrl,
                _this = this;

            if(url[url.length - 1] === '/') {
                url = url.slice(0, -1);
            }

            var page = Creepy.webpage.create();

            page.onConsoleMessage = function (msg) {
                system.stderr.writeLine('console: ' + msg);
            };

            page.open(url, function(status) {
                if(status === 'fail') {
                    page.close();
                    _this.onFailure({
                        url: url,
                        status: status
                    });
                    return;
                }
                
                _this.urls.push(url);
                var length = _this.urls.length;
                
                function visit() {
                    if(_this.urls.length === 0) {
                        _this.onFinished();
                        return;
                    }
                    
                    if(length < _this.urls.length) {
                        _this.urls = _this.sort(_this.urls);
                    }
                    
                    length = _this.urls.length;
                    
                    _this.visit(page, _this.urls.shift(), visit);
                }
                
                setTimeout(visit, _this.initialDelay);
            });
        },
        
        visit: function(page, url, done) {
            if (this.visited[url]) {
                done();
                return;
            }

            var _this = this;

            console.log('Getting content for url:', url);

            page.evaluate(function (url) {
                window.history.pushState(null, '', url);
                window.dispatchEvent(new Event('popstate'));
            }, url);

            setTimeout(function () {
                var html = page.evaluate(function() {
                    return document.documentElement.innerHTML;
                });

                _this.visited[url] = true;
                _this.urls.push.apply(_this.urls, _this.getUrls(page));
                _this.onSuccess({
                    url: url,
                    content: html
                });
                done();
            }, _this.delay);
        },
        
        getUrls: function(page) {
            var _this = this;
            return page.evaluate(function() {
                return Array.prototype.map.call(document.getElementsByTagName('a'), function(link) {
                    var href = link.href;

                    if (window.getComputedStyle(link).display === 'none') {
                        return;
                    }

                    if(href[href.length - 1] === '/') {
                        href = href.slice(0, -1);
                    }
                    
                    return href.split('?')[0].split('#')[0].toLowerCase();
                });
            }).filter(function(href) {
                return href && href.indexOf('/undefined/') === -1 && href.indexOf('http') === 0 && href.indexOf(_this.rootUrl) > -1 && !_this.ignore.test(href) && !_this.visited[href];
            });
        }
    };
    
    host.Creepy = Creepy;
})(phantom);

module.exports = exports = phantom.Creepy;
