# TODO frontend
- use mantine notifications for when there are network failures
- improve the readme.md
- Componentize a bit more 
- write tests


# TODOs backend
- more python cleanup
  - find areas where there could be better typing or just more typing in general
    - find a way for the controller tests to show the pydantic type responses and not the model_dump response version of them.
- add mypy
- add a pyproject.toml to manage ruff line length stuff so that ruff formatting is inline with the lsp?
- double check the fees are not mock values
- Also be able to save wallets configs in files. 
-  Entering in an xpub every time is super annoying, can I integrate with wallets?
- Also set the default custom fee rate to the current rate 
- Also be able to customize the current fee rate in my dev environment

# TODOs build
- use a random port to run the backend on 
- build for not just macOS? 
  - https://github.com/pyinstaller/pyinstaller/wiki/FAQ#features
  - "Since pyinstaller is not a cross-compiler (which means with pyinstaller you cannot create an executable for any other system than the one you are on), you will have to look for other tools."



# Feature Ideas
- ability to just put in a utxo and test that instead of an entire wallet.


# Open questions 
- Different image / design on sign in page?
