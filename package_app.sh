cd backend
source environment.sh

bash build_executable.sh
cd ..

cp -R backend/dist/* ./assets/

sudo npm run package

# also notarize the macOs app via additional commandline tools
# For more details view notes # notarizing macOs app
