cd ../backend
source environment.sh


## Check if the first argument is 'windows'
if [ "$1" == "windows" ]; then
    bash build_windows_executable.sh
else
    sudo bash build_executable.sh
fi

cd ..

# Define the command to run
npm_command="run package"

# Check the operating system
if [[ "$1" == "windows" ]]; then
    echo "Detected Windows variable. Running npm package for Windows."
    npm $npm_command:windows
elif [[ "$(uname)" == "Darwin" ]]; then
    # macOS detected
    echo "Running on macOS. Using sudo for npm package."
    sudo npm $npm_command:mac
else
    # Non-macOS detected
    echo "Not running on macOS. Running npm package without sudo."
    npm $npm_command:linux
fi

# also notarize the macOs app builds via additional commandline tools
# For more details view notes # notarizing macOs app
