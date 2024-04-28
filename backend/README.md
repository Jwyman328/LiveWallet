To create a new build run
$ pyinstaller -w -F --add-binary=libbdkffi.dylib:. --hidden-import=configparser --hidden-import="dependency_injector.errors" --hidden-import="six"  src/app.py   
