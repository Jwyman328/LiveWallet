# pyinstaller needs to be installed in order to run this command and build the executable
# This command will result in an executable placed in assets/ directory
pyinstaller -w -F --distpath=../assets --add-binary=libbdkffi.dylib:. --hidden-import=configparser --hidden-import="dependency_injector.errors" --hidden-import="six"  src/app.py
