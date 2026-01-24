'use strict';
var Oauth = (function () {
    var clientId = "hb42UjlA-mgb9XExUViQAA";
    var authorizeUrl = "https://account.nx.run/web/page/oauth/";
    var userInfoUrl = "https://account.nx.run/auth/v1/user/me";
    var accountMgrUrl = "https://account.nx.run";
    var cookieName = "access_token";
    var queryString = function (query) {
        var result = {};
        if(query === "" || query === undefined) {
            return result;
        }
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if (typeof result[pair[0]] === "undefined") {
                result[pair[0]] = decodeURIComponent(pair[1]);
            } else if (typeof result[pair[0]] === "string") {
                var arr = [ result[pair[0]],decodeURIComponent(pair[1]) ];
                result[pair[0]] = arr;
            } else {
                result[pair[0]].push(decodeURIComponent(pair[1]));
            }
        }
        return result;
    };

    function login() {
       var state = Math.random().toString(36).substr(2).toLowerCase();
       var url = authorizeUrl + "?response_type=token&scope=profile%20email&" + "&client_id=" + clientId + "&state=" + state  + "&redirect_uri=" + encodeURI(window.location.href)
        window.location.href = url;
    }

    function profile() {
        window.location.href = accountMgrUrl;
    }

    function logout() {
        localStorage.removeItem("userinfo");
        localStorage.removeItem("token");
        window.location.replace(accountMgrUrl+ "/web/page/oauth/#sign_out=true&redirect_uri=" + encodeURI(window.location.href))
    }

    function updateUserInfoDoms(userinfo) {
        document.querySelectorAll(".after-login.profile").forEach(function (element) {
            element.querySelector(".name").innerText = userinfo.name;
            var email = element.querySelector(".email");
            if(userinfo.email && email) {
                email.innerText = userinfo.email;
                email.classList.remove("hidden")
            }
            element.querySelectorAll(".avatar").forEach(function (avatar) {
                if(userinfo.picture) {
                    avatar.style.backgroundImage = "url("+ userinfo.picture + ")"
                }else {
                    avatar.style.backgroundColor = App.nameColors.get(userinfo.name)
                    avatar.innerText = userinfo.name.substr(0,1)
                }
            })
        })
        document.body.classList.add("is-login")
    }

    function handleUserInfo() {
        var userinfoStr = localStorage.getItem("userinfo");
        if(userinfoStr) {
            var userinfo = JSON.parse(userinfoStr);
            updateUserInfoDoms(userinfo)
            return true
        }

        var hash = window.location.hash.substring(1);
        if (hash !== "" && "/" !== hash.substr(0,1)) {
            var hashQuery = queryString(hash);
            if (hashQuery.error) {
                console.log(hashQuery);
                return false;
            } else {
                if (!(hashQuery.access_token && hashQuery.expires_in)){
                    return false;
                }
                var exp = new Date();
                exp.setTime(exp.getTime() + (parseInt(hashQuery.expires_in) - 60)*1000);
                hashQuery.expires_at = exp;
                localStorage.setItem("token", JSON.stringify(hashQuery));
                App.require.require(userInfoUrl+"?access_token="+hashQuery.access_token, 'json', function (data,err) {
                    if(err) {
                        console.log(err);
                        showLoginButton();
                        return
                    }
                    var userInfo = {
                        name: data.name,
                        email:data.email,
                        picture: data.picture,
                    };
                    if ((data.picture !== undefined) &&  ("http" !== data.picture.substr(0,4))) {
                        userInfo.picture = accountMgrUrl + data.picture;
                    }

                    if(!userInfo.email){
                        userInfo.email = "未设置邮箱"
                    }
                    console.log(userInfo)
                    localStorage.setItem("userinfo", JSON.stringify(userInfo));
                    window.history.pushState("", document.title, window.location.pathname);
                    updateUserInfoDoms(userInfo)
                    return true

                });
                return true;
            }
        }
        return false;
    }


    var showLoginButton = function () {
        document.querySelectorAll("a.oauth-login").forEach(function (element) {
            element.href =  "javascript:Oauth.login()";
            element.classList.remove("hidden");
        })
    }


    function init() {
            if(MdRestConfig.LoginAble && !handleUserInfo()){
                showLoginButton()
            }
    }
    return {
        init: init,
        login:login,
        logout:logout,
        profile:profile
    };
})();

Oauth.init();
