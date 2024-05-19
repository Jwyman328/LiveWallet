# TODO frontend
- customize levels of concerns, right now it is hard coded
- get initial loading spinner centered in the middle
- better errors when I can't connect to the electrum servers (public or private)
  - use mantine notifications for when there are network failures
- improve the readme.md
- Fix the Estimate batch tx button size. 
  - have it line up with output box size?
- Componentize a bit more 
- fix the styles for batch button / fee display, they are slightly off.
- do I need to wait at all in main.ts for the child process flask?


# TODOs backend
- use sqllite3 python instead of the local python dictionary for config values. I think this should work with multiple gunicorn workers.
- currently funding bitcoin (not testnet/regtest) wallets don't work. cant do p2tr wallets.
- don't use the default dev server, use something like gunicorn.
- can remove the pct_fee_rate value being returned since I am not using it anymore.
- add mypy
- style the frontend. -x
- add a pyproject.toml to manage ruff line length stuff so that ruff formatting is inline with the lsp?
- double check the fees are not mock values
- Also be able to save wallets configs in files. 
-  Entering in an xpub every time is super annoying 
- Also set the default custom fee rate to the current rate 
- Also be able to customize the current fee rate in my dev environment


