# Jipy (JSON In-Place)

A Chrome Extension that allows you to format JSON in browser. Unlike other formatters, Jipy does not rely on the whole page being returned as JSON. Jipy works by let you choose the portion of text that you want to format. This allows you to format any embeded JSON.

# Usage
1. Highlight the portion you want to format (whole or partial)
2. Format
    - Use hotkey (Alt+F),(Alt+Shift+F)
    - Use context menu (Right-Click > `Format JSON`)
    - Use extension button (located at top right corner)
3. Enjoy!

# Mode
- `Format JSON` (Alt+F) -> format JSON like we normally would
- `Format Escaped JSON` (Alt+Shift+F) -> format JSON as well as iterate over each value and format it if applicable

### For example
Consider this JSON as our input:
```js
{"hello": "world", "embeded": "{\"hello\":\"world\"}"}
```

**Format JSON** yields 
```js
{
   "hello": "world",
   "embeded": "{\"hello\":\"world\"}"
}
```

**Format Escaped JSON** yields
```js
{
   "hello": "world",
   "embeded": {
      "hello": "world"
   }
}
```

# Note
Jipy uses highlight portion as its guideline. If it is a valid json, Jipy will format that portion. If it isn't Jipy will try to extract JSON(s) from that DOM.


## Support on Beerpay
Like the project? buy me a couple of :beers:!

[![Beerpay](https://beerpay.io/twskj/ChromeExt-JSON-In-Place/badge.svg?style=beer-square)](https://beerpay.io/twskj/ChromeExt-JSON-In-Place)  [![Beerpay](https://beerpay.io/twskj/ChromeExt-JSON-In-Place/make-wish.svg?style=flat-square)](https://beerpay.io/twskj/ChromeExt-JSON-In-Place?focus=wish)
