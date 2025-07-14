#!/bin/bash
set -e

echo "Installing root dependencies..."
npm install

echo "Installing client dependencies..."
cd client
npm install

echo "Installing server dependencies..."
cd ../server
npm install

echo "Building client..."
cd ../client
npm run build

echo "Build complete!"