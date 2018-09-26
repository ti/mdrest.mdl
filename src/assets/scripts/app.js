'use strict';

var App = (function () {
    var main = document.getElementById("main");
    var header = document.getElementById("header");
    var content = document.getElementById("content");
    var link = document.getElementById("link");
    var drawerToggle = document.getElementById("drawer-toggle");
    var hasHistoy = false;

    var getBaseUrl = function () {
        var url = window.location.pathname;
        if ((url.lastIndexOf("/index.html") >= 0) || (url.lastIndexOf("/index.htm") >= 0)) {
            url = url.substring(0, url.lastIndexOf("/"));
        }
        if (url.substr(url.length - 1, url.length) === "/") {
            url = url.substr(0, url.length - 1)
        }
        return url;
    };

    var loading = {
        isDone: true,
        dom: document.getElementById("page-loading"),
        done: function () {
            loading.isDone = true;
            loading.dom.style.display = "none";
        },
        start: function () {
            loading.isDone = false;
            setTimeout(function () {
                if (!loading.isDone) {
                    loading.dom.style.display = "block";
                }
            }, 1200);
        }
    };

    var scrollIntoViewSmoothly = function (element) {
        element.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
    };
    var baseActions = function () {
        HTMLDivElement.prototype.toggleInternalLink = function () {
            var anchors = this.querySelectorAll('a');
            for (var i = 0; i < anchors.length; i++) {
                anchors[i].onclick = function (e) {
                    var href = this.getAttribute("href");
                    if (href.indexOf('#') === 0) {
                        e.preventDefault();
                        scrollIntoViewSmoothly(document.querySelector(href));
                    } else if (href.substr(-3) === ".md" && href.substring(0, 4) !== "http") {
                        e.preventDefault();
                        if (MdRestConfig.BasePath) {
                            href = href.substring(MdRestConfig.BasePath.length, href.length - 3);
                        }
                        App.routes.goto("/page/" + href);
                    }
                };
            }
            anchors = this.querySelectorAll('div[data-link], li[data-link], a[data-link]');
            for (var i = 0; i < anchors.length; i++) {
                anchors[i].onclick = function (e) {
                    var href = this.getAttribute("href");
                    e.preventDefault();
                    if (href.indexOf('://') > 0 || href.indexOf('#') > 0 || this.getAttribute('target') === "_blank") {
                        link.href = href;
                        link.click();
                        return true;
                    }
                    App.routes.goto(href);
                };
            }
        };
        HTMLDivElement.prototype.updateDomActions = function () {
            this.toggleInternalLink();
            componentHandler.upgradeAllRegistered();
            var docs = document.querySelector(".docs");
            if (docs) {
                toggleToc();
                require.require("assets/scripts/prism.min.js", "script", function (data, e) {
                    if (!e) {
                        Prism.highlightAll(true)
                    }
                });
                require.require("assets/scripts/arale-qrcode.min.js", "script", function (data, e) {
                    if (!e) {
                        var actions = document.getElementById("page-actions");
                        if (actions) {
                            var pageQrcode = actions.querySelector(".action__qrcode");
                            var el = new AraleQRCode({correctLevel: 0, size: 200, text: window.location.href});
                            pageQrcode.innerHTML = "";
                            pageQrcode.appendChild(el);
                        }
                    }
                });
                var comments = document.getElementById("comments");
                if (comments && undefined !== window.MdRestDisqus) {
                    MdRestDisqus.loadTo(comments, App.url, App.id, true);
                }
            }
        };
        document.getElementById("back-button").onclick = function () {
            if (hasHistoy) {
                window.history.back();
            } else {
                App.routes.goto("/")
            }
        };
        document.querySelector(".drawer").onclick = function () {
            if (drawerToggle.checked) {
                drawerToggle.checked = false;
            }
        };
        window.onhashchange = function () {
            if (!window.location.hash.indexOf("#/")) {
                App.routes.goto(decodeURI(window.location.hash).substr(1, window.location.hash.length));
            } else {
                App.routes.goto("/");
            }
        }

    };
    var nameColors = {
        data: {},
        get: function (name) {
            var color = this.data[name];
            if (color) {
                return color;
            }

            var num = 0;
            for (var i = 0; i < name.length; i++) {
                num += name.charCodeAt(i);
            }
            color = "hsl(" + (num % 360) + ",60%,75%)";
            this.data[name] = color;
            return color;
        }
    };

    var hideRightBottomNav = function () {
        var rightBottomNav = document.getElementById("right-bottom-nav");
        if (rightBottomNav) {
            rightBottomNav.classList.add("hidden");
        }
    }
    var showRightBottomNav = function () {
        var rightBottomNav = document.getElementById("right-bottom-nav");
        if (rightBottomNav) {
            rightBottomNav.classList.remove("hidden");
        }
    }

    var toggleRightBottomNav = function () {
        var rightBottomNav = document.getElementById("right-bottom-nav");
        if (!rightBottomNav) {
            return
        }
        // rightBottomNav float above footer
        var footerHeight = document.getElementsByTagName("footer")[0].clientHeight;
        var topPageButton = document.getElementById("top-of-page");
        topPageButton.addEventListener('click', function (e) {
            scrollIntoViewSmoothly(header);
        });
        window.addEventListener('scroll', function (e) {
            var windowsY = (window.pageYOffset || document.documentElement.scrollTop);
            var clientY = (document.documentElement.clientTop || 0);
            var top = windowsY - clientY;
            var bottom = document.body.offsetHeight - ((window.innerHeight + windowsY));
            if (top > 400) {
                topPageButton.classList.remove("hidden");
            } else {
                topPageButton.classList.add("hidden");
            }
            var height = footerHeight - bottom + 30;
            if (bottom < 100) {
                rightBottomNav.style.marginBottom = height + "px";
            } else if (top > 400) {
                rightBottomNav.style.marginBottom = "40px";
            } else {
                rightBottomNav.style.marginBottom = "0px";
            }
        });
    };
    //get docs form documents by h2,h3
    var getToc = function (sel) {
        var documentRef = document.querySelector(sel);
        var toc = '<ul><li><a href="#content">目录</a>';
        var level = 2;
        var headings = [].slice.call(documentRef.querySelectorAll('h2, h3'));
        if (headings.length < 2) {
            return ""
        }
        headings.forEach(function (heading, index) {
            var hIndex = parseInt(heading.nodeName.substring(1));
            var append = '<li><a href="#' + heading.id + '">' + heading.innerText + '</a>';

            if (hIndex > level) {
                append = '<ul>' + append;
            } else if (hIndex < level) {
                append = '</li></ul></li>' + append;
            }
            toc += append;
            level = hIndex;
        });
        var appendEnd = '</li></ul>';
        if (level > 2) {
            appendEnd = '</li></ul></li></ul>';
        }
        toc += appendEnd;
        return '<nav class="docs-toc">' + toc + '</nav>';
    };

    var activeTocIndex = -1;
    var toggleToc = function () {
        var tocMenu = document.getElementById("toc-menu");
        if (!tocMenu) {
            return
        }
        var docs = document.querySelector(".docs");
        if (docs) {
            var toc = getToc(".docs");
            if (toc === "") {
                return
            }
            var tocContainer = document.getElementById("toc-container");
            tocContainer.innerHTML = toc;
            tocMenu.classList.remove("hidden");
            var navElements = document.querySelectorAll(".docs-toc a");
            for (var i = 0, l = navElements.length; i < l; i++) {
                navElements[i].addEventListener('click', function (e) {
                    e.preventDefault();
                    var curActives = tocContainer.querySelectorAll("a.active");
                    if (curActives) {
                        curActives.forEach(function (e) {
                            e.classList.remove("active")
                        })
                    }
                    var id = this.getAttribute("href").substr(1);
                    scrollIntoViewSmoothly(document.getElementById(id));
                    this.classList.add("active");
                });
            }
            var hElementsTops = undefined;

            window.addEventListener('scroll', function (e) {
                var docsTop = docs.getBoundingClientRect().top;
                if (docsTop >= 0) {
                    if (activeTocIndex !== -1) {
                        activeTocIndex = -1;
                        var curActive = tocContainer.querySelector("a.active");
                        if (curActive) {
                            curActive.classList.remove("active")
                        }
                    }
                    return
                }
                if (!hElementsTops) {
                    hElementsTops = [];
                    var hElements = document.querySelectorAll(".docs h2, .docs h3");
                    for (var i = 0, l = hElements.length; i < l; i++) {
                        var id = hElements[i].getAttribute("id");
                        if (id) {
                            hElementsTops.push({
                                id: id,
                                top: hElements[i].offsetTop - hElements[i].parentNode.offsetTop - 16,
                            });
                        }
                    }
                }
                var currentIndex = -1;
                for (var i = 0, l = hElementsTops.length; i < l; i++) {
                    if ((0 - docsTop) >= hElementsTops[i].top) {
                        currentIndex = i;
                        continue;
                    }
                }
                if (currentIndex > -1 && currentIndex !== activeTocIndex) {
                    activeTocIndex = currentIndex;
                    var curTocActive = tocContainer.querySelector("a.active");
                    if (curTocActive) {
                        curTocActive.classList.remove("active")
                    }
                    tocContainer.querySelector('.docs-toc a[href="#' + hElementsTops[currentIndex].id + '"]').classList.add("active");
                }
            });
        } else {
            tocMenu.classList.add("hidden");
        }
    };

    var require = {
        data: {},
        headEl: document.getElementsByTagName('head')[0],
        sync: true,
        reset: function (url) {
            require.data = {}
        },
        put: function (key, value) {
            require.data[key] = value;
        },
        require: function (url, type, callback) {
            //如果正在载入，return
            if ("link" === type || "script" === type) {
                var status = require.data[url];
                if (undefined != status) {
                    if (200 === status) {
                        return callback();
                    } else {
                        return callback({}, {status: status});
                    }
                }
                var el = document.createElement(type), sync = false,
                    attrName, attributes;

                if ("link" === type) {
                    sync = true;
                    attributes = {rel: 'stylesheet', href: url, type: 'text/css'}
                } else {
                    attributes = {src: url}
                }
                for (attrName in attributes) {
                    el.setAttribute(attrName, attributes[attrName]);
                }
                if (callback) {
                    require.data[url] = 100;
                    el.addEventListener('load', function (e) {
                        require.data[url] = 200;
                        callback(e);
                    }, false);
                    setTimeout(function () {
                        if (200 !== require.data[url]) {
                            require.data[url] = 408;
                            callback({}, {status: 408});
                        }
                    }, 3000)
                } else {
                    require.data[url] = 200;
                }

                if (sync) {
                    require.headEl.appendChild(el);
                } else {
                    var s = document.getElementsByTagName(type)[0];
                    s.parentNode.insertBefore(el, s);
                }
                return;
            }
            var resp = require.data[url];
            if (resp) {
                callback(resp);
                return
            }
            var req = new XMLHttpRequest();
            req.open("GET", url, true);
            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    var data = null;
                    if (req.status === 200) {
                        if (type === "json") {
                            resp = JSON.parse(req.responseText);
                        } else {
                            resp = req.responseText;
                        }
                        require.data[url] = resp;
                        callback(resp);
                    } else {
                        callback(resp, {status: req.status});
                    }
                }
            };
            req.send();
        }
    };

    var routes = {
        data: {
            "_error": '<div class="error"><i class="material-icons">info</i><h3>{{status}}</h3><p>{{msg}}</p></div>'
        },
        remove: function (url) {
            delete this.data[url];
        },
        exist: function (url) {
            return this.data.hasOwnProperty(url) && routes.data[url] !== null;
        },
        get: function (url) {
            return this.data[url];
        },
        add: function (url, title, templateUrl, mainCss, dataFunc) {
            var tmpData = {
                title: title,
                template: templateUrl,
                dataFunc: dataFunc
            };
            if (mainCss) {
                tmpData.mainCss = mainCss.split(" ")
            }
            this.data[url] = tmpData;

        },
        goto: function (url) {
            if (url === undefined || this.data.currentUrl === url) {
                return
            }
            loading.start();
            var curActive = header.querySelector("a.active");
            if (curActive) {
                curActive.classList.remove("active")
            }
            var headerActive = url;
            if ("/catalog/projects" === url.substring(0, 17)) {
                headerActive = "/catalog/projects"
            } else if ("/pages" === url.substring(0, 6)) {
                headerActive = "/"
            }
            curActive = header.querySelector('a[href="' + headerActive + '"]');
            if (curActive) {
                curActive.classList.add("active")
            }

            var urlBase = "/" + url.split("/", 2)[1];
            if (!this.exist(urlBase)) {
                content.innerHTML = Mustache.render(routes.data["_error"], {status: 404, msg: "页面 " + url + " 不存在"});
                return
            }
            var route = this.get(urlBase);
            if (url.startsWith('/page/')) {
                showRightBottomNav()
            } else {
                hideRightBottomNav()
            }
            var state = "#" + url;
            if (url === "/") {
                state = "";
            }

            document.title = route.title;
            header.scrollIntoView();
            if (state !== window.location.hash) {
                window.history.pushState(state, route.title, window.location.pathname + state);
                hasHistoy = true
            }
            //clear header
            require.require(route.template, "html", function (tpl, err) {
                if (err) {
                    loading.done();
                    content.innerHTML = Mustache.render(routes.data["_error"], {status: 500, msg: "页面载入错误"});
                    return
                }
                routes.data.currentUrl = url;
                if (route.mainCss) {
                    for (var i = 0, l = route.mainCss.length; i < l; i++) {
                        var mainCss = route.mainCss[i];
                        if (mainCss.substring(0, 1) === "-") {
                            main.classList.remove(mainCss.substring(1, mainCss.length))
                        } else {
                            main.classList.add(mainCss)
                        }
                    }
                }
                App.url = url;
                App.id = url;
                if (route.dataFunc) {
                    route.dataFunc(url, function (data, err) {
                        loading.done();
                        if (err) {
                            content.innerHTML = Mustache.render(routes.data["_error"], err);
                        } else {
                            if (data.location) {
                                App.id = data.location;
                            }
                            if (data.title) {
                                document.title = route.title + " - " + data.title
                            }
                            content.innerHTML = Mustache.render(tpl, data);
                            content.updateDomActions();
                        }
                    })
                } else {
                    loading.done();
                    content.innerHTML = Mustache.render(tpl);
                    content.updateDomActions();
                }
            })


        }
    };

    var toggleRoutes = function () {
        App.routes.add("/", MdRestConfig.Title, "assets/views/blog.html", "-child-page -mdl-blog--blogpost", Blog.getSummary);
        App.routes.add("/pages", MdRestConfig.Title, "assets/views/blog.html", "-child-page -mdl-blog--blogpost", Blog.getSummary);
        App.routes.add("/page", MdRestConfig.Title, "assets/views/page.html", "child-page mdl-blog--blogpost", Blog.getPage);
        App.routes.add("/about", "关于", "assets/views/about.html", "-child-page mdl-blog--blogpost", Blog.getPage);
        App.routes.add("/tags", "标签", "assets/views/tags.html", "-child-page mdl-blog--blogpost", Blog.getTags);
        App.routes.add("/tag", "标签", "assets/views/tag.html", "child-page mdl-blog--blogpost", Blog.getSummaryByTags);
        App.routes.add("/simple", "博客", "assets/views/simple.html", "child-page mdl-blog--blogpost");
        App.routes.add("/catalog", "分类", "assets/views/catalog.html", "-child-page -mdl-blog--blogpost", Blog.getSummaryByCatalog);
        if ("#/ncr" === window.location.hash) {
            return
        }
        if ("#/" === window.location.hash.substr(0, 2)) {
            App.routes.goto(decodeURI(window.location.hash).substr(1, window.location.hash.length));
        } else if ("#!/" === window.location.hash.substr(0, 3)) {
            App.routes.goto(decodeURI(window.location.hash).substr(2, window.location.hash.length));
        } else {
            App.routes.goto("/")
        }
        main.toggleInternalLink();
    };

    function init() {
        baseActions();
        toggleRoutes();
        toggleRightBottomNav();
    }

    return {
        init: init,
        require: require,
        routes: routes,
        nameColors: nameColors,
        baseUrl: getBaseUrl()
    };
})();


document.addEventListener("DOMContentLoaded", function () {
    App.init();
});


