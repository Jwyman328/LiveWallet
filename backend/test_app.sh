# This script is for running tests using an electrum server.
# Currently the existing tests are mocking all access to an electrum server, but this script 
# could be used in the future for more integration level tests.


# start up an electrum server
#set up regtest environment in separate container
source environment.sh

# Name of the Docker container, if esplora aka nigiri is already running then skip the command.
CONTAINER_NAME="esplora"

# Check if the Docker container is running
if docker ps --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
    echo "Container $CONTAINER_NAME is running. Skipping command."
else
    echo "Container $CONTAINER_NAME is not running. Running command."
    nigiri start
    sleep 5 #wait for regtest nigiri to start up
    # fund testing address
    for value in {1..1} ## changing this number will alter test results.
    do
        nigiri faucet $RECEIVE_ADDRESS #same address as test_address in env variables.
    done
    # Run your command here
fi


sleep 1 # sleep 5 give nigiri extra start up time before tests run can be run.
pytest -v -s
