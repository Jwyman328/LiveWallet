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


# auto-py-to-exe helped get the build reliably 
- - Install it $ pip3 install auto-py-to-exe
    - https://pypi.org/project/auto-py-to-exe/
- Then run it
    - $auto-py-to-exe


# notarizing macOs app
- Creating keychain profile (only needs to be done one time)
  - $ xcrun notarytool store-credentials PROFILE --apple-id ${APPLE_ID} --team-id ${APPLE_TEAM_ID} 
- Submitting both app builds (use whatever version build has been created)
  - $ xcrun notarytool submit "Live Wallet-0.1.0-mac.zip"  --keychain-profile "PROFILE"   
  - $ xcrun notarytool submit "Live Wallet-0.1.0-arm64-mac.zip"  --keychain-profile "PROFILE"
- Check if app was successfully notarized 
  - $ spctl --assess -vv --type install "Live Wallet.app"

- additional details
  - https://developer.apple.com/documentation/technotes/tn3147-migrating-to-the-latest-notarization-tool
  - https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution/customizing_the_notarization_workflow?language=objc


- how to handle pyinstaller code signing (or lack there of)
  - https://gist.github.com/txoof/0636835d3cc65245c6288b2374799c43


# hwi
- how do I get hardware wallet integration? 
- python library https://pypi.org/project/hwi/ 
  - dependencies
    - brew install libusb
      - would this be a dependency of the app then?
      - what if a user didn't have this installed on macos





# build for linux
- $ npx electron-builder --linux 
- I added a section to my package.json build section
  "linux": {
    "target": [
      "AppImage",
      "deb",
      "rpm"
    ],
    "icon": "path/to/icon.png"
  }

- right now do I run the electron-builder command?
  - the postinstall command runs it. do I run the postinstall command?
  - well right now I am running sudo npm run package
    - it runs electron-builder build command.
  - basically I need to run a linux vm on my machine
    - https://www.reddit.com/r/MacOS/comments/1808wf6/whats_everyones_favorite_vm_software_for_mseries/
    - VMware Player Fusion
    - UTM
    - VirtualBox
    - VirtualBuddy
  - running on mac got this error
    - to build rpm, executable rpmbuild is required, please install: brew install rpm

  - when I create linux builds I should publich both .deb and .rpm files.



  - vmware was impossible to find
    - I had to make an account with broadcom,
      - then download it form here https://support.broadcom.com/group/ecx/productfiles?subFamily=VMware%20Fusion&displayGroup=VMware%20Fusion%2013%20Pro%20for%20Personal%20Use&release=13.6&os=&servicePk=522387&language=EN
      - https://www.reddit.com/r/vmware/comments/1cma01o/anyone_looking_for_vmware_fusion_player_for_mac/?share_id=tgi0pGYH6Hmp2gy2-dv-d&utm_content=2&utm_medium=ios_app&utm_name=ioscss&utm_source=share&utm_term=1
      - https://support.broadcom.com/group/ecx/productdownloads?subfamily=VMware%20Fusion
