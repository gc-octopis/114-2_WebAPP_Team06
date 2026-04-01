#!/bin/bash
set -e

echo "Setting up Backend environment for macOS..."

# Navigate to the script's directory
cd "$(dirname "$0")"

# Create venv if it doesn't exist
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "Virtual environment created."
fi

# Activate and install
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.macos.txt

echo "Setup complete for macOS. Use 'source .venv/bin/activate' to start."
