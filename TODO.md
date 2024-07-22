# TODO frontend
- refactor hardware wallet select to use a state machine for the varous states of the flow.
  // Finish tests before refactoring to state machine model
  // Select state machine
  // - locked
  // - ReadyForPin
  // - ReadyForPassphrase
  // - available
- changing the address type should change the derivation path placeholder values
- use an enum for the page routes.
- better control where wallets are saved and imported from so it is less random. like how sparrow does it
- improve the readme.md
- Componentize a bit more 
- write tests for frontend
  - write tests for initial landing page
- add a banner for showing that a specific wallet is loaded


# TODOs backend
- add mypy
- add a pyproject.toml to manage ruff line length stuff so that ruff formatting is inline with the lsp?
- Also set the default custom fee rate to the current rate 

# TODOs build
- add ci, trying this
- use a random port to run the backend on 
- build for not just macOS? 
  - https://github.com/pyinstaller/pyinstaller/wiki/FAQ#features
  - "Since pyinstaller is not a cross-compiler (which means with pyinstaller you cannot create an executable for any other system than the one you are on), you will have to look for other tools."
- use wine?
- Analyze the build size and try to make it smaller
- set up github test runner on commit

# TODOS hosting site
- make website to host bundle and allow download


# Feature Ideas
- integrate signing devices to export wallet details
  - Python bitcoin hardware wallet interface pip package.
   - Written by Andrew chow.
   - https://hwi.readthedocs.io/en/latest/devices/index.html
   - https://pypi.org/project/hwi/
   - https://github.com/bitcoin-core/HWI
   - https://bitcoinops.org/en/topics/hwi/
    
  - add close request to all hardware wallets when the hardware wallet modal closes
- A suggestion: Add gap limit option
- breakdown where the cost comes form for each part of the transaction
- ability to just put in a utxo and test that instead of an entire wallet.
- click on a utxo and get told when it is unspendable.
- add how many outputs a tx would have and have it change the fee estimation.

