# App 
## description
- An application to help estimate the effect of bitcoin transaction fees on invididual utxos and transactions containing multiple utxos.


# Development
## How to create build
- in a single script you can package the backend and the frontend into a single executable by running
```bash
$ bash package_app.sh
```
  -  The app build will be available in /release directory

- To build just the backend python server run (from ./backend/)
```bash
$ pyinstaller -w -F --add-binary=libbdkffi.dylib:. --hidden-import=configparser --hidden-import="dependency_injector.errors" --hidden-import="six"  src/app.py   
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
- To startup the electron app run from (.)
```bash
$ npm start
```
- To start up the backend server and related services run (from ./backend/)
```bash
$ backend/start_app.sh
```
  - Docker must be running in order to run the related backend services. (chopsticks, espolora, electrs, bitcoin)
  - These are needed for the backend to be able to communicate with an electrum server which talks with a bitcoind container, this is all handled via [nigiri](https://github.com/vulpemventures/nigiri)


# Development fixtures
- when backend/start_app.sh is run the script randomly_fund_mock_wallet.py will be run to randomly generate 10 bitcoin transactions to the default dev wallet's address. 
- to generate additional transactions you can use the scripts in backend/scripts/ 
