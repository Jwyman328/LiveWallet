cd ../backend
source environment.sh


bash build_executable.sh
cd ..

# Define the command to run
npm_command="run package"

# Check the operating system
if [[ "$(uname)" == "Darwin" ]]; then
    # macOS detected
    echo "Running on macOS. Using sudo for npm package."
    sudo npm $npm_command
else
    # Non-macOS detected
    echo "Not running on macOS. Running npm package without sudo."
    npm $npm_command
fi

# also notarize the macOs app via additional commandline tools
# For more details view notes # notarizing macOs app
