# TODO frontend
- in batch tx header, show the amount usd below the amount btc.
- changing fee output amount in batch should clear batch fee state.
- refactor hardware wallet select to use a state machine for the varous states of the flow.
  // Finish tests before refactoring to state machine model
  // Select state machine
  // - locked
  // - ReadyForPin
  // - ReadyForPassphrase
  // - available
- use an enum for the page routes.
- better control where wallets are saved and imported from so it is less random. like how sparrow does it
- add a banner for showing that a specific wallet is loaded


# TODOs backend
- add mypy
- add a pyproject.toml to manage ruff line length stuff so that ruff formatting is inline with the lsp?
- Also set the default custom fee rate to the current rate 

# TODOs build
- reduce startup time.
- use a random port to run the backend on 
- build for not just macOS? 
  - https://github.com/pyinstaller/pyinstaller/wiki/FAQ#features
  - "Since pyinstaller is not a cross-compiler (which means with pyinstaller you cannot create an executable for any other system than the one you are on), you will have to look for other tools."
  - use wine?
- Analyze the build size and try to make it smaller


# Feature Ideas
- add ability to create a batch based off of how much you owe someone. either in btc or in usd?
  - so you select the amount you owe and then you can see how much the fee would be. 
- add ability to select how many outputs to use in the fee estimation
  - resource:
    - https://jlopp.github.io/bitcoin-transaction-size-calculator/
    - https://bitcoinops.org/en/tools/calc-size/
  - gpt response
- a button that generates a summary of your wallet
    -  it will take into consideration the conditions you set and it will out put that there are like x number of utxos in the different fee ranges set by the user
    - maybe a score but probably not since that is subjective 
- a chart of the history of fees in bitcoin
- breakdown where the cost comes form for each part of the transaction
- ability to just put in a utxo and test that instead of an entire wallet.
- click on a utxo and get told when it is unspendable.
- add how many outputs a tx would have and have it change the fee estimation.
- send message to a nostr account when a utxo is at a dangerous level.
  - if you have many wallets and many utxos like an exchange you probably want to know when one of them is in danger of becoming unspendable. but how do you do this anonymously?


