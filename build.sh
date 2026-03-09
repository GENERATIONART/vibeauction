#!/bin/bash
set -e

# Navigate to project directory
cd "$(dirname "$0")"

# Clear previous builds
rm -rf .next

# Install dependencies
npm install

# Build the application
NODE_OPTIONS='' npm run build

# Verify build artifacts
if [ -d ".next" ]; then
  echo "Build successful! Next.js build artifacts created."
  exit 0
else
  echo "Build failed: No .next directory found"
  exit 1
fi