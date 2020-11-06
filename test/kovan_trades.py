from web3 import Web3
import json
import time
from hexbytes import HexBytes
from eth_abi import decode_abi
#Constants
INFURA_URL_KOVAN = 'https://kovan.infura.io/v3/API KEY' #HTTPProvider
# GANACHE_CLI = 'http://127.0.0.1:8545'
# GANACHE_APP = 'http://127.0.0.1:7545'

#Web3 Connection
web3 = Web3(Web3.HTTPProvider(INFURA_URL_KOVAN))
print('Connected:', web3.isConnected())

#Initialize Contract function
def load_contract(name, address):
    if name == "WAYNE" or name == "STARK": name = "EquityToken"
    with open("./build/contracts/" + name+ ".json") as a:
        a_info_json = json.load(a)
        a.close()
    abi = a_info_json["abi"]
    contract = web3.eth.contract(address=address,
        abi = abi)
    return contract

#Send an ABI Encoded transaction
def send_transaction(encodedABI, sender, desc, to, value, sendIT, PK):
    txCount = web3.eth.getTransactionCount(sender)
    txData = {
        'nonce': txCount,
        'to': to,
        'from': sender,
        'data': encodedABI,
        'value': web3.toWei(value, 'ether'),
        'gas': 6721975,
        'gasPrice': web3.toWei('20', 'gwei')
    }

        # GAS CHECK
    try:
        print('Estimated Gas for' + desc, web3.eth.estimateGas(txData))
    except Exception as e:
        raise e
    if sendIT == False: return True
    if sendIT == True:
        signed_tx = web3.eth.account.signTransaction(txData, PK)
        tx_hash = web3.eth.sendRawTransaction(signed_tx.rawTransaction)
        print('Sent TX of ' + desc, web3.toHex(tx_hash))
        return True

#---------------------------------------------------------
with open('./frontend/packages/dapple/config.json') as f:
  data = json.load(f)

RubiconMarket_Adr = data["market"]["kovan"]["address"]
WETH_Adr = data["tokens"]["kovan"]["W-ETH"]
DAI_Adr = data["tokens"]["kovan"]["DAI"]
WAYNE_Adr = data["tokens"]["kovan"]["WAYNE"]
STARK_Adr = data["tokens"]["kovan"]["STARK"]


A0_Adr = '' #Insert Kovan Main Account - do not expose on a git commit
A0_PVK = ''


RubiconMarket_C = load_contract('RubiconMarket', RubiconMarket_Adr)
WETH_C = load_contract('WETH9', WETH_Adr)
DAI_C = load_contract("DAI", DAI_Adr)
WAYNE_C = load_contract("WAYNE", WAYNE_Adr)
STARK_C = load_contract("STARK", STARK_Adr)


#Mint DAI to ACCT 0
mint = send_transaction(
    DAI_C.encodeABI(fn_name = 'mint', args = [A0_Adr, int(web3.toWei(1000, 'ether'))]),
    A0_Adr,
    "mint dai to A0",
    DAI_Adr,
    0,
    True,
    A0_PVK
)
