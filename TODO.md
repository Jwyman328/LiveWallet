# TODO frontend
- only start the backend from electron in prod or with a environment variable?
- better errors when I can't connect to the electrum servers (public or private)
- Fix the readme to be about my project.
- switch defaults for product deployment
- Fix the Estimate batch tx button size. 
  - have it line up with output box size?
- Componentize a bit more 
- remove the default descriptor
- change the login page to not just be a textbox descriptor but to have it more like sparrow where you put in the components that build up the descriptor
- fix the styles for batch button / fee display, they are slightly off.

- get the app build executable to have a fitting icon
- do I need to wait at all in main.ts for the child process flask?
- remove all the fe github build pipeline stuff that I don't want that I got from cloning a bioler late project


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

notes
- to build I must do 
$ sudo npm run package
