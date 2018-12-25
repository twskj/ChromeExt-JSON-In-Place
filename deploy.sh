#!/usr/bin/env bash

rm -rf ../jipy
mkdir ../jipy
cp -r background.js main.js manifest.json icon ../jipy/
rm ../chrome-jipy.zip
zip -r ../chrome-jipy.zip ../jipy/
