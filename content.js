/***
 * this is the content script, which will be injected in all pages and checks if the page
 * defines a <meta name="dashboard" /> directive. If so it will setup refresh timers and
 * scroll to defined positions
 */
(function(chrome, document, window) {

    /***
     * Check if the page is a dashboard enabled page
     * Check if we can inject content scripts dynamically in iframes
     * - if so, we can add a post receive message between these frames
     */

    var isIframe = window.parent !== window && window.parent !== null,
        isDashboard = !isIframe && document.querySelectorAll("meta[name='dashboard']").length > 0,
        frames = [],
        iFrameClient = {
            reload: function() {
                window.location.reload();
            },
            addCss: function(data) {
                var css;

                if (data && data.style) {
                    css = document.createElement("style");
                    css.type = "text/css";
                    css.innerText = data.style;
                } else if (data && data.styleUrl) {
                    css = document.createElement("link");
                    css.rel = "stylesheet";
                    css.type = "text/css";
                    css.href = data.styleUrl;
                }

                if (!css) {
                    console.error("addCss method received invalid data.", data);
                    return;
                }

                var head = document.getElementsByTagName("head")[0];
                head.appendChild(css);
            }
        },
        dashboardClient = {
        },
        client = isIframe ? iFrameClient : dashboardClient;

    if (isDashboard) {
        frames = Array.prototype.slice.call(document.querySelectorAll("iframe"));

        frames.forEach(function(frame) {
            frame.invoke = function(method, data) {
                // TODO: we could also read the origin from the iframe
                frame.contentWindow.postMessage({
                    method: method,
                    data: data
                }, "*");
            };

            processCssForFrame(frame);

            var refreshRate = parseInt(frame.getAttribute("data-refresh"));
            if (!isNaN(refreshRate)) {
                // a number was given in seconds
                setInterval(function() {

                    frame.invoke("reload");


                }, refreshRate * 1000);
            }
        });
    }

    window.addEventListener("message", function(event) {

        // TODO: check origin
        var data = event.data,
            method = client[data.method];

        if (method) {
            // method is available in client
            method(data.data, event)
        } else {
            console.log("No handler for method '"+ data.method + "' found!", event);
        }

    }, false);

    console.log({
        greeting: document.title,
        isIframe: isIframe,
        isDashboard: isDashboard
    });

    function processCssForFrame(frame) {
        var cssUri = frame.getAttribute("data-css"),
            css;

        if (cssUri === null) {
            return;
        }

        if (/^#/.test(cssUri)) {
            // css is references by id
            var scriptBlock = document.querySelector(cssUri);
            if (!scriptBlock) {
                console.error("References css block '" + cssUri + "' not found.");
                return;
            }

            css = {
                style: scriptBlock.innerText
            };

        } else {
            css = {
                styleUrl: cssUri
            };
        }

        frame.invoke("addCss", css);
    }

})(chrome, document, window);