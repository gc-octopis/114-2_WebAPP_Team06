#!/bin/bash
echo "Setting up Backend environment..."

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
pip install -r requirements.txt
python manage.py migrate --noinput

echo "Setup complete. Use 'source .venv/bin/activate' to start."