#!/bin/bash
set -e

# Navigate to the project directory
cd /home/rj/.openclaw/workspace/vibeauction

# Clear any previous build artifacts
rm -rf .next

# Install dependencies
npm install

# Build the Next.js application
npm run build

# Print success message
echo "Build completed successfully!"