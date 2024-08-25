#!/bin/bash
# $ bash notarize_mac_app_builds.sh 0.6.0

# Access the first argument (version)
version="$1"

echo "Version: $version"

# Use double quotes for variable expansion
app_build_name="Live Wallet-$version-mac.zip"
app_arm_build_name="Live Wallet-$version-arm64-mac.zip"

# Check if xcrun is available
if ! command -v xcrun &> /dev/null; then
    echo "Error: xcrun is not installed or not found in the system's PATH."
    exit 1
fi

echo "Notarizing the mac app $app_build_name"
# Navigate to the release/build directory
cd release/build || { echo "Failed to navigate to release/build"; exit 1; }

# Run the notarize command
xcrun notarytool submit "$app_build_name" --keychain-profile "PROFILE" || { echo "Failed to notarize $app_build_name"; exit 1; }

echo "Notarizing the mac app $app_arm_build_name"
xcrun notarytool submit "$app_arm_build_name" --keychain-profile "PROFILE" || { echo "Failed to notarize $app_arm_build_name"; exit 1; }

