from enum import Enum


# str inheritance is need to make the enum
# json serializable in pydantic.
class ScriptType(str, Enum):
    P2PK = "P2PK"
    P2PKH = "P2PKH"
    P2SH = "P2SH"
    P2WPKH = "P2WPKH"
    P2WSH = "P2WSH"
