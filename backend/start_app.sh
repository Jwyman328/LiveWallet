# start up an electrum server

# set this env variable first so that when any script is run it will know that it is in development mode, and will not try to flask.run the app if app.py is imported anywhere
export ENVIRONMENT="DEVELOPMENT"
#set up regtest environment in separate container
source environment.sh
nigiri start
sleep 10 #wait for regtest nigiri to start up

export mock_wallet_address="bcrt1qkmvk2nadgplmd57ztld8nf8v2yxkzmdvwtjf8s"

# fund mock address with various utxo sizes
python src/scripts/randomly_fund_mock_wallet.py --transaction_count=10 --address=$mock_wallet_address

sleep 5 # sleep 5 give nigiri extra start up time before flask run can be run.

# run with flask dev server
python3 src/app.py
