#!/bin/bash
# spctl (short for Security Policy Control) is a command-line utility on macOS used to manage and assess the security policies for code signing and notarization.
# # Check if spctl is available
if ! command -v spctl &> /dev/null; then
    echo "Error: spctl is not installed or not found in the system's PATH."
    exit 1
fi


echo "Verifying the notarization of the mac Live Wallet.app"
# Navigate to the release/build/mac directory
cd release/build/mac || { echo "Failed to navigate to release/build/mac"; exit 1; }

# Run the spctl command to assess the Live Wallet.app
spctl --assess -vv --type install "Live Wallet.app" || { echo "spctl assessment failed in release/build/mac"; exit 1; }

echo "Verifying the notarization of the mac arm64 Live Wallet.app"
# Navigate to the release/build/mac-arm64 directory
cd ../mac-arm64 || { echo "Failed to navigate to release/build/mac-arm64"; exit 1; }

# Run the spctl command to assess the Live Wallet.app
spctl --assess -vv --type install "Live Wallet.app" || { echo "spctl assessment failed in release/build/mac-arm64"; exit 1; }

echo "Assessment completed successfully for both directories."
