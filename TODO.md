# TODO frontend
- better control where wallets are saved and imported from so it is less random. like how sparrow does it
- add a banner for showing that a specific wallet is loaded
- redesign (meet with bitcoin design foundation)
  - https://bitcoindesignfoundation.org/
- 


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
- e2e tests


# Feature Ideas
- consolidation comparison, and create psbt at end of process.
  - ability to toggle fee rate comparing the prevous utxos vs. the hypothetical new one and how they fare in different fee rates
  - what is the user story here?
    - choose the utxos that you want to go into the tx. 
    - * don't need to choose the outputs, that will be fixed to one.  
    - show existing utxo fee rates on their own. 
    - show the end result utxo and its stats as a single utxo.
    - Do I need to show the summary of the hypothetical consolidation tx, or is that too much info? 
        - I would say yes? but also you could just switch to estimate batch mode to be able to see?
          - But single -> batch -> consolidation is kind of building off of one another and adding features. which may be good. 
- consolidation recommendation support.
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


