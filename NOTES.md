# Reminder if you upgrade the bdkpython version you will need to copy over the libbdkffi.dylib file.


# Tips on dealing with generating the backend python executable, and issues with the build not being able to fnd the libbdkffi.dylib file.


- I had to add the libbdkffi.dylib file to the .gitignore. (don't think this worked though?)
- I then had to do undo any changes to that previous file with
    - $ git restore libbdkffi.dylib
- Then I had to make sure I was using the correct virtual environment by doing
- $ source venv_hi/bin/activate
- I then rebuilt all the packages in that virtual environment using 
    - $ pip3 install -r requirements.txt --force-reinstall
- I then went into the bdk package at /Users/jwyman/Documents/programming/python/family_wallet/venv_hi/lib/python3.10/site-packages/bdkpython 
    - And I duplicated the libbdkffi.dylib file and then moved it into the directory in which I will run the pyinstaller command.
- I then rebuilt with pyinstaller
    - $ pyinstaller -w -F --add-binary=libbdkffi.dylib:. --hidden-import=configparser --hidden-import="dependency_injector.errors" --hidden-import="six"  src/app.py
- Also verify that the right python is being used
    - $which python3
        - It should point to your virtual environment path
            - /Users/jwyman/Documents/programming/python/family_wallet_fe/utxo_fee_estimation_fe_electron_app/utxo_fee_estimation_fe_electron_app/backend/venv/bin/python3


# auto-py-to-exe helped get the build reliably 
- - Install it $ pip3 install auto-py-to-exe
    - https://pypi.org/project/auto-py-to-exe/
- Then run it
    - $auto-py-to-exe


# notarizing macOs app
- Creating keychain profile (only needs to be done one time)
  - $ xcrun notarytool store-credentials PROFILE --apple-id ${APPLE_ID} --team-id ${APPLE_TEAM_ID} 
- Submitting both app builds (use whatever version build has been created)
  - $ xcrun notarytool submit "Live Wallet-0.1.0-mac.zip"  --keychain-profile "PROFILE"   
  - $ xcrun notarytool submit "Live Wallet-0.1.0-arm64-mac.zip"  --keychain-profile "PROFILE"
- Check if app was successfully notarized 
  - $ spctl --assess -vv --type install "Live Wallet.app"

- additional details
  - https://developer.apple.com/documentation/technotes/tn3147-migrating-to-the-latest-notarization-tool
  - https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution/customizing_the_notarization_workflow?language=objc


- how to handle pyinstaller code signing (or lack there of)
  - https://gist.github.com/txoof/0636835d3cc65245c6288b2374799c43


# hwi
- how do I get hardware wallet integration? 
- python library https://pypi.org/project/hwi/ 
  - dependencies
    - brew install libusb
      - would this be a dependency of the app then?
      - what if a user didn't have this installed on macos





# build for linux
- $ npx electron-builder --linux 
- I added a section to my package.json build section
  "linux": {
    "target": [
      "AppImage",
      "deb",
      "rpm"
    ],
    "icon": "path/to/icon.png"
  }

- right now do I run the electron-builder command?
  - the postinstall command runs it. do I run the postinstall command?
  - well right now I am running sudo npm run package
    - it runs electron-builder build command.
  - basically I need to run a linux vm on my machine
    - https://www.reddit.com/r/MacOS/comments/1808wf6/whats_everyones_favorite_vm_software_for_mseries/
    - VMware Player Fusion
    - UTM
    - VirtualBox
    - VirtualBuddy
  - running on mac got this error
    - to build rpm, executable rpmbuild is required, please install: brew install rpm

  - when I create linux builds I should publich both .deb and .rpm files.



  - vmware was impossible to find
    - I had to make an account with broadcom,
      - then download it form here https://support.broadcom.com/group/ecx/productfiles?subFamily=VMware%20Fusion&displayGroup=VMware%20Fusion%2013%20Pro%20for%20Personal%20Use&release=13.6&os=&servicePk=522387&language=EN
      - https://www.reddit.com/r/vmware/comments/1cma01o/anyone_looking_for_vmware_fusion_player_for_mac/?share_id=tgi0pGYH6Hmp2gy2-dv-d&utm_content=2&utm_medium=ios_app&utm_name=ioscss&utm_source=share&utm_term=1
      - https://support.broadcom.com/group/ecx/productdownloads?subfamily=VMware%20Fusion
      - I downloaded this image with a UI for the OS https://ubuntu.com/download/desktop/thank-you?version=24.04.1&architecture=amd64&lts=true

The linux system that I build the app with does not have to be the one that I test it on.
- I should test it on multiple other systems anyways


- setting up a new linux system
	- install git
	- install neovim
	- import my neovim config
		- cd ~/.config 
		- git clone https://github.com/Jwyman328/nvim.git
	- install python3
	- install pip3
	- install virtualenv 
	- install pyenv
		- sudo apt install -y build-essential libssl-dev zlib1g-dev libbz2-dev \
				    libreadline-dev libsqlite3-dev wget curl llvm \
				    libncurses5-dev libncursesw5-dev xz-utils tk-dev \
				    libffi-dev liblzma-dev python3-openssl git
		- curl https://pyenv.run | bash
	- pyenv install 3.10.1
	- pyenv global 3.10.1
	- make sure you reload the bash shell
		- source ~/.bashrc
	- check current python version for 3.10.1
		- $python3 --version
	- article that helped get my python3 version to be the pyenv version
		- https://medium.com/@aashari/easy-to-follow-guide-of-how-to-install-pyenv-on-ubuntu-a3730af8d7f0
		- echo -e 'export PYENV_ROOT="$HOME/.pyenv"\nexport PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
		- echo -e 'eval "$(pyenv init --path)"\neval "$(pyenv init -)"' >> ~/.bashrc
		- exec "$SHELL"
	- install npm and nvm	
		- curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
	- nvm install 20.11.0
	- make sure the environment.sh file is using python version 3.10.1 to create the virtual env
		- pyenv virtualenv 3.10.1 venv  
	- npm start issues
		- sudo chown root:root /home/jwyman/Documents/programming/LiveWallet/node_modules/electron/dis/chrome-sandbox 
		- sudo chmod 4755 /home/jwyman/Documents/programming/LiveWallet/node_modules/electron/dist/chrome-sandbox 
		- now running npm start works.

 
 	- install docker
		- https://docs.docker.com/desktop/install/linux/ubuntu/
		- turns out docker doesn't work on the latest ubuntu version I am using.
	- how to get copy and pasting from host to vm in VMware
		- https://www.youtube.com/watch?v=E6ZBSIZXF9E&ab_channel=RogerPerkin
		- $ sudo apt-get install open-vm-tools-desktop -y 
	- to build the production app via $ npm run package
		- you must first install rpm $ sudo apt-get install rpm


  - Fixing the issue where ubuntu would freeze on refetch.
    - this was most likely do to not having enough disk space.
    - a temporary fix is 
      - https://askubuntu.com/questions/1387469/boot-hangs-when-starting-gdm-service
    - a permenant solution was to increase disk space.
      - disk space can not just be allocated to the disk but must then be distributed to the file system.
      - $lsblk
        - this will check the current disk space
      - resize the partition 
       - sudo apt update
       - sudo apt install cloud-guest-utils
       - one of the two commands below
         - sudo growpart /dev/sda 1
         - sudo growpart /dev/sda 2
      - resize the file system
        - sudo resize2fs /dev/sda1
      - verify the changes
        - df -h
    - an alternative way is to do this is to use parted.
      - $ sudo parted /dev/sda
      - $ print
      - $ resizepart 2 100%
      - $ exit
      - sudo resize2fs /dev/sda2
      - df -h


# build for windows
  - use wine on ubuntu to build the windows executable. 
  - wine download steps https://gitlab.winehq.org/wine/wine/-/wikis/Debian-Ubuntu 
  - helpful walk through https://www.makeworld.space/2021/10/linux-wine-pyinstaller.html
  - after the exe is built you can build with electron-builder targeting the windows build.




# Privacy

## part one https://21ideas.org/en/privacy/oxt-1/
- Most traciking techniques are reliant on heuristics and evaluating the flow of bitcoin.
- Bitcoin transaction activity is pseudonymous, not anonymous. A user's true name and personal identification information is not included in the Bitcoin protocol.
- transaction include transparent amounts to a transparent address.
- The most comon form of chain analysis is focused on identification of transaction change outputs. The process is based on a series of heuristics that can be used to follow a user's activity over multiple transctions.
- If onchain activity leads to an identified economic entity wallet cluster, investigators may be able to obtain user PII associtated with the observed transaction activity.
1. Change outputs can be used to track a users activity on the blockchain.
2. The intersection of this activity with entities that obtain P11 links observed blockchain activity with a possible real identity
- What are Heuristics?
  - They are rules of thumb used to make decisions under uncertain conditions.
- Chain analysis is based on heuristics. 
- Change detection is used to cluster separate address by the common input odwnership heuristic.
- What is the difference between an address and a utxo?
  - UTXOs are pieces of bitcoin paid to an address.
  - an address can receive multiple utxos, but a utxo can not have multiple addresses

- Example transactions
  - Simple spend
    - make up about 50% of bitcoin transactions in recent blocks
    -  user make a payment and receives a change output.
    - traits
      - Number of Inputs: 1 or more
      - Number of Outputs:2
      - common interpretation: 1 payment output, 1 change output

  - sweep
    - Spend the entirety of a single utxo to a new address
    - traits
      - Number of inputs: 1 
      - Number of Outputs: 1
      - common intepretation: Possible self transfer

  - Consolidation Spend
    - Combine multiple UTXOs into a single utxo. These are rarely true payments, because a normal payment has a change output. 
    - traits
      - Number of Inputs: > 1
      - Number of Outputs: 1
      - Common Interpretation: Possible self-transfer

  - Batch Spend
    - Most likely performed by exchanges and include 1 or more inputs and many outputs. These transactions aim to save on miner fees by making as many payments as possible in a single transaction. 
    - Traits
      - Number of Inputs: >1
      - Number of Outputs: MANY
      - Common Interpretation: Large economic activity, likely exchange.

  - Multi-party Transactions (Coinjoin) 
    - Multi-party transxctions involve collaboration between many useres to perform a signle transaction that improves participant privacy. These transactions are easily identified by their equal output amounts
    - Traits: 
      - Number of inputs: Many
      - Number of outputs Many
      - Output profile: Number of identical outputs is a proxy for number of participants



Much of traditional chain analysis is based on detecting this change output. If a change output can be successfully detected, a signle user's activity can be tracked across a series of transctions

Most common ways of detecting change, and building a single user from it
- Address Reuse 
  - multiple uses of the same address are signs of activity of the same private key. 
  - if one output is to a new address and the remaining output is to the same address as the input address, we know that the reused address is the change output.
- Round Number Payment Heuristic
  - it is difficult for a user to generate a change output for a round number amount since it is input amount - payment amount - tx size * network fee rate
  - in a simple spend the round number output is the likely payment which makes the remaining output the change output
    - so more likely the .16 btc is the receiver and the .13432343 is the change.
- Same Script type heuristic.
  - If one uotput is to the same type as the input and the remaining output is to the new address script type, the output to the new address script type is the likely payment, and the same the likely change
- Largest Output Amount Heuristic.
  - The largest output amount is the likely chagne output. This is the weakest heuristic.


What are these heuristics used to do?
- They allow for tracking a single users activity over multiple transactions 


## Part two https://21ideas.org/en/privacy/oxt-2/
- external data can be used to improve confidence in change detection.
- examples of external data
  - address reuse over multiple transactions
  - co-spending from multiple addresses in the same transaction (wallet clustering)
  - multi-sig scripts which are revelaed after a utxo is spent.
  - wallet fingerprinting over a series of transctions.
  - outputs spent to labelled clusters and ip addresses
  - volume, timing and other transaction pattern recognition anaylse.


- multiple inputs to same transactions can be thought of as owned by the same person
  - an analyst can assume that each address used as an input to a transaction, is controlled by the same private key or wallet software. often called the merge input heuristic.
-  Even if a cluster is identified it is still anonymous until real world entity activity is attached to it.
- Exchanges recieving 
  - The most damaging to transaction privacy is when a simple spend is made to a wallet cluster that has been identified as a centralized service.
    - When a simple spend is made to an exchange, all change detection ambiguiity is lost. The exchange is clearly the receiver, and the other output is the users.
      - this isn't about identifying per say but about wallet clustering.


# Part three defense against chain analytics
- https://21ideas.org/en/privacy/oxt-3/
- payments priced in fiat are not likely to have round inputs. therefore protect against that type of analysis.
- the same output position for change from a wallet is not goood, maked it easier to tell what hte chagne is


Breaking deterministic links
- breaking deterministic links and creating on chain ambiguity requires a specific transaction structure.
  - determinism is dependent on the number of transaction inputs, outputs and the BTC amounts of each UTXO.- 
- boltzmann algo created by LAurenMT uses the CoinKoin suduku concept to evaluate transaction for several privacy related metrics
  - https://github.com/Samourai-Wallet/boltzmann/blob/master/boltzmann/linker/txos_linker.py
  - https://medium.com/@laurentmt/introducing-boltzmann-85930984a159
  - https://www.youtube.com/watch?v=CYIDAqMSc4A&ab_channel=WasabiWallet


- Does a link between inputs and equal outputs exist in a coinjoin?
  - yes but these links are porbabalistic not deterministic.
What does the boltzmann algo calculate? 
  - a link probability matrix, for the relationship between a transactions inputs and outputs.
  - this will give you a percentage out of 100%  that the output owner can be linked to the input owner

- Botlman effectively uses subset analysis to ask the question: Are there multiple ways (interpretations) a transction's inputs could have paid its outputs.

# Part Four privacy enhancing technologies
- https://21ideas.org/en/privacy/oxt-4/
- some pre context is usually needed for performing an anaylsis, like having information from an exchanged share with an analyszer.
- there are two investigation directions, you can search for the source of funds by searching the past history of the target utxo
  - Source evaluation for transaction chains with a single input are fairly simple to perform, because there is no “decision” to be made in evaluating which input UTXO path to follow. However, multi-input transactions present analysts with multiple sources to evaluate
  - this type of anaylsis will end though once an exchange is hit, you usually don't go back past an exchange to find another source since an exchange will change the source user of the input and output.
    - UTXO flows should not be tracked across custodial services. It is highly unlikely that a deposit UTXO will be used to payout to the entity making the deposit
- privacy implications of making payments
  - when making a payment you will reveal some information to a counter party. you will revela more the more you have in a utxo above the payment of your item. 
    - In addition, payments made by a sender allow for a recipient to assess the senders past transaction history. Payments also allow a sender to evaluate a recipients future spending of their received payment.
- MUCH OF CHAIN ANAYLSIS IS BASED ON
  - analysts needing a starting point
  - the issues of the transaction graph
  - change detection
  - clustering separate addresses by the common input ownership heuristic
    - common input ownership heuristic is if a transaction has more than one input then all those inputs are owned by the same entity

- techniques for denyability
  - Stealth Addresses — Denying a Start Point by using BIP 47.
    - examples of starting points are like a user posting an address online for donations. and that beign linked to a person. from that address you can analyse a user’s activity including received payments, total address balance, and spending patterns. all moving forward.
    - all shared addresses
  - coin control.
    - Combining inputs from multiple sources in future spends can allow payment senders to evaluate the transaction histories of additional UTXOs combined with their spent UTXO.
    - how to practice coin control?
      - Labelling received payment UTXOs. At a minimum labelling should include the sender and reason for payment. 
      - “Marking Do Not Spend”. To prevent a wallet from accidentally including a UTXO in a future payment, UTXOs can be made inactive for inclusion in future spends.
      - Sending Individual (Selective UTXO Activation). UTXOs can be selectively spent.
  - Richocet transactions
    - aka dummy transactions.
    - Ricochet is a simple tool that automatically adds “hops”, or dummy transactions between an origin UTXO and payment destination
     -  Ricochet transactions do not obfuscate source of funds or break the transaction graph. However, these transactions put distance between a payment destination and previous UTXO histories.
- Stonewall and Stonewall x2 — Payments Made Safe
  - they are simulated coinjoins. either with one user or two users.
    - I think at least two outputs will have the same utxo amount.
  - stonewall x2 is two users putting utxos into a transactions and both receiving outputs utxos.
- Stoweaway
  - when a payment includes a utxo from the recipient. This way the multiple inputs look like they are coming from the same person when infact they are not.
    - so a two input two output transaction is read as a normal transaction but that is actually not true.
    - the true transaction payment amount will also be hidden since the receiver is adding an amount as well.
- Coinjoins.
  - payment recipients can coinjoin to break the link between their payment receipt and future spending. In otherwords, sending UTXOs received as payment through a coinjoin establishes forward privacy.
  - coinjoins do not include “unmixed change” outputs within the coinjoin transaction that can be used to continue to track user activity.

- steps for good privacy
  - not linking blockchain activities to an online persona,
  - avoiding address reuse,
  - segregating UTXOs with different histories,
  - establishing forward privacy with coinjoin, 
  - and using the advanced spending tools previously discussed to undermine chain analysis heursitics.




# related videos
- https://www.youtube.com/watch?v=06aMJuF1ygU&list=PLIBmWVGQhizLrPjpFMN5bQdbOZRxCQXUg&index=3&ab_channel=SamouraiWallet
- another reason why address reuse is bad is because anyone can look up my address and see my wallet balance. as well they could see every tx i hae made or received
- change is essentially money you have already spent once, you just spent it in another utxo, so don't go spending it in another one unless you want to link them together
  - If a transaction has multiple intra-UTXO flow interpretations, Boltzmann will score the transaction’s entropy greater than or equal to 0. The concept of entropy originates from a thermodynamic mental model. In this model, the number of interpretations can be thought of as microstates of the overall transaction macrostate.
  - entropy can be seen as a metric measuring the analysts lack of knowledge about the exact confirguration of the transaction being observed

- coinjoin properties are evidence that a transcation has multiple users, contributing inputs to the transaction. Therefore transactions with entropy have coinjoin properties and broken deterministic links

- a coinjoin is clearly observed on chain and therefore the person looking at it knows there are multiple users and can be sure they can not know for certian which input is related ot the output. This is like encryption, you know the message exists but an outside observer does not know the details of it. 
- with stoweaway aka payjoins, they may not know it is a privacy based transaction and therefore incorrectly assume each of the inputs are controller by the same user. an outside observer is not aware that the "message" happened aka a secret message hiding technique
  - payjoins often result in false cluster on chain footprint, since the observer does not know they happened


- summary
  - Change detection heuristics can be defeated by avoiding round payment amounts, creating transactions with identical change output script types, and randomising change output positions.
  - Equal output coinjoins are collaborative transactions involving multiple users. By breaking deterministic links these transactions create ambiguous transaction graphs. By involving multiple users, they defeat the CIOH.
  - Payjoin transactions are also collaborative transactions. They involve the payer and payee in creating a transaction and have the same transaction fingerprint as a normal multi-input spend. Without an identifiable fingerprint, these transactions defeat the CIOH.



# Article for privacy
- https://en.bitcoin.it/wiki/Privacy
- summary of how normal bitcoin users can improve their privacy.
  - What is your threat model?
  - Do not reuse addresses, Addresses should be shown to one entity to recieve moeny and never used again after the money from them is spent.
  - avoid attaching email addresses, names, real live address and all kry when transacting.
  - use your own full node when using a bitcoin wallet.
  - broadcast onchain transactions over tor.
  - use the lightening network.
  - use a wallet that implements coinjoin.
  - avoid creating change addresses, fund a lightening channgel iwth an entire utxo.
  - use tails OS.
- Introduction
  - the linkages between addresses made by transactions are often called the transaction graph.
    - alone this information can't identify anyone because the addresses and transaction IDs are just random numbers.
    - if any of the addresses in a transactions past or future can be tied to an actual identity it might be possible to work from that point and deduce who may own all the other addresses.
    -  you need forwards and backwards privacy. if you reveal your information when you receive the bitcoin then when you spend it you are not private. Or if you privatly receive the bitcoin but then give information when you spend it (give mailing address to recieve a good), then you can be linked to buying it.
  - Multiple intepretations of a blockchain transaction
    - how many possible ways is there to interpret a two input two output transaction?
      - 9
       - Alice provides both inputs and pays 3 btc to Bob. Alice owns the 1 btc output (i.e. it is a change output).
       - Alice provides both inputs and pays 1 btc to Bob, with 3 btc paid back to Alice as the change.
       - Alice provides 1 btc input and Bob provides 3 btc input, Alice gets 1 btc output and Bob gets 3 btc output. This is a kind of CoinJoin transaction.
       - Alice pays 2 btc to Bob. Alice provides 3 btc input, gets the 1 btc output; Bob provides 1 btc input and gets 3 btc. This would be a PayJoin transaction type.
       - Alice pays 4 btc to Bob (but using two outputs for some reason).
       - Fake transaction - Alice owns all inputs and outputs, and is simply moving coins between her own addresses.
       - Alice pays Bob 3 btc and Carol 1 btc. This is a batched payment with no change address.
       - Alice pays 3, Bob pays 1; Carol gets 3 btc and David gets 1 btc. This is some kind of CoinJoined batched payment with no change address.
       - Alice and Bob pay 4 btc to Carol (but using two outputs).
    - heuristics are used to excluded some of the possible 9 examples we said above.

  - a small data leak combined with other data leaks can be very dangerous, at first it might not be thought of as dangerous but then later on it can be.
    - a public financial ledger is unheard of, we must do what we can to keep it private.
- Blockchain attacks on privacy
  - wallet clusters aka addresses of a single entity are obtained and then later attempted to tie to a real identity. 
  - common input ownership heuristic.
    - the purpose of coinjoin is to break this heuristic. 
  - change address detection
    - Change address detection allows the adversary to cluster together newly created address, while the common-input-ownership heuristic and address reuse allows past addresses to be clustered. 
    - what are some common ways of change address detections.
      - address reuse. 
        - a reused address is almost never a change address, making it known that the other one is.

  - wallet finger printing. 
    - what are ways of wallet finger printing? 
      - address formats. wallets typically only use one format type.
      - script type, multi sig or signle sig script?
      - if a wallet does or doesn't follow bip69 for ordering transctions.
      - coin selection algorithms.
  - unnessecary input heruistic.  
    - if a wallet puts in a utxo of 3 and 2, and there is an output of 4 and 1, the change must be 1, since if the payment was 1 then why would the user put in two inputs if it could have been covered by one.

  - sending to a different script type.
  - equal output coin join.  
    - if the inputs are not equal, but some of the outputs are, you can tell which change outputs are related to which inputs.
- transaction graph heuristic.
- input amounts reveal wealth.  
  - if a user makes a small transactions but include a big utxo, they showed someone they are wealthy.
- a script type so unique it might narrow down who you are. or information about you.
  - like what is a unchained address is so unique it shows a hacker that someone at unchained has 500 bitcoin, therefore they try to hack their unchained account.
- a merchant displaying addresses is dangerous, someone could start linking addresses to you and follwoing your wallet.
- dust attacks, recieve bitcoin hoping that a wallet includes it in a tx and then they can track you
- Methods for improving privacy (non-blockchain)
  - obtain bitcoin ananomously. 
    - do not attach your name to the bitcoin, this is the single most important thing you can do.
    - without this, the other heuristics do not provide much value.
    - cash trades.
    - mining bitcoin is the most private way.
  - spending bitcoin anoymously.
    - dont give your address when you spend bitcoin.

- Methods for imrpove pricacy (blockchain)
  -  avoid address reuse.
  - coin control
  - change avoidance.
    - not having a change output is great for privacy.
  - create more than one change output.
    - this breaks change output heiristics.
  - coinjoin
    - what makes a coinjoin effective?  
      - having more than one output with the same amount.
  - PAyjoin
    - when a person receiving a payment includes an input. 
      - helps break who is the sender and who is the receiver of the payment.
  - silent payments
- Existing privacy solutions.


# Wasabi analysis
- https://archive.ph/LYXL0
- more on anominity set calculation
  - When remixing, the expectation is that you are taking the obtained anonymity set from the prior mixes (subtracting 1, since your 1 TXO is being consumed) and adding the anonymity set obtained in the second mix transaction.
If we were to remix our previously mentioned initial TXO in an additional CoinJoin transaction that obtained a further 50 anonymity set, we would expect a total score of 99 ( 50-1 + 50 ) 
- due to how remixes are done this paper says
  - Absent the implementation of a solution, users of Wasabi Wallet should be aware that the anonymity set of their postmix output may potentially be as low as the anonymity set provided by the last mix of the associated TXO. Users should act accordingly, depending on the specifics of the last mix and depending on their own threat model.
- overview of the issues in the paper
  - Lack of Randomness: The main vulnerability identified is the deterministic coin selection algorithm used by Wasabi. When selecting unspent transaction outputs (TXOs) for mixing, the wallet does not introduce randomness. This allows an adversary to predict which TXOs will be included in future mixing rounds, thereby undermining the effectiveness of the CoinJoin process.
  -  Impact on Anonymity Set: The anonymity set—essentially the size of the crowd your coins are mixed with—is compromised. If an attacker can predict which TXOs will be mixed in a subsequent round, they can reduce the perceived anonymity of those outputs significantly. For instance, if an expected mix would yield an anonymity set of 99, the knowledge of which TXO will be remixed can drop this to just 50, severely diminishing privacy.


# Chainanaylse 
- https://archive.ph/lzVXd
- important argument used by the chain anaylzse company
  - The Bitcoin Fog cluster produced by Reactor is the result of 2 heuristics: an improved version of the Common Input Ownership Heuristic (i.e. all addresses used as inputs to a transaction are controlled by the same entity) and a second heuristic clustering addresses composing a peelchain (i.e. a long chain of transaction "peeling" small amounts of UTXOs for payments).
  - another explanation of peel chain heuristic.
    - https://www.linkedin.com/pulse/peel-chain-analysis-moneyflow-step-by-step-guide-bitquery-wvzkc/



# BITCOIN DESIGN ON PRIVACY 
- https://bitcoin.design/guide/how-it-works/wallet-privacy/ -x

# River
- https://river.com/learn/bitcoin-privacy-and-anonymity/
- For chain analysis to be useful, it must be combined with some reliable starting data, such as the ownership of certain UTXOs or addresses. KYC/AML compliance by custodians and exchanges provide this starting data. If the ownership of a specific UTXO is known, when that UTXO is spent, chain analysis can attempt to determine whether it was sent to another party or it was sent back to the same owner.

# Privacy Notes for live wallet
- have the ability for users or automatically mark transactions that most likely have PII associated with them.
- track change outputs and make sure that they are not used often, or if they are make it known that these two utxos are seen as related 
- make sure addresses are not reused
- make sure utxos from sending to an exchange is not mixed with other utxos.
  - this is because it is easy to identify the change.
- Give a utxo a score and then you can click into it and it will explain why based on a set of heuistics?
- not having randomized output positions for change is bad as well. if the wallet always uses the same output position for the change then that is a give a-way.
- use timing analysis to see if transactions always are happening on the same day or other timing analysis.
- be able to explain why a transaction was marked as not private.
- txs with multiple inputs and multiple outputs are noisy and not easily interpreted without special tooling or considerations.
- identify coinjoins. (this is good and makes the observer know they can't be sure how the inputs and outputs relate)
- identify paywalls / payjoins (this is good and helps great false clusters)

- if a utxo is too big and you pay someone with it, and even worse if you attach an address to your payment, then that person has an incentive to wrench attack you, therefore highlight utxos that are too big, say over $10k? and say this is a big utxo. or maybe on a scale of size 10-100k.
- track utxos that have been through a coinjoin, these are highly deniable utxos
- a transaction that has the same input utxo as the recipient utxos is good, helps the change from the recipient.
- make sure that After using CoinJoin, a user should not combine the outputs of their CoinJoin transaction. This nullifies the privacy benefits of CoinJoin.
- ability to detect if it came from aan exchange or not, and ability to amend it if it did, and then also save that data so the user doesn't have to always add it. Would need to save it when you save the wallet.
- mayb a way to think of a score is if a wallet cluster was made of your waller from the outside what % of your utxos / transactions would be correctly clustered to you.
  - the goal of chain analysis is to group addresses together.
- IPs are also analysized, hmm not sure how to incorportate that. way to differenciate your IP vs. VPN vs. tor being used for a transactions.
- maybe you should be able to mark a transaction as made public like for a donation or something.
- if you got your coins from mining then that is great for privacy
- think about did you receive the bitcoin privatly? Did you spend the bitcoin privately. Both forwards and backwards privacy is needed.
- reusing addresses is also bad because it makes it clear what the change was and what the payment was.
- https://checkbitcoinaddress.com/ can be used to check is an address has been posted online.
- be able to detect the unnessecary input heruistic.  
        - if a wallet puts in a utxo of 3 and 2, and there is an output of 4 and 1, the change must be 1, since if the payment was 1 then why would the user put in two inputs if it could have been covered by one.
        - a way to not do this is to add more inputs so the change is actually more than the payment, this breaks the heuristic.
- identify the change from a partial equal output coinjoin with unequal inputs. make sure those change are never added back with the clean outputs.
- be able to mark utxos as clean or dirty, maybe clean is coinjoined or not.
- is there a way to identify dust attacks?
- make sure any data that is stored on the disk about the bitcoin wallet like addresses and keys etc, are encrpyted.
- maybe have the ability t oanaylsse a consolidation for privacy before you create the psbt?
- load in a psbt and tell the user how private this transaction is.

What would the ideal utxo structure look like for privacy?
- utxos that arent too big.
- no links to exchanges
- utxos that are not linked together via exchanges
- various size utxos so that you can make payments of various sizes without needing to aggregate lots of utxos together. and potentially aggregating change together.
  - as well when you pay someone they can now view the future transactions of the change knowing you are the owner of that utxo.
- some way to idenntify or hae a user mark if an address has been posted online publicly. that creates a starting point. 
- should I include labeling in some way?
  - change should be labeled with what it was used for.
  - When payments are made, users should also get in the habit of labelling their change UTXOs. MAybe I should add this to the add highlighting that change utxos have not been labeled with what they have been used for.
- Give the user points for including any dummy transactions aka Ricochet — Adding Distance
  - this should be easy to detect, detect when the user makes single input, two output txs to themselves. 



# Boltzmann and forward privacy.
- botlzman calculates the linkability of the inputs and the outputs of a bitcoin transaction
- https://github.com/Samourai-Wallet/boltzmann?tab=readme-ov-file
  - This metrics can be applied to all bitcoin transactions but are specifically useful for qualifying the quality of a joint transaction
  - This measures coinjoin entropy  
    - measure how many possible mapppings of inputs to outputs are possible given the values of the txos.
    - no additional information is given to determine the probability.
      - (I think this means like no other heuristics are used to weigh the reading of the transaction)
  - Intrinsic entropy
    - the value computed without any additional information, when the transaction is considered seprarted from the blockchain
  - Actual entropy: the value taking into account additional information.
    - this one matters the most to users.
  - Max Entropy:
    - it's the value associated to a perfect coinjoin transaction having a structure similar or close to the evalueted transaction 
    - What is the perfect coinjoin?
      - a coinjoin with all inputs having the same amount and all outputs having the same amount.
  - Wallet efficiency 
    - wallet efficient = intrinsic entropy - max entropy 
    - the efficiency of a wallet when it builds a coinjoin transaction.
  - Blockchain efficientcy = Actual entropy - max entropy.
  - Rule: Actual entropy of a bitcoin transaction is a dynamic value susceptible to decline over time. At best, it will stay constant, it will never increase.
  - Limitations.
    - This metric is susceptible to be tricked by specific patterns of transactions like steganographic transactions. 
    - What is a steganographic transaction?
      - it aims to hide the real payment inside a fake payment.
      - it involces the payee.
      - basically a payjoin for the person receiving a payment
  - A transaction with high entropy is likely to provide better privacy to the users.
    - this fails to detect privacy leaks occuring at the lower lever of specific inputs/outputs.


  - Implementations. 
    - brute force algo, no parallelization, no optimization. 
      - This is a reduction of the problem space by not including external information. 
      - inputs and outputs less then ten are needed due to the bad algo?
      - did about 60-70% of bitcoin transactions. Done in 2015
        - 85% of transactions processed have a null entropy, they have inputs and outputs deterministically linked.
        - 14% of the transactions processed have >= 1 (they are as good or better than ambigous transactions)
        - 1% of the transactions process ahve >=1.5 (They are as good or better than most basix coin join transactions)
          - these all don't ahve coinjoin like structure but they produce entropy like a coinjoin.
      - chat gpt says a coinjoin 5 of 5 with equal input and output would be a 6.9 and a classic two input and two output of different sizes would be 0 entropy.

  - Questions
    - propsed to add this to joinmarket from waxwing
    - Questions from waxwing
      - What does it mean for an input and an output to be linked? Common ownership of both utxos? valid payment, so different owners but a link between the two?
    - Answers from LaurenMT
      - a link between an input and an output captures the concept of an intentional finacial flow between the input and the output (taking into account the amount transferred to the output) but botlzmann doesn't care if a same entity controls a specific input and a specific output.
      - Boltzman only cares about the links between the inputs and the outputs. it does not handle higher interpretations of who controls what.
      - I don't think there is such a thing as a metric able to measure privacy. It is a fool's errand. BUT it is possible to define privacy metrics., a high score doesn't provide any certainty about your privacy but a low score might be a sign of potential privacy issues.
      - Its recent introduction into Samourai Wallet (with a visual indicator of deterministic links) follows the same principle. It's used as a way to build awareness about the issue of deterministic links but it follows the principle that it should be used as a negative indicator (a high entropy doesn't give you any guaranteee but a low entropy isn't a good sign for your privacy).
      - IMHO, the hardest part is all about the "education" of users. Almost all users expect tools providing a metrics telling them that their privacy is safe. The challenge for all of us is to change this mindset.

    - response from LaurenMT
      - Boltzmann is focused on the question of "deterministic links" while the model you're discussing seems focused on the question "who controls what?".
      -  As a consequence, Boltzmann is "useless" for Payjoin/P2EP transactions (and almost all transactions with payments made between the senders).
      - you model seems like an interesting approach which is complementary to Boltzmann. If we envision the bitcoin txs graph as a graph of interlinked utxos, your model has a focus on the ambiguity introduced by the nodes of the graph ("who controls which utxos?") while Boltzmann has a focus on the ambiguity introduced by the edges of the graph ("probability of a link between 2 utxos")


  in terms of boltzman/bitcoin what is a deterministic link?
    - chat gpt.
    - 


  why is it good to have a high botlzman score
    - A high Boltzmann score, which reflects greater entropy in a Bitcoin transaction, is beneficial for several reasons:
      ### 1. Enhanced Privacy
      - **Obfuscation of Input-Output Links**: A high entropy score indicates multiple valid mappings of inputs to outputs, making it difficult for observers to determine which inputs correspond to which outputs. This obfuscation helps protect users' identities and transaction details from analysis.

      ### 2. Resistance to Heuristic Attacks
      - **Difficult to Trace**: Transactions with high entropy are less susceptible to heuristic methods (like the Merged Inputs Heuristic or CoinJoin Sudoku) that attempt to link inputs and outputs based on patterns. This makes it harder for analysts to de-anonymize users.

      ### 3. Improved User Anonymity
      - **Better Protection Against Tracking**: With a higher Boltzmann score, the likelihood of being tracked through the blockchain is reduced. This is particularly important for users who want to maintain their financial privacy.

      ### 4. Encouragement of Best Practices
      - **Transaction Design**: A high entropy score can guide users and developers to adopt better practices in transaction design, such as using varied input and output amounts or employing privacy-enhancing techniques like CoinJoin.

      ### 5. Increased Trust in the System
      - **User Confidence**: Users may feel more secure using systems that promote high-entropy transactions, knowing their activities are less likely to be traced or linked back to them.

      ### Conclusion
      In summary, a high Boltzmann score indicates greater uncertainty about the relationships between inputs and outputs in a transaction, enhancing privacy and protecting users from analysis. It fosters better transaction design practices and increases overall user confidence in the privacy of their transactions.




  in the boltzman analysis do the amounts in the utxos matter?
    - yes they are super important, if you put in an input of 1, and an input of 8, and there is an output of 7, and one of 2 that input can not be linked to taht output.




  - ahh so it is all about tracking someone, and them having forward privacy. if you know the person before the transaction, which is the output that is theirs now? you don't know if you have a 5 input and 5 output tx of teh same amount. the person is now hiding in the crowd.


# Boltzman gist part 2  
- https://gist.github.com/LaurentMT/d361bca6dc52868573a2
  - didn't get anything from this article
# Botlzman gist part 3
 - https://gist.github.com/LaurentMT/e8644d5bc903f02613c6 
  - potential attacks against the privacy provided by tools like coinjoin
  - flaws in algo when new side-channel information is detected , (address clustering, etc)
  - if several inputs are deterministically linked to a same output, addresses associated to these inputs can be clustered together 
  - you rely on other people in a coinjoin. this is a weakness.
    - if you do a coinjoin that looks like
      - input 1 (1 btc)
      - input 2 (2 btc)
      --------
      - output 1 (.8 btc)
      - output 2 (1.2 btc)
      - output 3 (.2 btc)
      - output 4 (.8 btc)
      ---------


      - you have broken the link of two outputs from there inputs 
      - now these is plausibile deniability for output 1 and output 4, you don't know how they link back to the inputs.
        - if one of those users was kyced, you now have split your odds from 100% to 50%
      - but the problem is if the other user then combines their outputs 3 and 4 (.2 and .8), to make a 1 btc payment then it is obvious that the input of 2 btc in connected to output 1 and 2. and we have kyced them again. 
        - or even further down the line the user makes a payment with .8, gets change back and then combines that with output 3, they have now deannomoized themself again
      - how to protect against this?
        - enter multiple rounds of coinjoin
        - do coinjoins that do not rely on just one other user.

  - finger printing
  - conclusion 
    - one round of coinjoin is like no round at all

# UI research, jam app for join market
- https://www.youtube.com/watch?v=FbyjG2upGO8
- the docs have a good analogy about fruit -> jam, to annomozye your bitcoin
  - I don't think the way the anology is presented in the app is that clear, but I like the idea of trying to move a non private amount utxo to more private as it moves along transactions
  - they also have tags on their transactions
    - for example one is cj-out, which means coin join out
  - jam have 8-9-10 collaborators as the default
  - the way join market works is that is takes inputs of various amounts, and then it creates many outputs with the same value


# UI research whirlpool in sparrow
- https://www.youtube.com/watch?v=6TcUY2yU41w
  - badbank change is a label for the amount change sent back to a utxo used in a coinjoin whirlpool 
  - the badbank change is part of the premix transaction.
  - sparrow breaks up outputs the into multiple "wallets". 
    - the badbank is now separate from the utxo in the whirlpool
    - there are four "wallets", deposit, premix, postmix and badbank
  - the ux is like tabs on the right side, and each  time you switch it is as if it is a new wallet, aka different transactions, send tab, adress tab and utxos and settings tab on the left.
  - money will move from the premix 500k utxo to, 5, 100k utxos in the post mix wallet
- In a single whirlpool you have a 1 out of 5 anominity set. 


# UI research wasabi wallet 
- https://www.youtube.com/watch?v=52pSd3I1nac
- allow you to choose coinjoin strategy.
  - minimize cost, maximize speed, maxamize privacy.
  - ability to add a hardware device alongside the hot wallet that is wasabi.
- they have a privacy progress bar.
  - clicking into it gives a breakdown of the privacy of the utxos you own.
    - lets you see the anomnty score.
      - how does wasabi decide the anomity score?
        - if the score is 22 then they have a 1 out of 22 chance of knowing which utxo ws mine.
          - https://www.reddit.com/r/WasabiWallet/comments/194ko9i/how_does_the_anonymity_score_work/
            -  The score on Wasabi 2.0 is calculated similarly to 1.0 such that each UTXO gains points based on the number of other coinjoin outputs in the transaction have the same matching value. The main difference from 1.0 is that you can receive multiple outputs of the same size, which divides your score between them.

              In regards to good privacy, it somewhat depends on the amount you are coinjoining since smaller users are able to hide their coins better than whales. If you are cautious about privacy, I recommend remixing your coins at least one time, which is about ~15 for your anonymity score target in most cases. I wouldn't recommend going above 50 anon score target unless you are coinjoining larger amounts.

              Coin control is no longer displayed because there's no more toxic change produced by coinjoins. Your entire balance is turned private, so there's no need to sort through labels to figure out which information you will share with others depending on how you construct your transaction.
        - https://blog.wasabiwallet.io/what-is-the-difference-between-an-anonymity-set-and-an-anonymity-score/
          - TODO read this article.
  - ui of the coins shows what type of address it is, this is important for not breaking the heuristic of the address type
  - another nice ui feature is it shows you previous labels and allows you to attach them to other utxos
  - another nice ui is it allows you to label the recipient wallet when you do a send.
  - the manual coin control and send ui is nice.
  - they kind of have a privacy analysizer themselves when a tx is created.
    - they even have a recomendation with the ability to click it to imrpove privacy.
  - https://primal.net/e/note1vnpkwaqdnw7mwhf9t3cpg5xes5ms5v8svwhv5gav4ep07jsrngksafsxvq
    - Privacy score used in Wasabi is not an AnonSet, but an AnonScore. It is based on AnonSet but lowered if privacy harming behavior is detected, such as remixing with the same participants. Coordinators could also introduce a minimum amount of fresh bitcoin per rounds
  - wabsi sabi is weakest for the very largest wale in the transaction
  - podcast with some insight on the ui
    - https://www.youtube.com/watch?v=v952Fd1vmOs&ab_channel=BitcoinTakeover 
      - 2.0 tried to hide utxos. where as one had great coin control. This was back tracked a bit though. 
  
  -annominity score vs annominity set
    - https://blog.wasabiwallet.io/what-is-the-difference-between-an-anonymity-set-and-an-anonymity-score/
    - wasabi 1.0 had an annominity set that it used that it gave to utxos. 
      - his measurement was called an “anonymity set,” which is equal to the number of peers in your coinjoin transactions that share an output of an identical value
    - An anonymity set is a number that is equal to the size of the group you’re hiding in. For example, if you participate in a coinjoin round with 50 different peers in which each provides an input and each gets 1 coinjoined output of equal amounts, the anonymity set for each of the latter would be 50. On the other hand, the anonymity score extends the definition of the previous term by considering edge cases to give a more precise and conservative definition of quantifiable privacy guarantee.
    - annominity set is equal to the size of the group you are hiding in. how many other users have the same output utxo as you?
    - if you are part of multiple coin join rounds your annominity set increases becausae it accumulates peers each time, increasing the size you are hiding in.
    - in wasabi 2.0 the anominity score is always equal to or lower than your annoniminity set.
    - the annoniminity score comes from the coordinator, since they have more information than an outside observer.
      - the anonymity score is client-specific since it takes into consideration the existing privacy of inputs and number of outputs a client registered in a given coinjoin round.
      - The first edge case is if you have multiple outputs of the same denomination in a coinjoin transaction, your anonymity score becomes lower than if you only had one.
    - what about mixing coins 
      - dont mix postmix (or any post mix tx change) and non mixed.
      - dont mix post mixes (or any post mix tx change) from different rounds.
      - if you mix post mixed from the same round that is better but it reduces you annominity set by two.

- one thing that stinks is that if you send a tx to a ne wwallet after it has been coinjoined, then it doesn't give it a high anomity score because it didn't just come from a coinjoin it looks like you just received your first payment.
  - would be nice if you have the aility to mark it as coming from a coinjoin and then it can mark the anomity set from the previous tx.
    - actually I do think they can recognize this if you select the wallet as the receive wallet and don't do a manual send.



- hmm should I just analyse collaborative transactions vs regular ones.
- hmm maybe a collaborative custody buddy.
  - helps keep clean utxos from being combined with dirty ones.



# GREAT IDEA
- transaction privacy analysis based on selected privacy policies.
- a user will be able to load in a new psbt or select one of their previous transactions which will all be laid out for them, and they will be able to select which privacy policies they want to analysise the transaction for and then hit analyse and then it will result in is the policy was passed or not. 
- another idea would not just be transaction analysis but a transaction builder to follow these, that seems more advanced though.
  - but if I can analyse them I should be able to build them.
-  Will I need to be able to view indivudal transactions like sparrow or mempool?
  - showing the inputs and the outputs and the amounts associated with them, and the address they came from and are going to?
- What are a series of privacy policies a user can choose?
- You should be able to browse policies and read about what they are and why it is good. 
- some of this may require labeling from the user before hand. Like is this utxo kyced or not.
- TODO: come up with policies and an explanation of what they are and why it is good.
  - # Selectable privacy policies
    - number of consecutive coinjoin rounds that a utxo came from. 
    - choose your anoominity set, aka how many txs should look like yours (aka equal output) in a tx.
      - should be able to calculate based off of multiple transactions
    - No change. 
    - no small change.
      - you probably are better off with no small change for privacy than change with a small amount.
    - no reused addresses
      - another reason why address reuse is bad is because anyone can look up my address and see my wallet balance. as well they could see every tx i hae made or received
    - reveal least amount of wealth
      - maybe even have the user able to set what they consider an amount that is okay to show that they own above the payment.
    - reveal least amount of past tx history, aka don't combine utxos, especially not change outputs.
      - dont use utxos that has come from many other transactions you were involved in. if you use a 1 btc to pay for .005, and then use the change to pay again and again again, everytime you use it it may be obvious your past transactions
    - no wallet clustering (aka no combining change if possible)
    - dont mix post mixes (or any post mix tx change) from different rounds.
      - if you mix post mixed from the same round that is better but it reduces you annominity set by two.
    - dont mix postmix (or any post mix tx change) and non mixed.
    - a more general one like "no traceable change" which includes sub field.
      - make sure no address reuse
      - no round number payments.
      - no same script type for the inputs and only one output.
      - largest output amount heuristic (this is weak)
      - spending to an exchange, it is obvious you are the change
      - break the unnessesary input heuristic.
      - more than one change output.
      - change output should be of similar size of payment
    - make sure dust attacked coins are not spent.
    - break the common input odwnership heuristic.
      - aka this would require an input from someone else.
        - aka a payjoin
    - break volume or other pattern recognition analysise.
      - the change should not always be in the same output position.
      - timing analysis, make sure you are not always receiving transactions on the same day.
    - make sure do not spend utxos are not spent
      - I would need the ability to mark them as do not spend though.
    - must require dummy transactions before hitting recipient.
      - aka include riochets.
    - break peel chain heuristic
      -  its “peel chain” heuristic assumes that unspent Bitcoins are linked along a chain where the bigger transaction is the spender keeping their “change.
        - I am not 100% sure about this one.
      - be able to mark a transaction as publicly known, and then mark  don't spend / include from publicly known addresses.
    - no kyc coins. 
      - ability to mark kyced vs non kyced vs. not labeled.
    - ability to label, previously coinjoined.


  - explanations should include, to break this heuristic you must have a number of outputs that have an equal value. to break this heuristic,  you must not include utxos  with large amounts. you must use the smallest amount utxos available.


- ability to differenciate between what coins are used and what the result fo the transaction is?
- should I just do an annominity set nlayization like wasabi.
  - yeah I love this for each utxo.
- it is good to analyse past transaction because this may help highlight what utxos (from previous txs receiving or spendign and getting hcange need to be coinjoined.) 
- ANOTHER IDEA FOR THE APP IS SELECTING THESE requirement boxes and an amount AND THEN HIGHLINGHTING WHICH combination of utxos would be usable for this type of transaction.

# what labels are available in live wallet to attach to utxos.
- do not spend 
- coming from coinjoin from other wallet I own.
- kyced 
- no-kyced.
- maybe custom label
- do I need the dust attack label?


# Initial thoughts on how v1 UI will look 
- Do I need to distinguish between transactions the user makes vs. ones where they receive bitcoin?
- Receiving bitcoin is pretty simple privacy.  You just create a new address. But for a utxo, you want annominity set and you want no reused addresses.
- For sending there are a ton more privacy metrics.
- I need tabs, privacy / efficiency
    - There is a little side bar padding already, I could add two little buttons there, one with a wallet icon one with a private icon to switch between the two modes.
    - Or I could add it right in the middle of the top header.
- Privacy section tabs
    - If needed I could have sparrow like tabs on the side for transactions and utxos. And a section for new
        - New (or call it psbts) hm maybe just “preview”
            - New will be where you put psbts. And then you can analyze them.
            - Maybe it is called preview because you are previewing or analyzing a tx before it is sent/complete.
        - Utxos tab
            - This is where you can mark utxos, label them as kya or no kyc.
                - Should be able to mark SPENT UTXOS, therethre should be able to toggle showing STXOS so you can label those as well. 
                - Also will be in a table where it has the amanimity set. 
                - Will also be red if it has a reused address.
                - Able to mark do not spend on utxos.
                - Able to mark previously conjoined.
        - The order should be transactions, utxos, new. This way it goes from most complete to least complete. 
    - The ui for analyzing a previous tx and a psbt will be the same ui. Selecting how you want to analysis, and then hit an analyst button, and then see the same ui output for how well the tx did and suggestions for it to be improved / could have been improved.
  - have a page that lists all privacy metrics and explains them all.
 - flow, pick your transaction (or psbt), hit next or some button, pick metrics you want to analyze by, hit analyze button, view output. Maybe ability to save it?
Eventually add a create tab which will go through a similar flow of, select amount, select privacy metrics, then it will pick which utxos you should include. And maybe even create that psbt for you?
- maybe a feature showing most likely cluster?


# TODO NEXT STEPS
- build a display of all transactions
- build a utxo annonominity set viewer for all utxos and for individual ones.



Kruw on bitcoin privacy
- https://www.youtube.com/watch?v=v952Fd1vmOs&ab_channel=BitcoinTakeover
- I guess wabi sabi protocol the output size is not known until after the inputs are collected. 


- good video showing post mix fail from wasabi
  - https://www.youtube.com/watch?v=alcLdBsoDDg
