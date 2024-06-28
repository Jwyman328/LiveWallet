cd backend
source environment.sh

pyinstaller  -F  --noconfirm --windowed --add-data "/Users/jwyman/Documents/programming/python/family_wallet_fe/utxo_fee_estimation_fe_electron_app/utxo_fee_estimation_fe_electron_app/backend/libbdkffi.dylib:." --add-binary "/Users/jwyman/Documents/programming/python/family_wallet_fe/utxo_fee_estimation_fe_electron_app/utxo_fee_estimation_fe_electron_app/backend/libbdkffi.dylib:." --hidden-import "configparser" --hidden-import "six" --collect-submodules "bdkpython" --collect-binaries "bdkpython" --hidden-import "dependency_injector.errors"  "/Users/jwyman/Documents/programming/python/family_wallet_fe/utxo_fee_estimation_fe_electron_app/utxo_fee_estimation_fe_electron_app/backend/src/app.py"
cd ..

cp -R backend/dist/* ./assets/

sudo npm run package
