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
      - I downloaded this image with a UI for the OS https://ubuntu.com/download/desktop/thank-you?version=24.04.1&architecture=amd64&lts=true

The linux system that I build the app with does not have to be the one that I test it on.
- I should test it on multiple other systems anyways


- setting up a new linux system
	- install git
	- install neovim
	- import my neovim config
		- cd ~/.config 
		- git clone https://github.com/Jwyman328/nvim.git
	- install python3
	- install pip3
	- install virtualenv 
	- install pyenv
		- sudo apt install -y build-essential libssl-dev zlib1g-dev libbz2-dev \
				    libreadline-dev libsqlite3-dev wget curl llvm \
				    libncurses5-dev libncursesw5-dev xz-utils tk-dev \
				    libffi-dev liblzma-dev python3-openssl git
		- curl https://pyenv.run | bash
	- pyenv install 3.10.1
	- pyenv global 3.10.1
	- make sure you reload the bash shell
		- source ~/.bashrc
	- check current python version for 3.10.1
		- $python3 --version
	- article that helped get my python3 version to be the pyenv version
		- https://medium.com/@aashari/easy-to-follow-guide-of-how-to-install-pyenv-on-ubuntu-a3730af8d7f0
		- echo -e 'export PYENV_ROOT="$HOME/.pyenv"\nexport PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
		- echo -e 'eval "$(pyenv init --path)"\neval "$(pyenv init -)"' >> ~/.bashrc
		- exec "$SHELL"
	- install npm and nvm	
		- curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
	- nvm install 20.11.0
	- make sure the environment.sh file is using python version 3.10.1 to create the virtual env
		- pyenv virtualenv 3.10.1 venv  
	- npm start issues
		- sudo chown root:root /home/jwyman/Documents/programming/LiveWallet/node_modules/electron/dis/chrome-sandbox 
		- sudo chmod 4755 /home/jwyman/Documents/programming/LiveWallet/node_modules/electron/dist/chrome-sandbox 
		- now running npm start works.

 
 	- install docker
		- https://docs.docker.com/desktop/install/linux/ubuntu/
		- turns out docker doesn't work on the latest ubuntu version I am using.
	- how to get copy and pasting from host to vm in VMware
		- https://www.youtube.com/watch?v=E6ZBSIZXF9E&ab_channel=RogerPerkin
		- $ sudo apt-get install open-vm-tools-desktop -y 
	- to build the production app via $ npm run package
		- you must first install rpm $ sudo apt-get install rpm
