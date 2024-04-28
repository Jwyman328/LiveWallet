# start up an electrum server

#set up regtest environment in separate container
source environment.sh
nigiri start
sleep 10 #wait for regtest nigiri to start up

# fund mock address with various utxo sizes
#
for value in {1..3} 
do
    nigiri faucet bcrt1qkmvk2nadgplmd57ztld8nf8v2yxkzmdvwtjf8s 1.0
done

sleep 1
for value in {1..3} 
do
    nigiri faucet bcrt1qkmvk2nadgplmd57ztld8nf8v2yxkzmdvwtjf8s .02 
done

sleep 1
for value in {1..3} 
do
    nigiri faucet bcrt1qkmvk2nadgplmd57ztld8nf8v2yxkzmdvwtjf8s .001 
done

sleep 1
for value in {1..3} 
do
    nigiri faucet bcrt1qkmvk2nadgplmd57ztld8nf8v2yxkzmdvwtjf8s .0001 
done

sleep 1
for value in {1..3} 
do
    nigiri faucet bcrt1qkmvk2nadgplmd57ztld8nf8v2yxkzmdvwtjf8s .00001
done


sleep 5 # sleep 5 give nigiri extra start up time before flask run can be run.
# flask run -h localhost -p 5011 --reload
#
# todo add back in, just want to run electrum server at the moment
# python3 src/app.py
