from web3 import Web3
import json
import time
from hexbytes import HexBytes
from eth_abi import decode_abi
#Constants
INFURA_URL_KOVAN = '' #HTTPProvider
GANACHE_CLI = 'http://127.0.0.1:8545'
GANACHE_APP = 'http://127.0.0.1:7545'

#Web3 Connection
web3 = Web3(Web3.HTTPProvider(INFURA_URL_KOVAN))
print('Connected:', web3.isConnected())


#*****************Testing Library********
#Initialize Contract function
def load_contract(name, address):
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
    # try:
    #     print('Estimated Gas for' + desc, web3.eth.estimateGas(txData))
    # except Exception as e:
    #     raise e
    if sendIT == False: return True
    if sendIT == True:
        signed_tx = web3.eth.account.signTransaction(txData, PK)
        tx_hash = web3.eth.sendRawTransaction(signed_tx.rawTransaction)
        print('Sent TX of ' + desc, web3.toHex(tx_hash))
        return True

def send_transaction_returnHash(encodedABI, sender, desc, to, value, sendIT, PK):
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
        return tx_hash
#*************************************
#Test 1 Outline: [Potentially run trade test in context of this?]
# Check that all contracts are correctly connected in AUTH scheme
#1. Initialize RBCN to the admin
#2. Have the admin vote on a new proposal
#3. Pass a proposal which changes a parameter in the protocol and takes a measurable effect
#4. Instantaneusly pass through timelock (test timelock functionality) and change protocol

#*************************************
#Active contracts on Ganache paste



#9/12/2020 Kovan Deployment:
Migrations_Adr = '0x53d65f3a43fef6FD3095A7b77054895cEa5293d5'
RBCN_Adr = '0x6baeEfF13E0FC9bE030bD857018afFA8e19855Cc'
Timelock_Adr = '0x7aAfc1AC36a3159450C5f65fd10672FD02ccB744'
SenateAlpha_Adr = '0x802bF11CF1955ceBcc3C52bd64C936a116165415'
MatchingMarket_Adr = '0x450C5368A2f39cb89F1266AE0B8c425167c0095f'
# WETH_Adr = '0x0f5AdE274ce583f556fEE7506f1F4F9344dD57B5'
# DAI_Adr = '0xF5502A83edd6a945a71fA6AE743E6fCEd4bE7A15'

#Ganache paste:
#INTERNAL ADMIN:
# A0_Adr = web3.eth.accounts[0]
# A0_PVK = '0x87530901de701cc7ab2f868705a7159c72e323af75bea89abbdf3715261ef9e9'

# # Kovan deploy
A0_Adr = '0xAEda61154aaF841250f3e0A6bb0dc12696549747'
A0_PVK = ''


# A1_Adr = web3.eth.accounts[1]
# A1_PVK = '97727e44d37ba8862a110d69fab070c303217084409ddaa6bccbdc2f5f6ccee5'
# A2_Adr = web3.eth.accounts[2]
# A2_PVK = 'c26f5b6489cb496d4926e09cc9f813bde04cec8aac2ebca54e5babedb4c75f77'
# A3_Adr = web3.eth.accounts[3]
# A3_PVK = '2d9d5f49f2ccbcf64a5630d127264cffc2157243fbf4279c0b87acdd71b77ed4'

print('\n***** Check of Auth Scheme and Balances *****')

#Migrations check
Migrations_C = load_contract('Migrations', Migrations_Adr)
mig_adm = Migrations_C.functions.owner().call()
if (mig_adm == A0_Adr):
    print('Admin of Migrations is Internal Admin [Account 0]')
else:
    print('Adming of Migrations FAIL')

#Check to see parameters are passing in constructors
SenateAlpha_C = load_contract('SenateAlpha', SenateAlpha_Adr)
Timelock_C = load_contract('Timelock', Timelock_Adr)
RBCN_C = load_contract('Rubicoin', RBCN_Adr)
MatchingMarket_C = load_contract('MatchingMarket', MatchingMarket_Adr)

print('\nSet Admin of Timelock as Senate:')
#First, need admin to queue and execute a setPending call directly on timelock_

# REF def send_transaction(encodedABI, sender, desc, to, value, sendIT, PK):
# 1. Call setAuthSchemeOfSystem
if (Timelock_C.functions.admin().call() == Migrations_Adr):
    print('Current Timelock admin is the Migrations contract')
else:
    print('FAIL - Current Timelock Admin is not Migrations Contract')

q_success = send_transaction(
        Migrations_C.encodeABI(fn_name = 'setAuthSchemeOfSystem', args = [Timelock_Adr, SenateAlpha_Adr]),
        A0_Adr,
        'setAuthSchemeOfSystem',
        Migrations_Adr,
        0,
        True,
        A0_PVK)
time.sleep(5)
if q_success == True: print('setAuthSchemeOfSystem successfully executed')
#2. call _acceptAdmin on Senate
time.sleep(2)
a_success = send_transaction(
        SenateAlpha_C.encodeABI(fn_name = '__acceptAdmin', args = []),
        A0_Adr,
        '_acceptAdmin on Senate',
        SenateAlpha_Adr,
        0,
        True,
        A0_PVK)
time.sleep(5)
if a_success == True: print('accept Senate as admin successfully executed')

setAdmin_MM = send_transaction(
        MatchingMarket_C.encodeABI(fn_name = 'setOwner', args = [Timelock_Adr]),
        A0_Adr,
        'set admin of Matching market as timelock',
        MatchingMarket_Adr,
        0,
        True,
        A0_PVK)
time.sleep(5)

if (MatchingMarket_C.functions.owner().call() == Timelock_Adr):
    print('Matching Market owner is Timelock, correctly implemented into Auth Scheme')
else:
    print('FAIL - owner of Matching Market is not Timelock')

print('\nCheck Values of Senate contract:')
#This is working correctly... correct values being passed into constructors.
print('Timelock value on Senate: ', SenateAlpha_C.functions.timelock().call())
print('RBCN value on Senate: ',SenateAlpha_C.functions.RBCN().call())
print('Gaurdian value on Senate: ',SenateAlpha_C.functions.guardian().call())
print('proposalMaxOperations: ',SenateAlpha_C.functions.proposalMaxOperations().call())
if (SenateAlpha_C.functions.RBCN().call() == RBCN_Adr and SenateAlpha_C.functions.timelock().call() == Timelock_Adr):
    print('Senate is correctly auth\'d')
else:
    print('FAIL - Senate is not correctly Auth\'d')


print('\nCheck Values of Timelock:')
print('Current Timelock delay:', Timelock_C.functions.delay().call(), 'seconds')
print('Current Timelock admin:', Timelock_C.functions.admin().call(), '... should be the Senate')
if (Timelock_C.functions.admin().call() == SenateAlpha_Adr):
    print('Timelock\'s admin is the Senate')
else:
    print('Timelock\'s admin is not the Senate FAIL')

print('\nCheck Values of RBCN contract:')
print('RBCN Total Supply: ', "{0:,}".format(RBCN_C.functions.totalSupply().call()/1e18))
print('RBCN Admin Balance: ', "{0:,}".format(RBCN_C.functions.balanceOf(A0_Adr).call()/1e18))
