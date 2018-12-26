function notify(err) {
    console.log(err);
}

function getInitialState() {
    return {
        tokens: []
        , context: []
        , inQuote: false
        , jsonIdx: -1
        , quoteIdx: -1
    };
}

function popUntil(stack, val) {
    var i = stack.length - 1;
    while (i > -1) {
        if (val === stack[i]) {
            stack.length = i;
            return;
        }
        i--;
    }
}

function addCSS() {
    if (!document.getElementById("JipyCSS")) {
        var style = document.createElement('style');
        style.id = "JipyCSS";
        style.type = 'text/css';
        style.innerHTML =
            `@keyframes Jippy-error-flash {
    0% {
        background-color: red;
        opacity: 1;
    }
    100% {
        background-color: inherit;
    }
}
.jippy-cant-parse {
    animation-name: Jippy-error-flash;
    animation-duration: 500ms;
    animation-iteration-count: 1;
    animation-timing-function: ease;
}`;
        document.head.appendChild(style);
    }
}

function extractJSONs(str) {
    var jsons = [];
    if (!str) {
        return jsons;
    }
    var numbers = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'])
    var state = getInitialState();

    for (var i = 0; i < str.length; i++) {
        ch = str[i];

        if (state.inQuote) {
            if (ch === '"') {
                state.inQuote = false;
                state.tokens.push('v');
            }
            else if (ch === '\\') {
                i++;
            }
            continue;
        }
        if (ch === "\n" || ch === " " || ch === "\t" || ch == "\r") {
            continue;
        }
        if (state.context.length === 0 && (ch === '{' || ch === '[')) {
            state.tokens.push(ch);
            state.context.push(ch === "{" ? 'o' : 'a');
            if (state.jsonIdx === -1) {
                state.jsonIdx = i;
            }
            continue;
        }
        if (!state.context.length) {
            continue;
        }

        var context = state.context[state.context.length - 1];
        if (ch === '"') {
            state.inQuote = true;
            state.quoteIdx = i;
            continue;
        }
        else if (ch === ",") {
            // comma is valid in context of array and object
            if (state.tokens[state.tokens.length - 1] === 'v'
                && (state.tokens[state.tokens.length - 2] === ':'
                    || state.tokens[state.tokens.length - 2] === ','
                    || state.tokens[state.tokens.length - 2] === '['
                )) {
                state.tokens.push(',');
                continue;
            }
        }
        else if (ch === ":") {
            if (state.tokens[state.tokens.length - 1] === 'v' && context === 'o') {
                state.tokens.push(':');
                continue;
            }
        }

        // ok as value
        else if (ch === "{") {
            if (state.tokens[state.tokens.length - 1] === ':' // expecting value --> ok
                || (state.tokens[state.tokens.length - 1] === ',' // if previous is comma make sure it is not expecting key
                    && (state.tokens[state.tokens.length - 3] === ',' || state.tokens[state.tokens.length - 3] === '['))
                || state.tokens[state.tokens.length - 1] === '['
            ) {
                state.tokens.push('{');
                state.context.push('o');
                continue;
            }
        }

        else if (ch === "[") {
            if (state.tokens[state.tokens.length - 1] === ':' // expecting value --> ok
                || (state.tokens[state.tokens.length - 1] === ',' // if previous is comma make sure it is not expecting key
                    && (state.tokens[state.tokens.length - 3] === ',' || state.tokens[state.tokens.length - 3] === '['))
                || state.tokens[state.tokens.length - 1] === '['
            ) {
                state.tokens.push('[');
                state.context.push('a');
                continue;
            }
        }
        else if (ch === "}") {
            if (state.tokens[state.tokens.length - 1] === '{'
                || (state.tokens[state.tokens.length - 1] === 'v' && state.tokens[state.tokens.length - 2] === ':')) {
                popUntil(state.tokens, '{');
                state.context.pop();
                if (state.tokens.length === 0) {
                    jsons.push([state.jsonIdx, i]);
                    state.jsonIdx = -1
                }
                else {
                    state.tokens.push('v');
                }
                continue;
            }
        }

        else if (ch === "]") {
            if (state.tokens[state.tokens.length - 1] === '['
                || (state.tokens[state.tokens.length - 1] === 'v'
                    && (state.tokens[state.tokens.length - 2] === ',' || state.tokens[state.tokens.length - 2] === '['))) {
                popUntil(state.tokens, '[');
                state.context.pop();
                if (state.tokens.length === 0) {
                    jsons.push([state.jsonIdx, i]);
                    state.jsonIdx = -1;
                }
                else {
                    state.tokens.push('v');
                }
                continue;
            }
        }

        else if (ch === "n") {
            //null
            if (str[i + 1] === "u" && str[i + 2] === "l" && str[i + 3] === "l") {
                state.tokens.push('v');
                i += 3;
                continue;
            }
        }
        else if (ch === "t") {
            //true
            if (str[i + 1] === "r" && str[i + 2] === "u" && str[i + 3] === "e") {
                state.tokens.push('v');
                i += 3;
                continue;
            }
        }
        else if (ch === "f") {
            //false
            if (str[i + 1] === "a" && str[i + 2] === "l" && str[i + 3] === "s" && str[i + 4] === "e") {
                state.tokens.push('v');
                i += 4;
                continue;
            }
        }
        else if ((ch === "-" || numbers.has(ch))
            && (state.tokens[state.tokens.length - 1] === ':' // expecting value --> ok
                || (state.tokens[state.tokens.length - 1] === ',' // if previous is comma make sure it is not expecting key
                    && (state.tokens[state.tokens.length - 3] === ',' || state.tokens[state.tokens.length - 3] === '[')
                ))) {
            var expectDacimal = false;
            var expectNumber = ch === '-';
            var seenDot = false;

            for (var j = i + 1; j < str.length; j++) {
                if (numbers.has(str[j])) {
                    i = j;
                    if (expectNumber) {
                        expectNumber = false;
                    }
                    else if (expectDacimal) {
                        expectDacimal = false;
                    }
                    continue;
                }
                else if (str[j] === '.') {
                    i = j
                    expectDacimal = true;
                    if (seenDot) {
                        break;
                    }
                    seendot = true;
                    continue;
                }
                break;
            }
            if (!expectNumber && !expectDacimal) {
                state.tokens.push('v');
                continue;
            }
        }

        // invalid token at this point
        // reset state and move on
        if (state.inQuote) {
            i = state.quoteIdx;
        }
        state = getInitialState();
    }
    return jsons;
}

function computeStartEnd(html, prefix, text) {
    var start = -1;
    var tag = false;
    var whitespace = new Set([' ', '\t', '\r', '\n']);

    var current_idx = 0;
    var runner = 0;
    prefix = prefix.trim();
    if (prefix) {
        for (; current_idx < html.length; current_idx++) {
            var ch = html[current_idx];

            if (whitespace.has(ch)) {
                continue;
            }

            if (ch === ">") {
                tag = false;
                continue;
            }

            if (tag) {
                continue;
            }
            if (ch === "<") {
                tag = true;
                continue;
            }

            if (ch === prefix[runner]) {
                while (runner < prefix.length) {
                    runner++;
                    if (!whitespace.has(prefix[runner])) {
                        break;
                    }
                }
                if (runner === prefix.length) {
                    current_idx++;
                    break;
                }
            }
        }
    }

    runner = 0
    tag = false;
    for (; current_idx < html.length; current_idx++) {
        var ch = html[current_idx];

        if (ch === ">") {
            tag = false;
            continue;
        }

        if (tag) {
            continue;
        }
        if (ch === "<") {
            tag = true;
            continue;
        }
        if (ch === text[runner]) {
            if (start === -1) {
                start = current_idx;
            }
            runner++;
            if (runner === text.length) {
                break;
            }
        }
    }

    return [start, current_idx];
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function wrapWithPreCode(node, prefix, formattedText, text) {
    var html = node.innerHTML;
    var [start, end] = computeStartEnd(html, prefix, text);
    if (start === -1) {
        return "Cannot Align";
    }
    prefix = html.substr(0, start);
    var suffix = html.substr(end + 1);

    node.innerHTML = `${prefix}<div><pre><code>${escapeHtml(formattedText)}</pre></code></div>${suffix}`;
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

    var tmp;
    try {
        tmp = JSON.parse(text);
    }
    catch (err) {
        return err;
    }

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

    if (nodeType === "TEXTAREA") {
        var suffix = original.substr(end_idx);
        return replaceAsIs(node, prefix, formattedText, suffix);
    }
    else {
        return wrapWithPreCode(node, prefix, formattedText, text);
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

function flash(node) {
    addCSS();
    node.classList.add("jippy-cant-parse");
    setTimeout(() => { node.classList.remove("jippy-cant-parse") }, 510);
}

chrome.runtime.onMessage.addListener(
    function (message) {
        try {
            if (message !== "Jipy:fmtJSON" && message !== "Jipy:fmtJSONString") {
                return;
            }

            var selection = window.getSelection();
            var selectedText = selection.toString().trim();
            var node = selection.focusNode || selection.anchorNode; // anchorNode == first, focusNode == last node the selection fall on; SEE: https://developer.mozilla.org/en-US/docs/Web/API/Selection#Properties
            if (!node) {
                return;
            }
            if (node.nodeType === 3) { // TEXT NODE SEE: https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType#Constants
                node = node.parentNode
            }
            // SEE: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent#Differences_from_innerText
            if (!node.innerText.includes(selectedText)) {
                node = findNodeByText(node, selectedText);
            }

            if (!node) {
                return;
            }

            if ((selectedText.startsWith("{") && selectedText.endsWith("}"))
                || (selectedText.startsWith("[") && selectedText.endsWith("]"))) {
                err = replace(node, selectedText, message === "Jipy:fmtJSONString");
                if (!err) {
                    return;
                }
            }
            var longtext = node.innerText || node.value;
            var candidates = extractJSONs(longtext);

            if (candidates.length === 0) {
                flash(node);
                return;
            }

            var errorCount = 0;
            for (var i = 0; i < candidates.length; i++) {
                err = replace(node, longtext.substr(candidates[i][0], candidates[i][1] - candidates[i][0] + 1), message === "Jipy:fmtJSONString");
                if (err) {
                    errorCount++;
                    notify(err);
                }
            }

            if (errorCount === candidates.length) {
                flash(node);
            }
        }
        catch (err) {
            notify(err);
        }
    }
);