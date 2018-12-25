#!/usr/bin/env bash

rm -rf ../jipy
mkdir ../jipy
cp -r background.js main.js manifest.json icon ../jipy/
rm ../chrome-jipy.zip
cd ..
zip -r chrome-jipy.zip jipy
rm -rf jipy