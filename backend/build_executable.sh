# pyinstaller needs to be installed in order to run this command and build the executable
# This command will result in an executable placed in assets/ directory
pyinstaller  -F --distpath=../assets  --noconfirm --windowed  --hidden-import "configparser" --hidden-import "six" --collect-submodules "bdkpython" --collect-binaries "bdkpython" --hidden-import "dependency_injector.errors"  "src/app.py"
