# TODO frontend
- write test for calling logout on home screen.
- better control where wallets are saved and imported from so it is less random. like how sparrow does it
- add a banner for showing that a specific wallet is loaded
- redesign (meet with bitcoin design foundation)
  - https://bitcoindesignfoundation.org/
- 


# TODOs backend
- add mypy
- add testing system that tests the database, allowing for more integration level tests, especially in services, I shouldn't have to mock out db calls in the services.
  - using sqllite should be easy to setup and teardown the db each run.
- add a pyproject.toml to manage ruff line length stuff so that ruff formatting is inline with the lsp?
- Also set the default custom fee rate to the current rate 

# TODOs build
- write scripts to help update the versions in the website page.
- reduce startup time on macOS.
- use a random port to run the backend on 
- Analyze the build size and try to make it smaller
- e2e tests


# Feature Ideas
- utxo cost breakdown.
- individual non wallet fee estimation.
- additional hardware wallet support
- additional config wallet support
- add ability to create a batch based off of how much you owe someone. either in btc or in usd?
  - so you select the amount you owe and then you can see how much the fee would be. 
- a button that generates a summary of your wallet
    -  it will take into consideration the conditions you set and it will out put that there are like x number of utxos in the different fee ranges set by the user
    - maybe a score but probably not since that is subjective 
- a chart of the history of fees in bitcoin
- breakdown where the cost comes form for each part of the transaction
- ability to just put in a utxo and test that instead of an entire wallet.
- click on a utxo and get told when it is unspendable.
- send message to a nostr account when a utxo is at a dangerous level.
  - if you have many wallets and many utxos like an exchange you probably want to know when one of them is in danger of becoming unspendable. but how do you do this anonymously?


