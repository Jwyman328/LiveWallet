#!/bin/bash
# This script will update the app version number in all locations, add to the CHANGELOG and then create a new release build.

# example usage
# $ bash update_app_version.sh "1.2.0" "I am adding another item to the change log"

# Function to install jq
install_jq() {
  echo "jq is not installed. Installing jq..."
  if [ -x "$(command -v apt-get)" ]; then
    # For Debian-based systems (e.g., Ubuntu)
    sudo apt-get update && sudo apt-get install -y jq
  elif [ -x "$(command -v brew)" ]; then
    # For macOS with Homebrew
    brew install jq
  elif [ -x "$(command -v yum)" ]; then
    # For Red Hat-based systems (e.g., CentOS)
    sudo yum install -y jq
  elif [ -x "$(command -v pacman)" ]; then
    # For Arch-based systems
    sudo pacman -S jq --noconfirm
  else
    echo "Error: Package manager not found. Please install jq manually."
    exit 1
  fi
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  install_jq
fi

# Check if the correct number of arguments are passed
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <new_version> <changelog_entry>"
  exit 1
fi

# Assign the new version from the command line argument
NEW_VERSION="$1"
CHANGELOG_ENTRY="$2"

# Define the path to your package-lock.json file
PACKAGE_LOCK_PATH="./release/app/package-lock.json"
PACKAGE_PATH="./release/app/package.json"
SETUP_CFG_PATH="./backend/setup.cfg"
CHANGELOG_PATH="./CHANGELOG.md"
TEMP_CHANGELOG_PATH="./temp_changelog.md"

# Verify that the file exists
if [ ! -f "$PACKAGE_LOCK_PATH" ]; then
  echo "Error: $PACKAGE_LOCK_PATH not found."
  exit 1
fi

if [ ! -f "$PACKAGE_PATH" ]; then
  echo "Error: $PACKAGE_PATH not found."
  exit 1
fi

# Verify that the setup.cfg file exists
if [ ! -f "$SETUP_CFG_PATH" ]; then
  echo "Error: $SETUP_CFG_PATH not found."
  exit 1
fi

# Verify that the CHANGELOG.md file exists
if [ ! -f "$CHANGELOG_PATH" ]; then
  echo "Error: $CHANGELOG_PATH not found."
  exit 1
fi


# Update the version in setup.cfg
if command -v gsed &> /dev/null; then
  # Use GNU sed if available
  gsed -i "s/^version = .*/version = $NEW_VERSION/" "$SETUP_CFG_PATH"
else
  # Use BSD sed if gsed is not available (macOS)
  sed -i '' -e "s/^version = .*/version = $NEW_VERSION/" "$SETUP_CFG_PATH"
fi

# Use jq to update the version in package-lock.json
jq --arg new_version "$NEW_VERSION" '
  .version = $new_version |
  .packages[""]["version"] = $new_version
' "$PACKAGE_LOCK_PATH" > tmp.$$.json && mv tmp.$$.json "$PACKAGE_LOCK_PATH"

# Update the version in package.json
jq --arg new_version "$NEW_VERSION" '
  .version = $new_version
' "$PACKAGE_PATH" > tmp.$$.json && mv tmp.$$.json "$PACKAGE_PATH"

# Create a new changelog entry
{
  echo "# $NEW_VERSION"
  echo "- $CHANGELOG_ENTRY"
  echo
} > "$TEMP_CHANGELOG_PATH"

# Prepend the new entry to the existing CHANGELOG.md
cat "$CHANGELOG_PATH" >> "$TEMP_CHANGELOG_PATH"
mv "$TEMP_CHANGELOG_PATH" "$CHANGELOG_PATH"

echo "Version updated to $NEW_VERSION in $PACKAGE_LOCK_PATH and $PACKAGE_PATH and $SETUP_CFG_PATH"

echo "Creating new release build for $NEW_VERSION"

bash ./scripts/package_app.sh

