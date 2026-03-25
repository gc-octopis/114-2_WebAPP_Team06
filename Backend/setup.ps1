Write-Host "Setting up Backend environment..." -ForegroundColor Cyan

# Ensure we are in the correct directory
Set-Location $PSScriptRoot

# Create venv if it doesn't exist
if (!(Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "Virtual environment created."
}

# Activate and install
& .venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

Write-Host "Setup complete. Use '.\.venv\Scripts\Activate.ps1' to start." -ForegroundColor Green