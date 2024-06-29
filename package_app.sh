cd backend
source environment.sh

bash build_executable.sh
cd ..

cp -R backend/dist/* ./assets/

sudo npm run package
