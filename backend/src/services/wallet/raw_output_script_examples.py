# P2PK
# 03618C7F93A5EDCA6206F2BCDF8EB0D0775109E01BEB36344B371E981F434F41D9 OP_CHECKSIG
# this one didn't work either
p2pk_raw_output_script = (
    "2103618C7F93A5EDCA6206F2BCDF8EB0D0775109E01BEB36344B371E981F434F41DAC"
)


# P2PKH
# OP_DUP OP_HASH160 3ad68dd3d99f30bfe131c76d4160b76eae8d109d OP_EQUALVERIFY OP_CHECKSIG
# OP_DUP duplicates the top stack item.
# OP_HASH160 computes the RIPEMD160 hash of the top stack item.
# 3ad68dd3d99f30bfe131c76d4160b76eae8d109d is the public key hash.
# OP_EQUALVERIFY ensures that the top two stack items are equal, popping them off the stack if they are.
# OP_CHECKSIG checks the signature against the public key hash.
# This output script specifies that to spend the funds, the spender must provide a signature that corresponds to the public key hash 3ad68dd3d99f30bfe131c76d4160b76eae8d109d.
p2pkh_raw_output_script = "76a9143ad68dd3d99f30bfe131c76d4160b76eae8d109d88ac"


# P2SH
# OP_HASH160 742B99CB92E68D3838F0C4C905401F1C96278554 OP_EQUAL
p2sh_raw_output_script = "a914742b99cb92e68d3838f0c4c905401f1c9627855487"

# P2WPKH
# 00141D0F172A0ECB48AEE1D865A585B2042107FAC
# this one didn't work for some reason?
p2wpkh_raw_output_script = "00141D0F172A0ECB48AEE1D865A585B2042107FAC"

# P2WSH
p2wsh_raw_output_script = (
    "0020A8A5EBAEAAE373D2CEA2CD17386AA8DBF2C43F81A3A7173E62147B1E50A7D57A"
)
