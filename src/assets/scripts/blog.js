'use strict';
var Blog = (function () {
    var getSummary = function (url, callback) {
        App.require.require(MdRestConfig.BasePath + "mdrest_index.json", "json", function (resp, err) {
            if (err) {
                callback(null, {status: 500, msg: "网络错误，请稍后重试"});
                return
            }
            var page = 1, limit = 7;
            var inTags = false;
            var urlSplits = url.split("/");
            if (urlSplits.length === 3) {
                page = parseInt(urlSplits[2]);
            }
            if ((page > 1)) {
                limit = 8;
            }
            var start = limit * (page - 1);

            if ((page > 1)) {
                start = start - 1;
            }
            if (resp.length < start) {
                callback(null, {status: 404, msg: "没有找到相关文章"});
                return
            }
            var end = start + limit;
            var isEnd = false;
            if (end > resp.length) {
                end = resp.length;
                isEnd = true;
            }
            var data = resp.slice(start, end);
            for (var i = 0; i < data.length; i++) {
                if (data[i]._fininshed) {
                    continue
                }
                var show = !("readme" === data[i].location || "README" === data[i].location || "about" === data[i].catalog);
                if (!show) {
                    data.splice(i, 1)
                    i--
                    continue
                }
                data[i].summary = data[i].summary.substr(0, 200);
                data[i].picture_color = App.nameColors.get(data[i].title)
                if (!data[i].author) {
                    data[i].author = MdRestConfig.Author;
                    data[i].author_avatar = "assets/images/avatar.png";
                }
                data[i].author_avatar_color = App.nameColors.get(data[i].author)
                if (!data[i].author_avatar) {
                    data[i].author_avatar_text = data[i].author.substr(0, 1);
                }
                data[i].date_local = moment((new Date(data[i].date))).fromNow();
                if (i === 0) {
                    data[i].isFirst = true;
                }
                if ("http" !== data[i].location.substring(0, 4)) {
                    data[i].href = "/page/" + data[i].location;
                }
                data[i]._fininshed = true;
            }

            var title = "首页";
            var pre = undefined;
            if (page > 1) {
                pre = "/pages/" + (page - 1)
                title = "第" + page + "页";
            }
            var next = undefined;
            if (!isEnd) {
                next = "/pages/" + (1 + page)
            }
            callback({
                data: data,
                blog_author: MdRestConfig.Author,
                slogan: MdRestConfig.Slogan,
                pre: pre,
                next: next,
                title: title,
                showProfile: (page === 1)
            })
        });
    };
    var getSummaryByTags = function (url, callback) {
        App.require.require(MdRestConfig.BasePath + "mdrest_index.json", "json", function (resp, err) {
            if (err) {
                callback(null, {status: 500, msg: "网络错误，请稍后重试"});
                return
            }
            var page = 1, limit = 8, tag = undefined;
            var urlSplits = url.split("/");
            if (urlSplits.length >= 3) {
                tag = urlSplits[2];
                if (urlSplits.length === 5) {
                    page = parseInt(urlSplits[4]);
                }
            }
            var data = [];
            for (var i = 0; i < resp.length; i++) {
                var tags = resp[i].tags;

                if (tags && tags.indexOf(tag) >= 0) {
                    data.push(resp[i]);
                }
            }
            var start = limit * (page - 1);
            if (data.length === 0 || data.length < start) {
                callback(null, {status: 404, msg: "没有找到相关文章"});
                return
            }
            var end = start + limit;
            var isEnd = false;
            if (end > data.length) {
                end = data.length;
                isEnd = true;
            }
            data = data.slice(start, end);
            for (var i = 0; i < data.length; i++) {
                if (data[i]._fininshed) {
                    continue
                }
                data[i].summary = data[i].summary.substr(0, 150 + (Math.round(Math.random() * 40)));
                data[i].picture_color = App.nameColors.get(data[i].title)
                if (!data[i].author) {
                    data[i].author = MdRestConfig.Author;
                    data[i].author_avatar = "assets/images/avatar.png";
                }
                data[i].author_avatar_color = App.nameColors.get(data[i].author)
                if (!data[i].author_avatar) {
                    data[i].author_avatar_text = data[i].author.substr(0, 1);
                }
                data[i].date_local = moment((new Date(data[i].date))).fromNow()
                if ("http" !== data[i].location.substring(0, 4)) {
                    data[i].href = "/page/" + data[i].location;
                }
                data[i]._fininshed = true;
            }
            var title = tag;
            var pre = undefined;
            if (page > 1) {
                pre = "/tag/" + tag + "/pages/" + (page - 1)
                title += " - 第" + page + "页";
            }
            var next = undefined;
            if (!isEnd) {
                next = "/tag/" + tag + "/pages/" + (1 + page)
            }
            callback({
                data: data,
                // pre: pre,
                // next:next,
                title: title,
                showProfile: false
            })
        });
    };
    var getSummaryByCatalog = function (url, callback) {
        App.require.require(MdRestConfig.BasePath + "mdrest_index.json", "json", function (resp, err) {
            if (err) {
                callback(null, {status: 500, msg: "网络错误，请稍后重试"});
                return
            }
            var page = 1, limit = 9, catalog = undefined;
            var urlSplits = url.split("/");
            if (urlSplits.length >= 3) {
                catalog = urlSplits[2];
                if (urlSplits.length === 5) {
                    page = parseInt(urlSplits[4]);
                }
            }
            var dataCatalog = [];
            for (var i = 0; i < resp.length; i++) {
                if (!resp[i].catalog) {
                    var locations = resp[i].location.split("/", 2);
                    if (locations.length === 2) {
                        resp[i].catalog = locations[0]
                    } else {
                        resp[i].catalog = "blog";
                    }
                }
                if (catalog === resp[i].catalog) {
                    dataCatalog.push(resp[i]);
                }
            }
            var start = limit * (page - 1);
            if (dataCatalog.length === 0 || dataCatalog.length < start) {
                callback(null, {status: 404, msg: "没有找到相关文章"});
                return
            }
            var end = start + limit;
            var isEnd = false;
            if (end > dataCatalog.length) {
                end = dataCatalog.length;
                isEnd = true;
            }
            var data = dataCatalog.slice(start, end);
            for (var i = 0; i < data.length; i++) {
                if (data[i]._fininshed) {
                    continue
                }
                data[i].summary = data[i].summary.substr(0, 200);
                data[i].picture_color = App.nameColors.get(data[i].title)
                if (!data[i].author) {
                    data[i].author = MdRestConfig.Author;
                    data[i].author_avatar = "assets/images/avatar.png";
                }
                data[i].author_avatar_color = App.nameColors.get(data[i].author)
                if (!data[i].author_avatar) {
                    data[i].author_avatar_text = data[i].author.substr(0, 1);
                }
                data[i].date_local = moment((new Date(data[i].date))).fromNow()
                if (i === 0) {
                    data[i].isFirst = true;
                }
                if ("http" !== data[i].location.substring(0, 4)) {
                    data[i].href = "/page/" + data[i].location;
                }
                data[i]._fininshed = true;
            }

            var title = catalog;
            var pre = undefined;
            if (page > 1) {
                pre = "/catalog/" + catalog + "/pages/" + (page - 1)
                title += " - 第" + page + "页";
            }
            var next = undefined;
            if (!isEnd) {
                next = "/catalog/" + catalog + "/pages/" + (1 + page)
            }
            callback({
                data: data,
                pre: pre,
                next: next,
                title: title,
                showProfile: false
            })
        });
    };
    var getTags = function (url, callback) {
        App.require.require(MdRestConfig.BasePath + "mdrest_index.json", "json", function (data, err) {
            if (err) {
                callback(null, {status: 500, msg: "网络错误，请稍后重试"});
                return
            }
            var tagsData = {};
            for (var i = 0; i < data.length; i++) {
                var tag = data[i].tags;
                if (tag) {
                    for (var j = 0; j < tag.length; j++) {
                        if (!tagsData[tag[j]]) {
                            tagsData[tag[j]] = []
                        }
                        tagsData[tag[j]].push({
                            title: data[i].title,
                            href: "/page/" + data[i].location
                        })
                    }
                }
            }
            var pageTagsData = {
                "tags": [],
                "pages": []
            };
            for (var key in tagsData) {
                pageTagsData.tags.push(key);
                pageTagsData.pages.push({
                    tag: key,
                    pages: tagsData[key]
                });
            }
            callback(pageTagsData)
        });
    };
    var getPage = function (url, callback) {
        var pageLocation = url.substr(6, url.length);
        if (url === "/about/me") {
            pageLocation = MdRestConfig.AboutPage
        }
        App.require.require(MdRestConfig.BasePath + pageLocation + ".json", "json", function (data, err) {
            if (err) {
                callback(null, {status: 404, msg: "没找到该文章"});
                return
            }
            data.picture_color = App.nameColors.get(data.title)
            if (!data.author) {
                data.author = MdRestConfig.Author;
                data.author_avatar = "assets/images/avatar.png";
            }
            data.author_avatar_color = App.nameColors.get(data.author);
            if (!data.author_avatar) {
                data.author_avatar_text = data.author.substr(0, 1);
            }
            data.date_local = moment((new Date(data.date))).fromNow();
            if (MdRestConfig.GitPage) {
                data.edit_link = MdRestConfig.GitPage + "/blob/master/" + data.location + ".md"
            }
            data.page_id = data.location;
            var url = encodeURI(window.location.origin + App.baseUrl + "/#" + App.url);
            data.share_weibo = "http://service.weibo.com/share/share.php?url=" + url + "&title=" + data.title;
            data.shre_weixin = "https://weixin.com/sharer/sharer.php?u=" + url;
            data.share_twitter = "https://twitter.com/intent/tweet?url=" + url + "&text=" + data.title;
            data.share_gplus = "https://plus.google.com/share?url=" + url;
            data.shre_facebook = "https://www.facebook.com/sharer/sharer.php?u=" + url;
            //TODO: 通过index 计算前一篇和后一篇, 放在页面内部异步运算，可以提高速度
            callback(data)
        });
    };

    return {
        getSummary: getSummary,
        getSummaryByTags: getSummaryByTags,
        getSummaryByCatalog: getSummaryByCatalog,
        getTags: getTags,
        getPage: getPage
    };
})();

