cd backend
source environment.sh

pyinstaller -w -F --add-binary=libbdkffi.dylib:. --hidden-import=configparser --hidden-import="dependency_injector.errors" --hidden-import="six"  src/app.py

cd ..

cp -R backend/dist/* ./assets/

sudo npm run package
