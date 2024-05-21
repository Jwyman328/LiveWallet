# TODO frontend
- customize levels of concerns, right now it is hard coded
  - use mantine notifications for when there are network failures
- improve the readme.md
- Fix the Estimate batch tx button size. 
  - have it line up with output box size?
- Componentize a bit more 


# TODOs backend
- more python cleanup
  - find areas where there could be better typing or just more typing in general
    - find a way for the controller tests to show the pydantic type responses and not the model_dump response version of them.
- use sqllite3 python instead of the local python dictionary for config values. I think this should work with multiple gunicorn workers.
- can remove the pct_fee_rate value being returned since I am not using it anymore.
- add mypy
- add a pyproject.toml to manage ruff line length stuff so that ruff formatting is inline with the lsp?
- double check the fees are not mock values
- Also be able to save wallets configs in files. 
-  Entering in an xpub every time is super annoying, can I integrate with wallets?
- Also set the default custom fee rate to the current rate 
- Also be able to customize the current fee rate in my dev environment

# Feature Ideas
- ability to just put in a utxo and test that instead of an entire wallet.
