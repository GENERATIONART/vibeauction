#!/bin/bash
echo 'Building project...'
mkdir -p dist
cp server.js supabase.js package.json dist/
echo 'Build complete!'