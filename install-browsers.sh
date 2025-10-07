#!/bin/bash
# Install Playwright browsers for testing
# This downloads the browsers to ~/.cache/ms-playwright/

set -e

echo "Installing Playwright browsers..."

# Download chromium
wget -q --show-progress -O /tmp/chromium.zip "https://cdn.playwright.dev/dbazure/download/playwright/builds/chromium/1194/chromium-linux.zip"
mkdir -p ~/.cache/ms-playwright/chromium-1194
unzip -q /tmp/chromium.zip -d ~/.cache/ms-playwright/chromium-1194
rm /tmp/chromium.zip

# Download chromium headless shell
wget -q --show-progress -O /tmp/chromium-headless-shell.zip "https://cdn.playwright.dev/dbazure/download/playwright/builds/chromium/1194/chromium-headless-shell-linux.zip"
mkdir -p ~/.cache/ms-playwright/chromium_headless_shell-1194
unzip -q /tmp/chromium-headless-shell.zip -d ~/.cache/ms-playwright/chromium_headless_shell-1194
rm /tmp/chromium-headless-shell.zip

echo "Playwright browsers installed successfully!"
