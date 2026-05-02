#!/usr/bin/env bash
set -e

SHARED="background.js main.js icon"

rm -rf dist
mkdir -p dist/chrome dist/firefox

# --- Chrome ---
cp -r $SHARED manifest.json dist/chrome/
cd dist/chrome && zip -r ../chrome-jipy.zip . && cd ../..

# --- Firefox ---
cp -r $SHARED manifest.json dist/firefox/
node -e "
var m = require('./dist/firefox/manifest.json');
m.background = { scripts: [m.background.service_worker] };
m.browser_specific_settings = { gecko: { id: 'jipy@twskj' } };
require('fs').writeFileSync('./dist/firefox/manifest.json', JSON.stringify(m, null, 4) + '\n');
"
cd dist/firefox && zip -r ../firefox-jipy.zip . && cd ../..

rm -rf dist/chrome dist/firefox

echo "✅ Built:"
echo "   dist/chrome-jipy.zip"
echo "   dist/firefox-jipy.zip"
