# What is the difference between a bdk.Txout vs bdk.TxoutPoint
- bdk.OutPoint 
    - https://docs.rs/bitcoin/0.30.1/bitcoin/blockdata/transaction/struct.OutPoint.html
    - it is a reference to a transaction output
    - it is the transaction id, and then references which index value in the output array of a transaction it is refering to.

- bdk.TxOut
    - https://docs.rs/bitcoin/0.30.1/bitcoin/blockdata/transaction/struct.TxOut.html
    - this is the utxo representation of a btc transaction
    - this contains a value, and a locking script



# default descriptor I have been working with
- "wpkh(tprv8ZgxMBicQKsPcx5nBGsR63Pe8KnRUqmbJNENAfGftF3yuXoMMoVJJcYeUw5eVkm9WBPjWYt6HMWYJNesB5HaNVBaFc1M6dRjWSYnmewUMYy/84h/0h/0h/0/*)"
