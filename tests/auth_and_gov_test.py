from web3 import Web3
import json
import time
from hexbytes import HexBytes
from eth_abi import decode_abi
#Constants
INFURA_URL_KOVAN = 'https://kovan.infura.io/v3/API KEY' #HTTPProvider
GANACHE_CLI = 'http://127.0.0.1:8545'
GANACHE_APP = 'http://127.0.0.1:7545'

#Web3 Connection
web3 = Web3(Web3.HTTPProvider(GANACHE_APP))
print('Connected:', web3.isConnected())

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
Migrations_Adr = '0xdf1568512a59Cc07369Dd4E463fA2e0e334c786D'
RBCN_Adr = '0x7f651DE312C8F1F7A42D2C4c5f70d29abf780C71'
Timelock_Adr = '0x4169db3c8Bf65E487d3e7a8b8269DaB0F6a6D166'
SenateAlpha_Adr = '0x86852Cbe4260c0958b2da1cE9938E6dD91f62ea2'
RubiconMarket_Adr = '0xF0d4c69516EA72a69BBf2A30aAbaA77D454B74c1'
WETH_Adr = '0xAc4a1dac75eaF7Ba035f50C609A0884D7a240E0c'
DAI_Adr = '0x8f27F4D6FA6BB073791660Ae82EB6EC8cB8dbfe8'

#Ganache paste:
#INTERNAL ADMIN:
A0_Adr = web3.eth.accounts[0]
A0_PVK = '01a54d7d0bef86e46ed186accfd8d5ccd84e0c5f6eaf309aa77d49977bcfc45a'

A1_Adr = web3.eth.accounts[1]
A1_PVK = '97727e44d37ba8862a110d69fab070c303217084409ddaa6bccbdc2f5f6ccee5'
A2_Adr = web3.eth.accounts[2]
A2_PVK = 'c26f5b6489cb496d4926e09cc9f813bde04cec8aac2ebca54e5babedb4c75f77'
A3_Adr = web3.eth.accounts[3]
A3_PVK = '2d9d5f49f2ccbcf64a5630d127264cffc2157243fbf4279c0b87acdd71b77ed4'

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
RubiconMarket_C = load_contract('RubiconMarket', RubiconMarket_Adr)

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
if a_success == True: print('accept Senate as admin successfully executed')

setAdmin_MM = send_transaction(
        RubiconMarket_C.encodeABI(fn_name = 'setOwner', args = [Timelock_Adr]),
        A0_Adr,
        'set admin of Matching market as timelock',
        RubiconMarket_Adr,
        0,
        True,
        A0_PVK)
if (RubiconMarket_C.functions.owner().call() == Timelock_Adr):
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


time.sleep(2)
print('\n***** Governance Test *****')

#1. Have holders of RBCN create a proposal to change
print('\nHolders of RBCN, in this case admin, make proposal to change buyEnabled')
print('Current status of buyEnabled:', RubiconMarket_C.functions.buyEnabled().call())
print('RBCN getCurrentVotes of Admin: ', "{0:,}".format(RBCN_C.functions.getCurrentVotes(A0_Adr).call()/1e18))
delegateSelf = send_transaction(RBCN_C.encodeABI(fn_name="delegate", args = [A0_Adr]),
    A0_Adr,
    'delegate votes to admin self',
    RBCN_Adr,
    0,
    True,
    A0_PVK
)
time.sleep(1)

print('RBCN getCurrentVotes of Admin after self Delegation: ', "{0:,}".format(RBCN_C.functions.getCurrentVotes(A0_Adr).call()/1e18))
time.sleep(1)
#
propose_tx = send_transaction_returnHash(
    SenateAlpha_C.encodeABI(fn_name = 'propose', args = [
        [RubiconMarket_Adr], #Targets
        [0],#Values
        ["setBuyEnabled(bool)"],
        [RubiconMarket_C.encodeABI(fn_name="setBuyEnabled", args = [False])],
        'A proposal to disable the parameter buyEnabled on RubiconMarket'
    ]),
    A0_Adr,
    'make proposal',
    SenateAlpha_Adr,
    0,
    True,
    A0_PVK
)
time.sleep(1)

proposal_rcpt = web3.eth.getTransactionReceipt(propose_tx)
logs = SenateAlpha_C.events.ProposalCreated().processReceipt(proposal_rcpt)
# print('SHOULD BE A 1:',logs[0]['args']['id'])
active_id = logs[0]['args']['id']
active_id = 1

print('Status of proposal: ', SenateAlpha_C.functions.state(active_id).call())
#NOTE: by default ****** 3 days must pass in blocks to test this***** need a test work around
push_to_next_block = send_transaction(0, A1_Adr, 'flip to next block', A2_Adr, 1, True, A1_PVK)
#2. Have Admin vote on a new proposal https://compound.finance/docs/governance?ref=medium#propose
vote_on_proposal = send_transaction(SenateAlpha_C.encodeABI(fn_name= 'castVote', args=[active_id, True]),
    A0_Adr,
    'vote on proposal',
    SenateAlpha_Adr,
    0,
    True,
    A0_PVK
)
time.sleep(1)

#3. Queue the new proposal after a successful vote
queue_proposal = send_transaction(SenateAlpha_C.encodeABI(fn_name= 'queue', args=[active_id]),
    A0_Adr,
    'queue on proposal',
    SenateAlpha_Adr,
    0,
    True,
    A0_PVK
)
time.sleep(1)
push_to_next_block2 = send_transaction(0, A1_Adr, 'flip to next block', A2_Adr, 1, True, A1_PVK)

time.sleep(1)

#4. Execute new proposal
execute_proposal = send_transaction(SenateAlpha_C.encodeABI(fn_name= 'execute', args=[active_id]),
    A0_Adr,
    'execute on proposal',
    SenateAlpha_Adr,
    0,
    True,
    A0_PVK
)
time.sleep(3)


# push_to_next_block3 = send_transaction(0, A1_Adr, 'flip to next block', A2_Adr, 1, True, A1_PVK)

#5. Check to see if worked...:
print('Current status of buyEnabled:', RubiconMarket_C.functions.buyEnabled().call())
if (str(RubiconMarket_C.functions.buyEnabled().call()) == 'False'):
    print('\nProposal worked as expected and buyEnabled now False!!!')
else:
    print('FAIL - buyEnabled unchanged')
time.sleep(3)
# https://github.com/MetaMask/metamask-extension/issues/2822
#PRESENTLY TX's are going through but this variable is not updating.... NEED TO REVIEW THIS. Could be ganache error like above^
