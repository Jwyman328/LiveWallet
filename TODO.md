# TODO frontend
- some type of UI to show the outputs used in the fee calculation
  - with ability to alter it
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

# TODOS hosting site
- make website to host bundle and allow download


# Feature Ideas
- usd cost of a transaction.
    - allow ability to choose the price of bitcoin for this calculation
    - also get current price via some api.
- add ability to select how many outputs to use in the fee estimation
  - resource:
    - https://jlopp.github.io/bitcoin-transaction-size-calculator/
    - https://bitcoinops.org/en/tools/calc-size/
  - gpt response
  - how many btyes will each additional output add?
    - Standard Output: 
        A typical P2PKH (Pay-to-PubKey-Hash) output adds around 34 vbytes to the transaction. This includes
          -  8 bytes for the output value
          - 1 byte for the output script length
          - 25 bytes for the P2PKH script (which is the scriptPubKey)
    - P2SH Output: 
      - A Pay-to-Script-Hash (P2SH) output adds around 32 vbytes to the transaction. This includes:
      - 8 bytes for the output value
      - 1 byte for the output script length
      - 23 bytes for the P2SH script (which is the scriptPubKey)
    - SegWit Outputs:like P2WPKH (Pay-to-Witness-PubKey-Hash) or P2WSH (Pay-to-Witness-Script-Hash) outputs, have different sizes. For example:
        - A P2WPKH output typically adds around 31 vbytes.
        - A P2WSH output typically adds around 43 vbytes.
    - Taproot outputs (P2TR) generally add around 43 vbytes to a transaction. Here's a breakdown of the components:
      - I think around 34 - 65
      - Output Value: 8 bytes
      - Script Length: 1 byte
      - Taproot Script:
          - Taproot's script includes a 32-byte key (the Taproot internal public key) and, if there are complex conditions, a script path which might be much larger, but this is rarely used. Typically, for basic use, Taproot outputs involve a 32-byte key and a 33-byte script length, summing to 65 bytes.
          - Thus, the total for a simple Taproot output is approximately:
          - 8 bytes (value) + 1 byte (length) + 32 bytes (key) + 2 bytes (additional script details) = 43 vbytes.
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


# TODO knowledge
- improve knowledge difference between input and output vbtye calculations
