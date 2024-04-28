# TODOs
- test using various descriptors
- can remove the pct_fee_rate value being returned since I am not using it anymore.
- add mypy
- style the frontend. -x
- remove all the fe github build pipeline stuff that I don't want that I got from cloning a bioler late project

- get the flask app to be an executable file
    - https://www.youtube.com/watch?v=ty-n33mHwC4&ab_channel=Montreal-Python
    - use pyinstaller https://pyinstaller.org/en/stable/

- add a pyproject.toml to manage ruff line length stuff so that ruff formatting is inline with the lsp?
- do async await getting the current memepool fee rates?
    - I could do a web socket connection and use a background task for it?
    - maybe this is more of a nice to have after the main project is done.
- double check the fees are not mock values
