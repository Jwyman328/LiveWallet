# pyinstaller needs to be installed in order to run this command and build the executable
# This command will result in an executable placed in assets/ directory
# pyinstaller -w -F --distpath=../assets --add-data="/Users/jwyman/Documents/programming/python/family_wallet_fe/utxo_fee_estimation_fe_electron_app/utxo_fee_estimation_fe_electron_app/backend/libbdkffi.dylib:." --add-binary="/Users/jwyman/Documents/programming/python/family_wallet_fe/utxo_fee_estimation_fe_electron_app/utxo_fee_estimation_fe_electron_app/backend/libbdkffi.dylib:." --hidden-import=configparser --hidden-import="dependency_injector.errors" --hidden-import="six" --hidden-import="bdkpython" -p /Users/jwyman/Documents/programming/python/family_wallet_fe/utxo_fee_estimation_fe_electron_app/utxo_fee_estimation_fe_electron_app/backend/venv/lib/python3.10/site-package  src/app.py
pyinstaller  -F --distpath=../assets  --noconfirm --windowed --codesign-identity "Joseph Wyman" --add-data "/Users/jwyman/Documents/programming/python/family_wallet_fe/utxo_fee_estimation_fe_electron_app/utxo_fee_estimation_fe_electron_app/backend/libbdkffi.dylib:." --add-binary "/Users/jwyman/Documents/programming/python/family_wallet_fe/utxo_fee_estimation_fe_electron_app/utxo_fee_estimation_fe_electron_app/backend/libbdkffi.dylib:." --hidden-import "configparser" --hidden-import "six" --collect-submodules "bdkpython" --collect-binaries "bdkpython" --hidden-import "dependency_injector.errors"  "/Users/jwyman/Documents/programming/python/family_wallet_fe/utxo_fee_estimation_fe_electron_app/utxo_fee_estimation_fe_electron_app/backend/src/app.py"
