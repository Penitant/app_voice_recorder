#!/bin/bash

echo "Android SDK Setup Script"
echo "========================"

# Function to check if Android SDK exists at a given path
check_sdk_path() {
  if [ -d "$1" ] && [ -d "$1/platform-tools" ]; then
    return 0  # Path exists and seems valid
  else
    return 1  # Path doesn't exist or doesn't look like SDK
  fi
}

# Common places to check for Android SDK
COMMON_PATHS=(
  "$HOME/Android/Sdk"
  "$HOME/Library/Android/sdk"
  "$HOME/AppData/Local/Android/Sdk"
  "/usr/local/lib/android/sdk"
  "/opt/android-sdk"
)

# Check for existing SDK in common locations
SDK_PATH=""
for path in "${COMMON_PATHS[@]}"; do
  if check_sdk_path "$path"; then
    SDK_PATH="$path"
    echo "Found existing Android SDK at: $SDK_PATH"
    break
  fi
done

# If not found, guide through installation
if [ -z "$SDK_PATH" ]; then
  echo "Android SDK not found in common locations."
  echo ""
  echo "Option 1: Install Android SDK through Android Studio"
  echo "  1. Download Android Studio: https://developer.android.com/studio"
  echo "  2. During installation, select 'Android SDK' component"
  echo "  3. Complete the installation"
  echo ""
  echo "Option 2: Install command line tools"
  echo "  1. Download command line tools: https://developer.android.com/studio#command-tools"
  echo "  2. Extract to a directory (e.g., ~/Android/Sdk)"
  echo ""
  read -p "Would you like to enter your Android SDK path manually? (y/n): " answer
  if [[ $answer == "y" ]]; then
    read -p "Enter the full path to your Android SDK: " SDK_PATH
    if ! check_sdk_path "$SDK_PATH"; then
      echo "Warning: The path provided doesn't appear to be a valid Android SDK directory."
      echo "Make sure it contains the 'platform-tools' directory."
    fi
  else
    echo "Please install Android SDK first, then run this script again."
    exit 1
  fi
fi

# Set up environment variables
echo ""
echo "Setting up environment variables..."

# Determine which shell configuration file to use
SHELL_CONFIG=""
if [[ -n "$BASH_VERSION" ]]; then
  if [[ -f "$HOME/.bashrc" ]]; then
    SHELL_CONFIG="$HOME/.bashrc"
  elif [[ -f "$HOME/.bash_profile" ]]; then
    SHELL_CONFIG="$HOME/.bash_profile"
  fi
elif [[ -n "$ZSH_VERSION" ]]; then
  SHELL_CONFIG="$HOME/.zshrc"
fi

if [[ -n "$SHELL_CONFIG" ]]; then
  # Check if ANDROID_HOME is already set in the config file
  if grep -q "export ANDROID_HOME" "$SHELL_CONFIG"; then
    echo "ANDROID_HOME already exists in $SHELL_CONFIG. Updating it..."
    sed -i "s|export ANDROID_HOME=.*|export ANDROID_HOME=\"$SDK_PATH\"|" "$SHELL_CONFIG"
  else
    echo "Adding ANDROID_HOME to $SHELL_CONFIG..."
    echo "" >> "$SHELL_CONFIG"
    echo "# Android SDK" >> "$SHELL_CONFIG"
    echo "export ANDROID_HOME=\"$SDK_PATH\"" >> "$SHELL_CONFIG"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/platform-tools\"" >> "$SHELL_CONFIG"
  fi
  
  echo "Environment variables set in $SHELL_CONFIG"
  echo "Run 'source $SHELL_CONFIG' to apply changes to your current terminal"
else
  echo "Could not determine shell configuration file."
  echo "Please manually add the following lines to your shell configuration file:"
  echo ""
  echo "export ANDROID_HOME=\"$SDK_PATH\""
  echo "export PATH=\"\$PATH:\$ANDROID_HOME/platform-tools\""
fi

echo ""
echo "Android SDK setup complete. You can now run your Expo app with:"
echo "npm start"
echo ""
echo "For the current terminal session, set the variable with:"
echo "export ANDROID_HOME=\"$SDK_PATH\""
