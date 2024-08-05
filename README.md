<div style="display: flex; align-items: center;">
    <h1 style="margin-right: 10px;">Live Wallet</h1>
    <p style="font-size: smaller;">Keep your utxos alive</p>
</div>

## Description
- An application to help estimate the effect of bitcoin transaction fees on invididual utxos and transactions containing multiple utxos.

## Demos
https://github.com/Jwyman328/LiveWallet/assets/32882426/aa218a2e-bc5b-4795-98bd-6ae839ee091f

## Hardware wallet support demo
https://github.com/user-attachments/assets/4439fbef-a55e-45dd-8a90-4cc1a60e1be3

## Multisig wallet support demo
https://github.com/user-attachments/assets/ca5f1332-5443-4283-8c0d-54bdf4363e11









# Development

## Prerequisits
- For all things bitcoin core / electrum in local development install ngiri (https://github.com/vulpemventures/nigiri)
```
$ curl https://getnigiri.vulpem.com | bash
```
- For hardware wallet usb interactions, libusb is required.
```bash
$ brew install libusb
```

## How to create a new release 
- Use the script update_app_version.sh, passing it a new version number and text to append to the change log file.
- If a new version is successfully set then this script will build a new release by running the package_app.sh script.
```bash
$ bash update_app_version.sh "1.2.0" "I am adding another item to the change log"
```

## How to create build
- in a single script you can package the backend and the frontend into a single executable by running
```bash
$ bash package_app.sh
```
  -  The app build will be available in /release directory

- To build just the backend python server run (from ./backend/)
```bash
bash build_executable.sh
```

- to copy the new backend builds to where the frontend is expecting it run (./backend/) 
```bash 
cp -R dist/* ../assets/
```

- To build the frontend which will include the backend build run (from .)
```bash
$ sudo npm run package
```
  -  The app build will be available in /release directory


## How to start app locally
- To startup the electron app run
```bash
$ sudo npm start
```
- To start up the backend server and related services run
```bash
$ bash backend/start_app.sh
```
  - Docker must be running in order to run the related backend services. (chopsticks, espolora, electrs, bitcoin)
  - These are needed for the backend to be able to communicate with an electrum server which talks with a bitcoind container, this is all handled via [nigiri](https://github.com/vulpemventures/nigiri)

- To tear down containers from start_app.sh run
```bash
$ bash backend/clean_up.sh
```

## How to run backend tests
- You can run
```bash
$ bash backend/test_app.sh
```


# Development fixtures
- when backend/start_app.sh is run the script randomly_fund_mock_wallet.py will be run to randomly generate 10 bitcoin transactions to the default dev wallet's address. 
- to generate additional transactions you can use the scripts in backend/scripts/ 
