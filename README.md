<div style="display: flex; align-items: center;">
    <h1 style="margin-right: 10px;">Live Wallet</h1>
    <p style="font-size: smaller;">Keep your utxos alive</p>
</div>

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
$ backend/start_app.sh
```
  - Docker must be running in order to run the related backend services. (chopsticks, espolora, electrs, bitcoin)
  - These are needed for the backend to be able to communicate with an electrum server which talks with a bitcoind container, this is all handled via [nigiri](https://github.com/vulpemventures/nigiri)

- To tear down containers from start_app.sh run
```bash
$ backend/clean_up.sh
```



# Development fixtures
- when backend/start_app.sh is run the script randomly_fund_mock_wallet.py will be run to randomly generate 10 bitcoin transactions to the default dev wallet's address. 
- to generate additional transactions you can use the scripts in backend/scripts/ 
