// Poor-man test harness — no dependencies, runs with `node test.js`
var passed = 0;
var failed = 0;

function assert(condition, name) {
    if (condition) {
        passed++;
        console.log("  ✅ " + name);
    } else {
        failed++;
        console.log("  ❌ " + name);
    }
}

function assertDeep(actual, expected, name) {
    assert(JSON.stringify(actual) === JSON.stringify(expected),
        name + " — got " + JSON.stringify(actual));
}

var fs = require("fs");
var src = fs.readFileSync(__dirname + "/main.js", "utf8");
src = src.replace(/^"use strict";\n?/, ""); // strip for eval compatibility

var chrome = { runtime: { onMessage: { addListener: function() {} } } };
var document = {
    getElementById: function() { return null; },
    createElement: function() { return { innerHTML: "", innerText: "" }; },
    head: { appendChild: function() {} }
};
var window = { getSelection: function() {} };
var setTimeout = global.setTimeout;

eval(src);

// ============================================================
console.log("\n--- extractJSONs ---");

assertDeep(extractJSONs('{"a":1}'), [[0, 6]], "simple object");
assertDeep(extractJSONs('[1,2,3]'), [[0, 6]], "simple array");
assertDeep(extractJSONs('hello {"a":1} world'), [[6, 12]], "object in text");
assertDeep(extractJSONs(''), [], "empty string");
assertDeep(extractJSONs(null), [], "null input");
assertDeep(extractJSONs('no json here'), [], "no json");
assertDeep(extractJSONs('{"a":"b","c":"d"}'), [[0, 16]], "multi-key object");
assertDeep(extractJSONs('[{"a":1},{"b":2}]'), [[0, 16]], "array of objects");
assertDeep(extractJSONs('{"nested":{"a":1}}'), [[0, 17]], "nested object");
assertDeep(extractJSONs('{"a":1.2.3}'), [], "double dot number should fail");
assertDeep(extractJSONs('{"a":1.5}'), [[0, 8]], "valid decimal number");
assertDeep(extractJSONs('[1]'), [[0, 2]], "number as first array element");
assertDeep(extractJSONs('[1,2]'), [[0, 4]], "numbers in array");
assertDeep(extractJSONs('[null]'), [[0, 5]], "null as first array element");
assertDeep(extractJSONs('[true]'), [[0, 5]], "true as first array element");
assertDeep(extractJSONs('[false]'), [[0, 6]], "false as first array element");
assertDeep(extractJSONs('[true,false,null]'), [[0, 16]], "literals in array");
assertDeep(extractJSONs('[1,{"a":2}]'), [[0, 10]], "number then object in array");
assertDeep(extractJSONs('[-1]'), [[0, 3]], "negative number as first array element");
assertDeep(extractJSONs('[{}]'), [[0, 3]], "empty object in array");
assertDeep(extractJSONs('[[]]'), [[0, 3]], "empty array in array");
assertDeep(extractJSONs('{"a":[1,2]}'), [[0, 10]], "array value in object");
assertDeep(extractJSONs('[{"a":1},2,null]'), [[0, 15]], "mixed array");

// Numbers
console.log("\n--- extractJSONs: numbers ---");
assertDeep(extractJSONs('{"a":0}'), [[0, 6]], "zero");
assertDeep(extractJSONs('{"a":-0}'), [[0, 7]], "negative zero");
assertDeep(extractJSONs('{"a":-1.5}'), [[0, 9]], "negative decimal");
assertDeep(extractJSONs('{"a":1e10}'), [[0, 9]], "exponent notation");
assertDeep(extractJSONs('{"a":1.5E-3}'), [[0, 11]], "decimal with negative exponent");
assertDeep(extractJSONs('{"a":1E+2}'), [[0, 9]], "exponent with plus sign");
assertDeep(extractJSONs('{"a":01}'), [], "leading zero should fail");
assertDeep(extractJSONs('{"a":100}'), [[0, 8]], "multi-digit number");
assertDeep(extractJSONs('{"a":-100}'), [[0, 9]], "negative multi-digit");

// Strings with escape sequences
console.log("\n--- extractJSONs: strings ---");
assertDeep(extractJSONs('{"a":""}'), [[0, 7]], "empty string value");
assertDeep(extractJSONs('{"a":"hello\\nworld"}'), [[0, 19]], "string with newline escape");
assertDeep(extractJSONs('{"a":"tab\\there"}'), [[0, 16]], "string with tab escape");
assertDeep(extractJSONs('{"a":"back\\\\slash"}'), [[0, 18]], "string with backslash escape");
assertDeep(extractJSONs('{"a":"quo\\"te"}'), [[0, 14]], "string with escaped quote");
assertDeep(extractJSONs('{"a":"sl\\/ash"}'), [[0, 14]], "string with escaped slash");
assertDeep(extractJSONs('{"a":"\\u0041"}'), [[0, 13]], "string with unicode escape");
assertDeep(extractJSONs('{"a":"braces { } [ ]"}'), [[0, 21]], "string containing braces");
assertDeep(extractJSONs('{"a":"colon : comma ,"}'), [[0, 22]], "string containing colon and comma");

// Nesting
console.log("\n--- extractJSONs: nesting ---");
assertDeep(extractJSONs('{"a":{"b":{"c":1}}}'), [[0, 18]], "deeply nested objects");
assertDeep(extractJSONs('[[1],[2]]'), [[0, 8]], "array of arrays");
assertDeep(extractJSONs('[[[1]]]'), [[0, 6]], "triple nested array");
assertDeep(extractJSONs('{"a":[{"b":[1,2]}]}'), [[0, 18]], "object with nested array of objects");

// Empty containers
console.log("\n--- extractJSONs: empty containers ---");
assertDeep(extractJSONs('{}'), [[0, 1]], "empty object");
assertDeep(extractJSONs('[]'), [[0, 1]], "empty array");

// Whitespace
console.log("\n--- extractJSONs: whitespace ---");
assertDeep(extractJSONs('{ "a" : 1 }'), [[0, 10]], "object with spaces");
assertDeep(extractJSONs('{\n"a":\n1\n}'), [[0, 9]], "object with newlines");
assertDeep(extractJSONs('{\t"a":\t1}'), [[0, 8]], "object with tabs");
assertDeep(extractJSONs('[ 1 , 2 , 3 ]'), [[0, 12]], "array with spaces");

// Multiple JSONs in one string
console.log("\n--- extractJSONs: multiple JSONs ---");
assertDeep(extractJSONs('{"a":1} {"b":2}'), [[0, 6], [8, 14]], "two objects in one string");
assertDeep(extractJSONs('text {"a":1} more [1,2] end'), [[5, 11], [18, 22]], "object and array in text");
assertDeep(extractJSONs('[1] [2]'), [[0, 2], [4, 6]], "two arrays in one string");

// Incomplete / truncated JSON
console.log("\n--- extractJSONs: invalid/incomplete ---");
assertDeep(extractJSONs('{"a":'), [], "truncated object");
assertDeep(extractJSONs('[1,2,'), [], "truncated array");
assertDeep(extractJSONs('{"a":1,}'), [], "trailing comma in object");
assertDeep(extractJSONs('[1,]'), [], "trailing comma in array");
assertDeep(extractJSONs('{a:1}'), [], "unquoted key");
assertDeep(extractJSONs("{'a':1}"), [], "single-quoted key");

// Positioning: leading text, trailing text, no json, tricky boundaries
console.log("\n--- extractJSONs: positioning and tricky ---");
assertDeep(extractJSONs('blah blah {"a":1}'), [[10, 16]], "leading non-json text then object");
assertDeep(extractJSONs('>>> [true,false] <<<'), [[4, 15]], "leading non-json text then array");
assertDeep(extractJSONs('{"a":1} and more text'), [[0, 6]], "json with trailing text");
assertDeep(extractJSONs('[null] done'), [[0, 5]], "array with trailing text");
assertDeep(extractJSONs('just plain text'), [], "no json at all");
assertDeep(extractJSONs('123 456'), [], "bare numbers are not json");
assertDeep(extractJSONs('true false null'), [], "bare literals are not json");
assertDeep(extractJSONs('"just a string"'), [], "bare string is not json");
assertDeep(extractJSONs('function() { return 1; }'), [], "JS code with braces is not json");
assertDeep(extractJSONs('if (a[0] > b[1]) {}'), [[5, 7], [12, 14], [17, 18]], "code with brackets — parser finds [0], [1], and {} as valid JSON");
assertDeep(extractJSONs('a = {b: 1}; c = [2]'), [[16, 18]], "JS assignment — parser finds [2] as valid JSON");
assertDeep(extractJSONs('email@{domain}.com'), [], "braces in non-json context");
assertDeep(extractJSONs('before {"a":1} between {"b":2} after'), [[7, 13], [23, 29]], "two jsons with surrounding text");
assertDeep(extractJSONs('garbage {bad} {"a":1}'), [[14, 20]], "invalid object then valid object");
assertDeep(extractJSONs('{"a":1}{"b":2}'), [[0, 6], [7, 13]], "two objects back to back");
assertDeep(extractJSONs('   {"a":1}   '), [[3, 9]], "json surrounded by whitespace");
assertDeep(extractJSONs('\n\n{"a":1}\n\n'), [[2, 8]], "json surrounded by newlines");
assertDeep(extractJSONs('{"a":"value with {braces} inside"}'), [[0, 33]], "string value containing braces");
assertDeep(extractJSONs('{"a":"looks like [array] but string"}'), [[0, 36]], "string value containing brackets");
assertDeep(extractJSONs('{"a":"{\\\"nested\\\":\\\"json\\\"}"}'), [[0, 28]], "string value that looks like escaped json");

// Multiline already-formatted JSON with all value types
console.log("\n--- extractJSONs: multiline formatted ---");
var fullJson = [
    '{',
    '   "str": "hello",',
    '   "num": 42,',
    '   "neg": -1,',
    '   "dec": 3.14,',
    '   "bool_t": true,',
    '   "bool_f": false,',
    '   "nil": null,',
    '   "arr": [1, "two", null, false, {"nested": true}],',
    '   "obj": {',
    '      "inner": [10, 20]',
    '   },',
    '   "empty_obj": {},',
    '   "empty_arr": [],',
    '   "escaped": "has \\"quotes\\" and \\\\backslash"',
    '}'
].join("\n");
assertDeep(extractJSONs(fullJson), [[0, fullJson.length - 1]], "multiline formatted JSON with all value types");

// Partial: formatted JSON embedded in surrounding text
console.log("\n--- extractJSONs: partial formatted ---");
var prefix = "Response from server:\n";
var suffix = "\n--- end of response ---";
var partial = prefix + fullJson + suffix;
assertDeep(extractJSONs(partial), [[prefix.length, prefix.length + fullJson.length - 1]], "formatted JSON embedded in surrounding text");

// ============================================================
console.log("\n--- wrapWithPreCode HTML output ---");

var hasCorrectOrder = src.includes("</code></pre>");
var hasBadOrder = src.includes("</pre></code>");
assert(hasCorrectOrder && !hasBadOrder, "closing tags should be </code></pre> not </pre></code>");

// Reuse existing pre > code — preserve surrounding text
var codeEl = { textContent: 'prefix {"x":1} suffix' };
var fakeNodeWithCode = {
    nodeName: "DIV",
    querySelector: function(sel) { return sel === 'pre > code' ? codeEl : null; },
    innerHTML: '<pre><code>prefix {"x":1} suffix</code></pre>'
};
wrapWithPreCode(fakeNodeWithCode, "", '{\n   "x": 1\n}', '{"x":1}');
assert(codeEl.textContent === 'prefix {\n   "x": 1\n} suffix', "reuses existing pre > code and preserves surrounding text");
assert(fakeNodeWithCode.innerHTML === '<pre><code>prefix {"x":1} suffix</code></pre>', "innerHTML unchanged when reusing code element");

// Undo restores the old textContent
var undoEntry = undoStack.pop();
undoEntry.node[undoEntry.prop] = undoEntry.val;
assert(codeEl.textContent === 'prefix {"x":1} suffix', "undo restores previous code textContent");

// First time (no existing pre > code) still wraps normally
var freshNode = {
    nodeName: "DIV",
    querySelector: function() { return null; },
    innerHTML: '{"a":1}'
};
wrapWithPreCode(freshNode, "", '{\n   "a": 1\n}', '{"a":1}');
assert(freshNode.innerHTML.includes('<pre><code>'), "first format wraps in pre > code");
assert(!freshNode.innerHTML.includes('<pre><code><div'), "no nested wrapping on first format");
undoStack.pop(); // clean up

// Node is a <code> element — replace just the JSON, keep surrounding text
var codeNode = { nodeName: "CODE", textContent: 'before {"a":1} after' };
wrapWithPreCode(codeNode, "", '{\n   "a": 1\n}', '{"a":1}');
assert(codeNode.textContent === 'before {\n   "a": 1\n} after', "code node: preserves surrounding text");
var ue = undoStack.pop();
ue.node[ue.prop] = ue.val;
assert(codeNode.textContent === 'before {"a":1} after', "code node: undo restores original");

// Node is a <pre> element with existing <code> child
var innerCode = { textContent: 'x {"b":2} y' };
var preNode = {
    nodeName: "PRE",
    querySelector: function(sel) { return sel === 'code' ? innerCode : null; }
};
wrapWithPreCode(preNode, "", '{\n   "b": 2\n}', '{"b":2}');
assert(innerCode.textContent === 'x {\n   "b": 2\n} y', "pre node: preserves surrounding text in code child");
undoStack.pop();

// Node is a <pre> element without <code> child
var barePreNode = {
    nodeName: "PRE",
    querySelector: function() { return null; },
    textContent: 'stuff {"c":3} more'
};
wrapWithPreCode(barePreNode, "", '{\n   "c": 3\n}', '{"c":3}');
assert(barePreNode.textContent === 'stuff {\n   "c": 3\n} more', "pre node without code: preserves surrounding text");
undoStack.pop();

// ============================================================
console.log("\n--- unEscapeObj / unEscapeArray ---");

var obj1 = { a: '{"b":"c"}' };
unEscapeObj(obj1);
assertDeep(obj1, { a: { b: "c" } }, "unEscapeObj parses string value");

var obj2 = { a: '{"b":"{\\"c\\":\\"d\\"}"}' };
unEscapeObj(obj2);
assertDeep(obj2, { a: { b: { c: "d" } } }, "unEscapeObj recurses into parsed value");

var arr1 = ['{"a":1}'];
unEscapeArray(arr1);
assertDeep(arr1, [{ a: 1 }], "unEscapeArray parses string element");

var arr2 = ['[1,2]'];
unEscapeArray(arr2);
assertDeep(arr2, [[1, 2]], "unEscapeArray parses array string");

var arr3 = ['{"a":"{\\"b\\":1}"}'];
unEscapeArray(arr3);
assertDeep(arr3, [{ a: { b: 1 } }], "unEscapeArray recurses into parsed value");

var arr4 = [null, '{"a":1}', null];
unEscapeArray(arr4);
assertDeep(arr4, [null, { a: 1 }, null], "unEscapeArray handles null elements");

// ============================================================
console.log("\n--- implicit globals ---");

var lines = src.split("\n");
var hasVarCh = lines.some(function(l) { return l.trim().match(/^var\s+ch\b/); });
assert(hasVarCh, "`ch` should be declared with var/let/const");

var hasVarErr = lines.some(function(l) { return l.trim().match(/^var\s+err\b/); });
assert(hasVarErr, "`err` should be declared with var/let/const");

// ============================================================
console.log("\n--- escapeHtml ---");
assert(escapeHtml('<b>"hi"&</b>') === '&lt;b&gt;&quot;hi&quot;&amp;&lt;/b&gt;', "escapes all special chars");

// ============================================================
console.log("\n--- highlight partial selection ---");

// Simulate: user highlights just a portion of text that is valid JSON
var pageText = 'Log output: {"status":"ok","code":200} end of log';
var highlighted = '{"status":"ok","code":200}';

// The highlighted portion is valid JSON and can be parsed directly
var parsed = JSON.parse(highlighted);
assertDeep(parsed, { status: "ok", code: 200 }, "highlighted portion parses as JSON");
assert(JSON.stringify(parsed, null, 3).includes('"status": "ok"'), "highlighted portion formats correctly");

// extractJSONs also finds it at the right position within the full text
var found = extractJSONs(pageText);
assertDeep(found, [[12, 37]], "extractJSONs finds the JSON in full text at correct position");
assert(pageText.substring(found[0][0], found[0][1] + 1) === highlighted, "extracted range matches highlighted text");

// Partial highlight that is NOT valid JSON on its own — falls back to extraction
var badHighlight = '"ok","code":200}';
var parseFailed = false;
try { JSON.parse(badHighlight); } catch(e) { parseFailed = true; }
assert(parseFailed, "partial highlight that isn't valid JSON fails to parse");

// Full node text still yields the correct JSON via extractJSONs
var fallbackCandidates = extractJSONs(pageText);
assert(fallbackCandidates.length === 1, "fallback finds one JSON in full text");

// ============================================================
console.log("\n--- undo ---");

// saveForUndo + restore via undoStack
var fakeNode = { innerHTML: "<p>original</p>" };
saveForUndo(fakeNode, "innerHTML");
fakeNode.innerHTML = "<p>formatted</p>";
assert(undoStack.length === 1, "undoStack has one entry after save");
var entry = undoStack.pop();
fakeNode[entry.prop] = entry.val;
assert(fakeNode.innerHTML === "<p>original</p>", "undo restores innerHTML");
assert(undoStack.length === 0, "undoStack empty after pop");

// undo with value (textarea)
var fakeTextarea = { value: "original text" };
saveForUndo(fakeTextarea, "value");
fakeTextarea.value = "formatted text";
entry = undoStack.pop();
fakeTextarea[entry.prop] = entry.val;
assert(fakeTextarea.value === "original text", "undo restores value");

// multiple undos pop in reverse order
var node1 = { innerHTML: "first" };
var node2 = { innerHTML: "second" };
saveForUndo(node1, "innerHTML");
node1.innerHTML = "changed1";
saveForUndo(node2, "innerHTML");
node2.innerHTML = "changed2";
assert(undoStack.length === 2, "undoStack has two entries");
entry = undoStack.pop();
node2[entry.prop] = entry.val;
assert(node2.innerHTML === "second", "second undo restores second node");
entry = undoStack.pop();
node1[entry.prop] = entry.val;
assert(node1.innerHTML === "first", "first undo restores first node");

// undo on empty stack does nothing
assert(undoStack.length === 0, "undoStack empty before no-op undo");

// repeated saves on same node keep only the original
var dupeNode = { textContent: "original" };
saveForUndo(dupeNode, "textContent");
assert(undoStack.length === 1, "first save pushes to stack");
dupeNode.textContent = "formatted1";
saveForUndo(dupeNode, "textContent");
assert(undoStack.length === 1, "second save on same node does not push");
dupeNode.textContent = "formatted2";
saveForUndo(dupeNode, "textContent");
assert(undoStack.length === 1, "third save on same node still does not push");
var ue2 = undoStack.pop();
assert(ue2.val === "original", "undo goes straight back to original");
undoStack.length = 0; // clean up

// ============================================================
console.log("\n\n=== Results: " + passed + " passed, " + failed + " failed ===");
process.exit(failed > 0 ? 1 : 0);
