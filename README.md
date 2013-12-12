A html iframe based customizable dashboard chrome extension. A what?

This is a chrome extension that helps create a html based monitoring dashboard. The dashbord
itself is just a html page with several iframes. For the most iframe sources (e.g. jenkins,
calenders, travis, ...) you cannot customize the service. This extension allows you to add
custom css, restore scroll positions and refresh the page in a regular interval without
modifying the original source.

Download the chrome extension from here: https://chrome.google.com/webstore/detail/monitor-dashboard/hiachllpealpbigdgiocibkaebhifhgd

Usage
===

Start with a html page and embed external html documents as iframe.

To enable the dashboard functionality for the site the following meta tag must be present
in the head section.

```html
<meta name="dashboard" />
```

You can use the dashboard like a normal html page with css and javascript.
For iFrames the extension evaluate some extra attributes controlling the behaviour of the
frame. These are the available attributes:

data-refresh
---

With the `data-refresh` attribute you can specify an refresh rate of the iframe. The value
is the refresh interval in seconds.

data-css
---

The `data-css` attribute defines a custom css injected into the iframe. The value can be

* an url
* a reference like #my-css to an internal script block with this css as text content

```html
<script type="text/css" id="my-css">
    body {
        background: red;
    }
</script>
```

data-scroll-x, data-scroll-y
---

The scroll position of the frames is saved to the local storage, to have a consistent view
during the refresh. If you want start with a scroll position not read from the
localStorage you can set the `data-scroll-x` and `data-scroll-y` attributes on the
corresponding iframe.


Tips
===

If you want to embed frames, that deny embedding via the `X-Frame-Options` header, you
can help yourself with the
[ignore-x-frame-headers](https://chrome.google.com/webstore/detail/ignore-x-frame-headers/gleekbfjekiniecknbkamfmkohkpodhe) chrome extension.

License
===

This project is available under the MIT license. See [LICENSE](https://github.com/it-ony/dashboard/blob/master/LICENSE) for details.








