
# pyinstaller needs to be installed in order to run this command and build the executable
# This command will result in an executable placed in assets/ directory
# --add-binary="./libusb-1.0.dylib:." is needed because libusb is a macos dependency for using the hwi hardware wallet library, without it macos will not be able to successfully communicate to devices over usb.
wine C:/Python310/python.exe -m pip install pyinstaller
 ENVIRONMENT="NOT_ANYTHING"  wine C:/Python310/Scripts/pyinstaller.exe -F --distpath=../assets  --noconfirm --windowed  --hidden-import "configparser" --hidden-import "six" --collect-submodules "bdkpython" --collect-binaries "bdkpython" --add-binary="./libusb-1.0.dylib:." --collect-submodules "hwi" --collect-binaries "hwi" --hidden-import "dependency_injector.errors" --hidden-import "hwilib.devices.trezor" --hidden-import "hwilib.devices.ledger" --hidden-import "hwilib.devices.keepkey"  --hidden-import "hwilib.devices.digitalbitbox" --hidden-import "hwilib.devices.coldcard" --hidden-import "hwilib.devices.bitbox02" --hidden-import "hwilib.devices.jade"        "src/app.py"
