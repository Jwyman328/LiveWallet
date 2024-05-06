# TODO frontend
- better errors when I can't connect to the electrum servers (public or private)
  - use mantine notifications for when there are network failures
- improve the readme.md
- Fix the Estimate batch tx button size. 
  - have it line up with output box size?
- Componentize a bit more 
- remove the default descriptor
- change the login page to not just be a textbox descriptor but to have it more like sparrow where you put in the components that build up the descriptor
- fix the styles for batch button / fee display, they are slightly off.
- do I need to wait at all in main.ts for the child process flask?


# TODOs backend
- test using various descriptors
- can remove the pct_fee_rate value being returned since I am not using it anymore.
- add mypy
- style the frontend. -x
- add a pyproject.toml to manage ruff line length stuff so that ruff formatting is inline with the lsp?
- do async await getting the current memepool fee rates?
    - I could do a web socket connection and use a background task for it?
    - maybe this is more of a nice to have after the main project is done.
- double check the fees are not mock values
- Also be able to save wallets configs in files. 
-  Entering in an xpub every time is super annoying 
- Also set the default custom fee rate to the current rate 
- Also be able to customize the current fee rate in my dev environment


