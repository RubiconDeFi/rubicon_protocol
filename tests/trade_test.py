from web3 import Web3
import json
import time

#Constants
INFURA_URL_KOVAN = 'https://kovan.infura.io/v3/API KEY' #HTTPProvider
GANACHE_CLI = 'http://127.0.0.1:8545'

#Web3 Connection
web3 = Web3(Web3.HTTPProvider(GANACHE_CLI))
print('Connected:', web3.isConnected())
# print(web3.eth.accounts) # list of Ganache accounts
admin_adr = web3.eth.accounts[0]
Ganache_PRVK_ADM = '0x37583d5c01c8e60fd16d525c583af13c319758681801a01f887ae10eabdbb645'
print('Admin/Deployer Account:', admin_adr)
taker_adr = web3.eth.accounts[1]
Ganache_PRVK_TKR = '0x4b6db5da457fb66d840fd41d4388ed48992c9deed8727ab69b4f3c8796c08ec8'
maker_adr = web3.eth.accounts[2]
Ganache_PRVK_MKR = '0xc9a52956aa938aa2f163917396e890237e0530e7ec9e314c3bf6653c75f069af'
#deploy RubiconMarket.sol on ganache.
#Need to make sure the msg.sender is an admin account that is controlled by rubicon

#addresses of deployed entities in test environment - CHANGES WITH RESET
MM_Adr_G_0 = '0xcAe82339312f331C364b194C0198330689e03586'
WETH_Adr = '0x363D0E6b3cC3A00e501D31fD2985b5DbeD5911a4'
DAI_Adr = '0x4bFA582aEB8e4bb554b3f00752cBB18d2b841B24'

MM_Adr_active = MM_Adr_G_0


#*********************************STAGING**********************
#initialize contracts...
with open("./build/contracts/RubiconMarket.json") as mm:
    mm_info_json = json.load(mm)
    mm.close()
RubiconMarket_abi = mm_info_json["abi"]
RubiconMarket_contract = web3.eth.contract(address=MM_Adr_active,
    abi = RubiconMarket_abi)

print('Close time read value:', RubiconMarket_contract.functions.close_time().call())
print('\n')

with open("./build/contracts/WETH9.json") as w9:
    w9_info_json = json.load(w9)
    w9.close()
WETH_abi = w9_info_json["abi"]
WETH_contract = web3.eth.contract(address=WETH_Adr,
    abi = WETH_abi)

with open("./build/contracts/Dai.json") as d:
    d_info_json = json.load(d)
    d.close()
Dai_abi = d_info_json["abi"]
Dai_contract = web3.eth.contract(address=DAI_Adr,
    abi = Dai_abi)

    #Mint some DAI -- mint(usr, amt) --> TAKER
mint_data = Dai_contract.encodeABI(fn_name = 'mint', args = [taker_adr, int(web3.toWei(100, 'ether'))])
signed_mint_tx = web3.eth.account.signTransaction({'from': admin_adr,
    'data': mint_data,
    'gas': 6721974,
    'to': DAI_Adr,
    'gasPrice': web3.toWei('4', 'gwei'),
    'nonce': web3.eth.getTransactionCount(admin_adr)}, Ganache_PRVK_ADM)

#Send Mint TX
tx_hash_mint = web3.eth.sendRawTransaction(signed_mint_tx.rawTransaction)
print('Sent TX of Mint DAI to Taker', web3.toHex(tx_hash_mint))

time.sleep(2)
#Maker needs to acquire some WETH
encodedABI_4 = WETH_contract.encodeABI(fn_name = 'deposit')
txCount_4 = web3.eth.getTransactionCount(maker_adr)
txData_4 = {
    'nonce': txCount_4,
    'to': WETH_Adr,
    'from': maker_adr,
    'data': encodedABI_4,
    'value': web3.toWei('20', 'ether'),
    'gas': 6000000,
    'gasPrice': web3.toWei('4', 'gwei')
}

    #GAS CHECK
try:
    print('Estimated Gas for Maker acquire WETH: ', web3.eth.estimateGas(txData_4))
except Exception as e:
    raise e

    # Below SENDS TX
signed_CS_tx_4 = web3.eth.account.signTransaction(txData_4, Ganache_PRVK_MKR)
tx_hash_4 = web3.eth.sendRawTransaction(signed_CS_tx_4.rawTransaction)
print('Sent TX of Maker acquire WETH: ', web3.toHex(tx_hash_4))

time.sleep(2)

def send_transaction(encodedABI, sender, desc, to, value, sendIT, PK):
    txCount = web3.eth.getTransactionCount(sender)
    txData = {
        'nonce': txCount,
        'to': to,
        'from': sender,
        'data': encodedABI,
        'value': web3.toWei(value, 'ether'),
        'gas': 6000000,
        'gasPrice': web3.toWei('4', 'gwei')
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

#set min sell as admin_adr
# minsellABI1 = RubiconMarket_contract.encodeABI(fn_name = 'setMinSell', args = [])

#Check Dai balance of Taker and WETH balance of Maker
print('\n')
print('*************Balance of participants pre trade****************')
print('Balance of Taker in DAI:', Dai_contract.functions.balanceOf(taker_adr).call() / 1e18)
print('Balance of Maker in WETH:', WETH_contract.functions.balanceOf(maker_adr).call() / 1e18)
print('Is matching enabled?', RubiconMarket_contract.functions.matchingEnabled().call())
print('Min sell for WETH:', RubiconMarket_contract.functions.getMinSell(WETH_Adr).call())
print('Min sell for DAI:', RubiconMarket_contract.functions.getMinSell(DAI_Adr).call())
print('\n')
time.sleep(2)
#**************************TRADE TEST******************************
#Get ganache accounts to make and take a trade of WETH/DAI...
#def send_transaction(encodedABI, sender, desc, to, value, sendIT, PK):



#0. Approve the market to recieve funds from maker and taker
approveDaiABI = Dai_contract.encodeABI(fn_name = 'approve', args = [MM_Adr_active, web3.toWei(100, 'ether')])
approveDaiSuccess = send_transaction(approveDaiABI, taker_adr, "taker approving DAI TX", DAI_Adr, 0, True, Ganache_PRVK_TKR)
if approveDaiSuccess: print('Dai approval successful')

approveWETHABI = WETH_contract.encodeABI(fn_name = 'approve', args = [MM_Adr_active, web3.toWei(20, 'ether')])
approveWETHSuccess = send_transaction(approveWETHABI, maker_adr, "maker approving WETH TX", WETH_Adr, 0, True, Ganache_PRVK_MKR)
if approveWETHSuccess: print('WETH approval successful')
print('\n')

time.sleep(2)
#1. Maker places an offer on the exchange
makerABI = RubiconMarket_contract.encodeABI(fn_name = 'offer', args = [web3.toWei(20, 'ether'), WETH_Adr, int(web3.toWei(100, 'ether')), DAI_Adr, 0])
maker_success = send_transaction(makerABI, maker_adr, 'Maker places sell offer', MM_Adr_active, 0, True, Ganache_PRVK_MKR)
print('Maker order success:', maker_success)
print('\n')
time.sleep(10)
#2. Taker places a direct buy on that offer
best_offer_id = RubiconMarket_contract.functions.getBestOffer(WETH_Adr, DAI_Adr).call()
print('Best offer id: ', best_offer_id)
print('Offer details:', RubiconMarket_contract.functions.getOffer(best_offer_id).call())

takerABI = RubiconMarket_contract.encodeABI(fn_name = 'buy', args = [best_offer_id, web3.toWei(19.98, 'ether')])
taker_success = send_transaction(takerABI, taker_adr, 'Taker buys the makers offer',
                        MM_Adr_active, 0, True, Ganache_PRVK_TKR)
if taker_success: print('Taker successfully bought the makers order')

time.sleep(10)
#3. Check the balances of maker and taker after the trade
print('\n')
print('*****Balances of participants post-trade*****')
print('DAI balance of Maker', web3.fromWei(Dai_contract.functions.balanceOf(maker_adr).call(), 'ether'))
print('DAI balance of Taker', web3.fromWei(Dai_contract.functions.balanceOf(taker_adr).call(), 'ether'))
print('WETH balance of Maker', web3.fromWei(WETH_contract.functions.balanceOf(maker_adr).call(), 'ether'))
print('WETH balance of Taker', web3.fromWei(WETH_contract.functions.balanceOf(taker_adr).call(), 'ether'))




#4. Read logs of the transaction
