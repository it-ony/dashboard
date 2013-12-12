/***
 * this is the content script, which will be injected in all pages and checks if the page
 * defines a <meta name="dashboard" /> directive. If so it will setup refresh timers and
 * scroll to defined positions
 */
(function (chrome, document, window) {

    /***
     * Check if the page is a dashboard enabled page
     * Check if we can inject content scripts dynamically in iframes
     * - if so, we can add a post receive message between these frames
     */

    var isIframe = window.parent !== window && window.parent !== null,
        isDashboard = !isIframe && document.querySelectorAll("meta[name='dashboard']").length > 0,
        frames = [],
        framesLoading = {},
        iFrameClient = {
            reload: function () {
                window.location.reload();
            },
            addCss: function (data) {
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
            },
            scrollTo: function (position) {
                window.scrollTo(position.pageXOffset, position.pageYOffset);
            }
        },
        dashboardClient = {

            _getIFrameForWindow: function (window) {
                // find frame
                for (var i = 0; i < frames.length; i++) {
                    var frame = frames[i];

                    if (frame.contentWindow === window) {
                        // found the frame
                        // send by the iframe, after the content script has been injected
                        return {
                            frame: frame,
                            index: i
                        };
                    }
                }

                return null;
            },

            _getUniqueKey: function () {
                return "dashboard" + location.pathname;
            },

            _save: function (key, value) {
                var uniqueKey = this._getUniqueKey();

                var data = JSON.parse(localStorage.getItem(uniqueKey) || "{}");

                data[key] = value;
                localStorage.setItem(uniqueKey, JSON.stringify(data));
            },

            _get: function (key, defaultValue) {
                var uniqueKey = this._getUniqueKey();
                var data = JSON.parse(localStorage.getItem(uniqueKey) || "{}");

                return data[key] || defaultValue;
            },

            ready: function (data, event) {
                var frame = this._getIFrameForWindow(event.source);

                if (!frame) {
                    return;
                }

                processCssForFrame(frame.frame);

                framesLoading[frame.index] = false;

                var scrollPosition = this._get("frame_" + frame.index);
                if (scrollPosition) {
                    frame.frame.invoke("scrollTo", scrollPosition);
                }

            },

            scrolled: function (data, event) {

                if (!window.localStorage) {
                    return;
                }

                var frame = this._getIFrameForWindow(event.source);
                if (frame && framesLoading[frame.index] !== true) {
                    // save scroll position in localStorage
                    this._save("frame_" + frame.index, data);
                }
            }
        },
        client = isIframe ? iFrameClient : dashboardClient;

    if (isDashboard) {
        frames = Array.prototype.slice.call(document.querySelectorAll("iframe"));

        frames.forEach(function (frame, index) {
            framesLoading[index] = true;

            frame.invoke = function (method, data) {
                // TODO: we could also read the origin from the iframe
                frame.contentWindow.postMessage({
                    method: method,
                    data: data
                }, "*");
            };

            var x = parseInt(frame.getAttribute("data-scroll-x")) || 0,
                y = parseInt(frame.getAttribute("data-scroll-y")) || 0;

            if (x || y) {
                dashboardClient._save("frame_" + index, {
                    pageXOffset: x,
                    pageYOffset: y
                });
            }

            var refreshRate = parseInt(frame.getAttribute("data-refresh"));
            if (!isNaN(refreshRate)) {
                // a number was given in seconds
                setInterval(function () {
                    frame.invoke("reload");
                }, refreshRate * 1000);
            }

        });
    } else {
        // Notify the dashboard that the content script has been loaded
        // so the dashboard can inject us the css
        window.parent.postMessage({
            method: "ready"
        }, "*");

        window.addEventListener("scroll", function () {
            window.parent.postMessage({
                method: "scrolled",
                data: {
                    pageXOffset: window.pageXOffset,
                    pageYOffset: window.pageYOffset
                }
            }, "*");
        }, false);

    }

    window.addEventListener("message", function (event) {

        // TODO: check origin
        var data = event.data,
            method = client[data.method];

        if (/^_/.test(data.method || "")) {
            // private method
            return;
        }

        if (method) {
            // method is available in client
            method.call(client, data.data, event)
        } else {
            console.log("No handler for method '" + data.method + "' found!", event);
        }

    }, false);


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