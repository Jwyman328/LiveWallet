from hwilib import commands, common
import time


def list_wallets():
    # command to get devices
    result = commands.enumerate()

    print(result)
    # client = commands.find_device(None, "trezor")
    # print("vlient", client)
    # example response trezor
    # [{'type': 'trezor', 'path': 'webusb:020:3', 'label': 'My Trezor', 'model': 'trezor_t', 'needs_pin_sent': False, 'needs_passphrase_sent': False, 'fingerprint': '3ea1ed78'}]
    client = None
    if len(result) == 0:
        print("No devices found")

        # can't find coldcard right now, should I use find_device?
        # THIS WORKED! therefore I should do it for coldcard and trezor? if I can't find it
        client = commands.find_device(None, "coldcard")
        if client is None:
            client = commands.find_device(None, "trezor")
            # does find_device return the same thing as enumerate? I dont think so.
            # [{'type': 'coldcard', 'model': 'coldcard', 'label': None, 'path': 'DevSrvsID:4295424485', 'needs_pin_sent': False, 'needs_passphrase_sent': False, 'fingerprint': 'someFinderPrint'}]
            print("fd", result)

            prompt_pin_response = client.prompt_pin()
            print("prompt pin response", prompt_pin_response)
            # TODO
            # you must capture the input and then use client.send_pin()
            time.sleep(2)
            # currently returning 1111 since that is what my test trezor is using
            user_input = input("Enter your name: ")
            print("using in put", user_input)
            is_pin_correct = client.send_pin(user_input)
            print("is pin correct", is_pin_correct)
        return

    if client is None and len(result) > 0:
        path = result[0]["path"]
        password = None
        # probably have to allow user to enter this
        chain = common.Chain.MAIN
        client = commands.get_client(result[0]["type"], path, password, False, chain)
        print("client found", client)
        print("No client found")
        return
    if result[0]["needs_pin_sent"] and client is not None:
        prompt_pin_response = client.prompt_pin()
        print("prompt pin response", prompt_pin_response)
        # TODO
        # you must capture the input and then use client.send_pin()
        time.sleep(2)
        # currently returning 1111 since that is what my test trezor is using
        user_input = input("Enter your name: ")
        print("using in put", user_input)
        is_pin_correct = client.send_pin(user_input)
        print("post send pin", is_pin_correct)
        return
    if result[0]["needs_passphrase_sent"] and client is not None:
        client.toggle_passphrase()

    # TODO how do I know the script type?
    # right now I am just using witness by default
    # does the user have to choose their script type and account type?
    # through a derivation path?
    # address_type = common.AddressType.WIT
    # account_number = 0  # what is this?
    # master_xpub = client.get_master_xpub(address_type, account_number)
    # readable_master_xpub = master_xpub.to_string()
    # print(readable_master_xpub)
    #
    # master_finger_print = client.get_master_fingerprint().hex()
    # print(master_finger_print)

    # getting the descriptor might be the best way to do it?
    # commands.getdescriptor()


def test_hwi():
    print("hello world")
    list_wallets()


if __name__ == "__main__":
    test_hwi()


# what I learned from my investigation and playing around with hwi and hardware wallets.
# have the user press scan for devices to initiate searching for them.
# the user must pick the derivation path, the chain, the script type can be derived from the derivation path.
# I can get the script type from the derivation path. so that would be redundent to ask for both.
# I can choose defaults, but the user must be able to override them.
# hwi must be able to tell the user to enter their pin and passphrases when needed.
# if that can't be done on the device how do I capture the correct input and send it to the device?

# TODO
# build a prototype interacting with hwi between forntend and backend with the functions I have so far.
# which really means it is just for extracting the xpub based on the derivation path and chain. but that is a big deal since copying the xpub is the hardest and most tedious part.
# # do more investigation into capturing input in the correct way qand sending it to a wallet for the trezor without an interactive screen.
# the interact with hardware walle tmust
# scan for wallets
# tell user if no wallets exist
# display wallet if one is found
# allow for user to select chain and derivation path.
# tell user if they have to unlock thier wallet
# what about the passphrase step? when does that come into play? testout sparrow and see how they do it.
# help user unlock their wallet if there is no interface to do so on their trezor.
# just start with coldcard and trezor for now.

# UI to import via hardware wallet
# UI button to scan for devices
# this button press will send backend request to scan for devices
# endpoint to find a device.
# this endpoint will call command.enumerate() and command.find_device() and return data on the devices found.
# as well this endpoint probably has to call get_client() to get the client for the device. and then call get_master_xpub and get_master_fingerprint  to get those details as well
# UI message to display if the device needs to be checked/interacted with.
# UI to display the devices found.
# UI to select derivation path and chain.
# button to advance with wallet / derivation path / chain selected.
# pass information to setup wallet page.

# how does sparrow deal with a locked trezor with no screen.
# it recognizes it is in a locked state and prompts the user to unlock it.
# it also will show the keypad and allow the user to hit the key pads to enter the pin or enter it manually
# how does trezor pass that information through hwi?
# the value 'needs_pin_sent': True, is returned
# then if python calls client.prompt_pin() the program stops and there is a message in the terminal
"""
Use 'sendpin' to provide the number positions for the PIN as displayed on your device's screen
Use the numeric keypad to describe number positions. The layout is:
    7 8 9
    4 5 6
    1 2 3
"""
# this will stop the program until client.send_pin() is called


# the layout is
"""
7 8 9
4 5 6
1 2 3
"""

# so if my pin is 1111 if on the device the 1 is in the middle
# then I would send 5555 to the device via hwi send_pin("5555")


# look for all wallet configs that are plugged in
# commands.enumerate()

# look for a specific device that is plugged in
# commands.find_device(None, "coldcard")

# get a device by its path and type
# commands.get_client("path", "type")

# if you need to enter the pin
# device.prompt_pin()
# send pin
# device.send_pin(user_input)


# how do I deal with a passphrase?


# need to handle flow when user enters on screen vs on device for passphrases and pins.

# just tried to find the trezor with the tap screen and it couldn't find it until it was unlocked by the user on the touch screen.
# - the enumerate function just froze and printed out "Please confirm action on your Trezor device"
# - the device can't be found until it is unlocked, and you can't progress past enumerate or find_device until the passphrase is entered.
# the way that sparrow deals with this is that after you press scan it will show a message of please check your device, this is incase the scan is hanging, once sparrow gets back that no devices were found then it just shows no devices found message.
# if a device is found it will hang on the please check device screen if something needs to be done on the device.


# i was mistaken earlier with enumerate vs. find_device, at least I think so, find_device is really an alternative to get_client not enumerate. if enumerate doesn't return the path of a wallet but returns the name then I can use find_device to get the device.
