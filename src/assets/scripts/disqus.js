'use strict';

var MdRestDisqus = (function () {
    function loadTo(element, postUrlTag, postId, countAble) {
        if(!MdRestConfig.Disqus){
            return
        }
        var url = window.location.origin + App.baseUrl + '/#!'  + postUrlTag;
        element.innerHTML = '<div id="disqus_thread"></div>';
        window.disqus_config = function () {
            this.page.url = url;  // Replace PAGE_URL with your page's canonical URL variable
            this.page.identifier = postId; // Replace PAGE_IDENTIFIER with your page's unique identifier variable
        };
        if(countAble){
            if (window.DISQUSWIDGETS) {
                window.DISQUSWIDGETS.getCount({reset: true});
            } else {
                setTimeout(function () {
                    var dsqC = document.createElement('script'); dsqC.type = 'text/javascript';
                    dsqC.async = true;
                    dsqC.src = 'https://' + MdRestConfig.Disqus + '.disqus.com/count.js';
                    dsqC.id = "dsq-count-scr";
                    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsqC);
                },1500)
            }
        }
        if (window.DISQUS) {
            // Horrible, but jQuery wasn't removing the div elements fully
            document.querySelectorAll( ".comments-load").forEach(function (element) {
                var len = this.childNodes.length;
                for(var i = 0; i < len; i++)
                {
                    if (this.childNodes[i].tagName == "DIV") {
                        this.removeChild(this.childNodes[i]);
                    }
                }
            });
            window.DISQUS.reset({
                reload: true,
                config: function () {
                    this.page.identifier = postId;
                    this.page.url = url;
                }
            });
        } else {
            //time out for other dom done
            setTimeout(function () {
                var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
                dsq.src = 'https://' + MdRestConfig.Disqus + '.disqus.com/embed.js';
                (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
            },1500)
        }
    }
    return {
        loadTo: loadTo
    };
})();
