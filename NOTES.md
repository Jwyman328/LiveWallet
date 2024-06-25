# Reminder if you upgrade the bdkpython version you will need to copy over the libbdkffi.dylib file.


# Tips on dealing with generating the backend python executable, and issues with the build not being able to fnd the libbdkffi.dylib file.


- I had to add the libbdkffi.dylib file to the .gitignore. (don't think this worked though?)
- I then had to do undo any changes to that previous file with
    - $ git restore libbdkffi.dylib
- Then I had to make sure I was using the correct virtual environment by doing
- $ source venv_hi/bin/activate
- I then rebuilt all the packages in that virtual environment using 
    - $ pip3 install -r requirements.txt --force-reinstall
- I then went into the bdk package at /Users/jwyman/Documents/programming/python/family_wallet/venv_hi/lib/python3.10/site-packages/bdkpython 
    - And I duplicated the libbdkffi.dylib file and then moved it into the directory in which I will run the pyinstaller command.
- I then rebuilt with pyinstaller
    - $ pyinstaller -w -F --add-binary=libbdkffi.dylib:. --hidden-import=configparser --hidden-import="dependency_injector.errors" --hidden-import="six"  src/app.py
- Also verify that the right python is being used
    - $which python3
        - It should point to your virtual environment path
            - /Users/jwyman/Documents/programming/python/family_wallet_fe/utxo_fee_estimation_fe_electron_app/utxo_fee_estimation_fe_electron_app/backend/venv/bin/python3
