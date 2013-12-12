dashboard
=========

A html iframe based customizable dashboard chrome extension


Usage
---

To enable the dashboard functionality for the site the following meta tag must be present
in the head section.

```
<meta name="dashboard" />
```

You can use the dashboard like a normal html page. For iFrames there are some extra
attributes controlling the behaviour of the frame.

### data-refresh

With the `data-refresh` attribute you can specify an refresh rate of the iframe. The value
is the refresh interval in seconds.

### data-css

The `data-css` attribute defines a custom css injected into the iframe. The value can be

* an url
* a reference like #my-css to an internal script block with this css as text content

```
<script type="text/css" id="my-css">
    body {
        background: red;
    }
</script>
```

