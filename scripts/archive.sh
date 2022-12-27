#!/bin/sh
VERSION=$(cat manifest.json|jq -r .version)

rm obsidian-open-link-with.zip 2> /dev/null

zip -j \
    "obsidian-open-link-with-$VERSION.zip" \
    "dist/main.js" \
    "manifest.json"

echo "done for version: $VERSION"