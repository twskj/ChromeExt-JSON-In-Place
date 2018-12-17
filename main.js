function notify(err) {
    console.log(err);
}

function guess(node, selection) {
    if (!node) {
        return;
    }
    var text = node.innerText || node.value;
    var start_idx = text.indexOf("{");
    var end_idx = text.lastIndexOf("}");
    if (start_idx == -1 || end_idx == -1 || end_idx < start_idx) {
        return "";
    }
    return text.substr(start_idx, end_idx - start_idx + 1);

    //TODO: use stack(s) to figure out nearest object
    // find longest sequence inside-out, outside-in
    // 1. click outside of json (left of json)
    // 2. click outside of json (right of json)
    // 3. click in json --> working outward --> using stack
    // 4. click between json -> prefer closer json
}

function wrapWithPreCode(node, prefix, text, suffix) {
    var pre = document.createElement("pre");
    var code = document.createElement("code");

    pre.appendChild(code);
    code.innerText = text;

    node.innerText = "";
    if (prefix) {
        var div = document.createElement("div");
        div.innerText = prefix;
        node.appendChild(div);
    }
    node.appendChild(pre);
    if (suffix) {
        var div = document.createElement("div");
        div.innerText = suffix;
        node.appendChild(div);
    }
}

function replaceAsIs(node, prefix, text, suffix) {

    var result = [];
    if (prefix) {
        result.push(prefix);
    }
    result.push(text);
    if (suffix) {
        result.push(suffix);
    }
    node.value = result.join("\n");
}

function replace(node, text, unEscapeMode) {

    var tmp = JSON.parse(text);

    if (unEscapeMode) {
        if (Array.isArray(tmp)) {
            unEscapeArray(tmp);
        }
        else {
            unEscapeObj(tmp);
        }
    }

    var formattedText = JSON.stringify(tmp, null, 3);
    tmp = undefined;
    var nodeType = node.nodeName.toUpperCase();

    var original = node.innerText || node.value;
    var start_idx = original.indexOf(text);
    var end_idx = start_idx + text.length;

    var prefix = original.substr(0, start_idx);
    var suffix = original.substr(end_idx);

    if (nodeType === "TEXTAREA") {
        replaceAsIs(node, prefix, formattedText, suffix);
    }
    else {
        wrapWithPreCode(node, prefix, formattedText, suffix);
    }
}

function findNodeByText(node, txt) {
    if (node.nodeType === 3) { // TEXT NODE
        node = node.parentNode
    }
    var children = node.childNodes;
    var nodeType, val;

    for (var i = 0; i < children.length; i++) {
        nodeType = children[i].nodeName.toUpperCase();
        switch (nodeType) {
            case "TEXTAREA":
                val = children[i].value;
                break;
            case "#TEXT":
                val = children[i].textContent;
                break;
            default:
                val = children[i].innerText;
                break;
        }
        if (val.includes(txt)) {
            return children[i];
        }
    }
    var parent = node.parentNode;
    if (parent.innerText.includes(txt)) {
        return parent;
    }
    return node;
}

function unEscapeArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        var val = arr[i];
        if (typeof val === "string") {
            val = val.trim();
            if ((val.startsWith("{") && val.endsWith("}"))
                || (val.startsWith("[") && val.endsWith("]"))) {
                try {
                    arr[i] = JSON.parse(val);
                }
                catch (err) { }
            }
        }
        else if (Array.isArray(val)) {
            unEscapeArray(val);
        }
        else if (typeof val === "object") {
            unEscapeObj(val);
        }
    }
}

function unEscapeObj(obj) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
        var val = obj[keys[i]];
        if (typeof val === "string") {
            val = val.trim();
            if ((val.startsWith("{") && val.endsWith("}"))
                || (val.startsWith("[") && val.endsWith("]"))) {
                try {
                    obj[keys[i]] = JSON.parse(val);
                }
                catch (err) { }
            }
        }
        else if (Array.isArray(val)) {
            unEscapeArray(val);
        }
        else if (val && typeof val === "object") { //skip null
            unEscapeObj(val);
        }
    }
}

chrome.runtime.onMessage.addListener(
    function (message) {
        try {
            if (message !== "Jipy:fmtJSON" && message !== "Jipy:fmtJSONString") {
                return;
            }

            var selection = window.getSelection();
            var selectedText = selection.toString().trim();
            var node = selection.focusNode; // focusNode == last node the selection fall on; SEE: https://developer.mozilla.org/en-US/docs/Web/API/Selection#Properties
            if (node.nodeType === 3) { // TEXT NODE SEE: https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType#Constants
                node = node.parentNode
            }
            // SEE: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent#Differences_from_innerText
            if (!node.innerText.includes(selectedText)) {
                node = findNodeByText(node, selectedText);
            }
            if (
                !(selectedText.startsWith("{") && selectedText.endsWith("}"))
                && !(selectedText.startsWith("[") && selectedText.endsWith("]"))
            ) {
                selectedText = guess(node, selection);
            }

            if (!selectedText) {
                return;
            }

            replace(node, selectedText, message === "Jipy:fmtJSONString");
        }
        catch (err) {
            notify(err);
        }
    }
);