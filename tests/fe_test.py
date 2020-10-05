from web3 import Web3
import json
import time
from hexbytes import HexBytes
from eth_abi import decode_abi
#Constants
INFURA_URL_KOVAN = 'https://kovan.infura.io/v3/1ed6cd5bcf5c4837b318dd08d981ba6d' #HTTPProvider
GANACHE_CLI = 'http://127.0.0.1:8545'
# GANACHE_APP = 'http://127.0.0.1:7545'

#Web3 Connection
web3 = Web3(Web3.HTTPProvider(GANACHE_CLI))
print('Connected:', web3.isConnected())

#Initialize Contract function
def load_contract(name, address):
    if name == "WAYNE" or name == "STARK": name = "EquityToken"
    with open("../build/contracts/" + name+ ".json") as a:
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
with open('../frontend/packages/dapple/config.json') as f:
  data = json.load(f)

MatchingMarket_Adr = data["market"]["ganache"]["address"]
WETH_Adr = data["tokens"]["ganache"]["W-ETH"]
DAI_Adr = data["tokens"]["ganache"]["DAI"]
WAYNE_Adr = data["tokens"]["ganache"]["WAYNE"]
STARK_Adr = data["tokens"]["ganache"]["STARK"]


A0_Adr = web3.eth.accounts[0]
A0_PVK = '0x3d457ab8a7fe7e32eaca3b838296ca1f38f1407a440cf3088c0b213f84b4af64'
A1_Adr = web3.eth.accounts[1]
A1_PVK = '0x6e84be99c1e1e7da85fabbe56cea47382da68e33ecfb18691bf2df34bda14758'
A2_Adr = web3.eth.accounts[2]
A2_PVK = '0x819626d31cabd0f8ef1a9fce60c92dc64f66b1d62f2444703bdb5ee43f21ef68'
A3_Adr = web3.eth.accounts[3]
A3_PVK = '0xa6d559239c9d3b947ee5711bd7d839ca82743e27566d6ae91a233eac39ab87be'
A4_Adr = web3.eth.accounts[4]
A4_PVK = '0x0d06db7e2be7aa9ee9f5251dcb91f34203155fd09833806468a1f9d1b8272574'
A5_Adr = web3.eth.accounts[5]
A5_PVK = '0x2ef19658320c5a19c639ba6b02ee19db84f9b0aea454003aff88c662bbdd42ef'
A6_Adr = web3.eth.accounts[6]
A6_PVK = '0xfc896bcef4bd0dff3153a7d0d1d7db77bcd625eb97d0e7d83412b7d9af7bcebc'
A7_Adr = web3.eth.accounts[7]
A7_PVK = '0x89f64b6d9c607daee2d3ed9a1c27bf0d59095d2e9b69205cc028d84f1f9afad6'
A8_Adr = web3.eth.accounts[8]
A8_PVK = '0x27604a6a92e885ccb94478a2551d2e64aa4de8263488ddb32b74725314779216'
A9_Adr = web3.eth.accounts[9]
A9_PVK = '0x80757ed7579cc732422047de25ac27597c15e75c2ec2cd9f8c6dc1f64eb9fd18'

accounts = [[A0_Adr, A0_PVK],[A1_Adr, A1_PVK],[A2_Adr, A2_PVK],[A3_Adr, A3_PVK], [A4_Adr, A4_PVK],[A5_Adr, A5_PVK],
        [A6_Adr, A6_PVK], [A7_Adr, A7_PVK], [A8_Adr, A8_PVK], [A9_Adr, A9_PVK],]

MatchingMarket_C = load_contract('MatchingMarket', MatchingMarket_Adr)
WETH_C = load_contract('WETH9', WETH_Adr)
DAI_C = load_contract("DAI", DAI_Adr)
WAYNE_C = load_contract("WAYNE", WAYNE_Adr)
STARK_C = load_contract("STARK", STARK_Adr)


#Mint DAI to ACCT 0
# mint = send_transaction(
#     DAI_C.encodeABI(fn_name = 'mint', args = [A0_Adr, int(web3.toWei(100, 'ether'))]),
#     A0_Adr,
#     "mint dai to A0",
#     DAI_Adr,
#     0,
#     True,
#     A0_PVK
# )
#
# #Acquire WETH for ACCT 1
# wethA = send_transaction(
#     WETH_C.encodeABI(fn_name = 'deposit'),
#     A1_Adr,
#     "20 ether to WETH A1",
#     WETH_Adr,
#     11,
#     True,
#     A1_PVK
# )
# time.sleep(2)
#Generate some offers to populate the frontend and wait
# print('\nBoth accounts approve their largest bid and ask:')
# approveDaiABI = DAI_C.encodeABI(fn_name = 'approve', args = [MatchingMarket_Adr, web3.toWei(110, 'ether')])
# approveDaiSuccess = send_transaction(approveDaiABI, A0_Adr, "taker approving DAI TX", DAI_Adr, 0, True, A0_PVK)
#
# approveWETHABI = WETH_C.encodeABI(fn_name = 'approve', args = [MatchingMarket_Adr, web3.toWei(1, 'ether')])
# approveWETHSuccess = send_transaction(approveWETHABI, A1_Adr, "maker approving WETH TX", WETH_Adr, 0, True, A1_PVK)

# print('\nA1 makes some bids:')
# bid_1 = send_transaction(
#     MatchingMarket_C.encodeABI(fn_name = 'offer', args = [web3.toWei(1, 'ether'), WETH_Adr, int(web3.toWei(100, 'ether')), DAI_Adr, 0]),
#     A1_Adr,
#     "Maker order for 1 WETH / 100 DAI",
#     MatchingMarket_Adr,
#     0,
#     True,
#     A1_PVK
# )
# bid_2 = send_transaction(
#     MatchingMarket_C.encodeABI(fn_name = 'offer', args = [web3.toWei(1, 'ether'), WETH_Adr, int(web3.toWei(100, 'ether')), DAI_Adr, 0]),
#     A1_Adr,
#     "Maker order for 1 WETH / 100 DAI",
#     MatchingMarket_Adr,
#     0,
#     True,
#     A1_PVK
# )

#****************WETH DAI POPULATE ORDER BOOK LOGIC ***********************************
print('\n Making a large number of Maker WETH orders')
count = 0
for x, account in enumerate(accounts):
    if count == 5: break
    print('Aquiring WETH for ', account[0])
    wethA = send_transaction(
        WETH_C.encodeABI(fn_name = 'deposit'),
        account[0],
        "20 ether to WETH A1",
        WETH_Adr,
        11,
        True,
        account[1]
    )
    print('Approving exhange WETH for ', account[0])
    approveWETHABI = WETH_C.encodeABI(fn_name = 'approve', args = [MatchingMarket_Adr, web3.toWei(1, 'ether')])
    approveWETHSuccess = send_transaction(approveWETHABI, account[0], "maker approving WETH TX", WETH_Adr, 0, True, account[1])
    time.sleep(1)
    print('Sending offer for', account[0])
    send_transaction(
        MatchingMarket_C.encodeABI(fn_name = 'offer', args = [web3.toWei(1, 'ether'), WETH_Adr, int(web3.toWei(100 + x, 'ether')), DAI_Adr, 0]),
        account[0],
        "Maker order for 1 WETH / " + str(100+x)+" DAI",
        MatchingMarket_Adr,
        0,
        True,
        account[1]
    )
    count+=1
    time.sleep(1)

print('\n Making a large number of Taker DAI orders')
for x, account in enumerate(accounts):
    if x <= 5: continue
    print('Aquiring DAI for ', account[0])
    mint = send_transaction(
        DAI_C.encodeABI(fn_name = 'mint', args = [account[0], int(web3.toWei(100, 'ether'))]),
        A0_Adr,
        "mint dai to "+ account[0],
        DAI_Adr,
        0,
        True,
        A0_PVK
    )
    time.sleep(1)
    print('Approving exhange DAI for ', account[0])
    approveDaiABI = DAI_C.encodeABI(fn_name = 'approve', args = [MatchingMarket_Adr, web3.toWei(100, 'ether')])
    approveDaiSuccess = send_transaction(approveDaiABI, account[0], "taker approving DAI TX", DAI_Adr, 0, True, account[1])
    time.sleep(1)
    send_transaction(
        # MatchingMarket_C.encodeABI(fn_name = 'offer', args = [web3.toWei(1 + (float(x)/10), 'ether'), WETH_Adr, int(web3.toWei(100, 'ether')), DAI_Adr, 0]),
        MatchingMarket_C.encodeABI(fn_name = 'offer', args = [int(web3.toWei(100, 'ether')), DAI_Adr, web3.toWei(1 + (float(x)/10), 'ether'), WETH_Adr,  0]),
        account[0],
        "Taker order for" + str(1 + (float(x)/10))+ " WETH / 100 DAI",
        MatchingMarket_Adr,
        0,
        True,
        account[1]
    )
    time.sleep(1)
#****************WETH DAI POPULATE ORDER BOOK LOGIC ***********************************


#*****************WETH DAI PURCHASE ORDER BOOK ORDERS LOGIC************************
print("\nAccept some trades by buying WETH with DAI:")

for x in range(4):
    best_offer_id = MatchingMarket_C.functions.getBestOffer(WETH_Adr, DAI_Adr).call()
    # print('Best offer id: ', best_offer_id)
    offer_details = MatchingMarket_C.functions.getOffer(best_offer_id).call() #this is WETH then DAI
    print('Offer details:', offer_details)
    print('Aquiring DAI for ', A1_Adr)
    mint = send_transaction(
        DAI_C.encodeABI(fn_name = 'mint', args = [A1_Adr, offer_details[2]]),
        A0_Adr,
        "mint dai ",
        DAI_Adr,
        0,
        True,
        A0_PVK
    )
    print('Approving exhange DAI for ', A1_Adr)
    approveDaiABI = DAI_C.encodeABI(fn_name = 'approve', args = [MatchingMarket_Adr, offer_details[2]])
    approveDaiSuccess = send_transaction(approveDaiABI, A1_Adr, "taker approving DAI TX", DAI_Adr, 0, True, A1_PVK)

    takerABI = MatchingMarket_C.encodeABI(fn_name = 'buy', args = [best_offer_id, offer_details[0]])
    taker_success = send_transaction(takerABI, A1_Adr, 'Taker buys the makers offer',
                            MatchingMarket_Adr, 0, True, A1_PVK)
    time.sleep(1)
                        # if taker_success: print('Taker successfully bought the makers order')
#*****************WETH DAI PURCHASE ORDER BOOK ORDERS LOGIC************************


#***************WAYNE DAI POPULATE ORDER BOOK LOGIC ***********************************
print('\n Making a large number of Maker WAYNE orders')
print('balance of Admin', WAYNE_C.functions.balanceOf(A0_Adr).call())

count = 0
for x, account in enumerate(accounts):
    if count == 5: break
    if account[0] ==A0_Adr: continue
    print('Aquiring WAYNE for ', account[0])
    wayneT = send_transaction(
        WAYNE_C.encodeABI(fn_name = 'transfer', args=[str(account[0]), web3.toWei(100, "ether")]),
        A0_Adr,
        "transfer 100 WAYNE to " + str(account[0]),
        WAYNE_Adr,
        0,
        True,
        A0_PVK
    )
    time.sleep(4)
    print('balance of', account[0])
    print(WAYNE_C.functions.balanceOf(account[0]).call())
    approveWAYNEABI = WAYNE_C.encodeABI(fn_name = 'approve', args = [MatchingMarket_Adr, web3.toWei(100, "ether")])
    approveWAYNESuccess = send_transaction(approveWAYNEABI, account[0], "maker approving WAYNE TX", WAYNE_Adr, 0, True, account[1])
    time.sleep(1)
    print('Sending offer for', account[0])
    send_transaction(
        MatchingMarket_C.encodeABI(fn_name = 'offer', args = [web3.toWei(100, "ether"), WAYNE_Adr, int(web3.toWei(220 + x, 'ether')), DAI_Adr, 0]),
        account[0],
        "Maker order for 100 WAYNE / " + str(220+x)+" DAI",
        MatchingMarket_Adr,
        0,
        True,
        account[1]
    )
    count+=1
    time.sleep(1)

print('\n Making a large number of Taker DAI orders')
for x, account in enumerate(accounts):
    if x <= 5: continue
    print('Aquiring DAI for ', account[0])
    mint = send_transaction(
        DAI_C.encodeABI(fn_name = 'mint', args = [account[0], int(web3.toWei(220, 'ether'))]),
        A0_Adr,
        "mint dai to "+ account[0],
        DAI_Adr,
        0,
        True,
        A0_PVK
    )
    time.sleep(1)
    print('Approving exhange DAI for ', account[0])
    approveDaiABI = DAI_C.encodeABI(fn_name = 'approve', args = [MatchingMarket_Adr, web3.toWei(220, 'ether')])
    approveDaiSuccess = send_transaction(approveDaiABI, account[0], "taker approving DAI TX", DAI_Adr, 0, True, account[1])
    time.sleep(1)
    send_transaction(
        # MatchingMarket_C.encodeABI(fn_name = 'offer', args = [web3.toWei(1 + (float(x)/10), 'ether'), WETH_Adr, int(web3.toWei(100, 'ether')), DAI_Adr, 0]),
        MatchingMarket_C.encodeABI(fn_name = 'offer', args = [int(web3.toWei(220, 'ether')), DAI_Adr, web3.toWei(100+x, "ether"), WAYNE_Adr,  0]),
        account[0],
        "Taker order for" + str(100 + x)+ " WAYNE / 220 DAI",
        MatchingMarket_Adr,
        0,
        True,
        account[1]
    )
    time.sleep(1)
#****************WAYNE DAI POPULATE ORDER BOOK LOGIC ***********************************


#*****************WAYNE DAI PURCHASE ORDER BOOK ORDERS LOGIC************************
print("\nAccept some trades by buying WAYNE with DAI:")

for x in range(4):
    best_offer_id = MatchingMarket_C.functions.getBestOffer(WAYNE_Adr, DAI_Adr).call()
    # print('Best offer id: ', best_offer_id)
    offer_details = MatchingMarket_C.functions.getOffer(best_offer_id).call() #this is WETH then DAI
    print('Offer details:', offer_details)
    print('Aquiring DAI for ', A1_Adr)
    mint = send_transaction(
        DAI_C.encodeABI(fn_name = 'mint', args = [A1_Adr, offer_details[2]]),
        A0_Adr,
        "mint dai ",
        DAI_Adr,
        0,
        True,
        A0_PVK
    )
    print('Approving exhange DAI for ', A1_Adr)
    approveDaiABI = DAI_C.encodeABI(fn_name = 'approve', args = [MatchingMarket_Adr, offer_details[2]])
    approveDaiSuccess = send_transaction(approveDaiABI, A1_Adr, "taker approving DAI TX", DAI_Adr, 0, True, A1_PVK)

    takerABI = MatchingMarket_C.encodeABI(fn_name = 'buy', args = [best_offer_id, offer_details[0]])
    taker_success = send_transaction(takerABI, A1_Adr, 'Taker buys the makers offer',
                            MatchingMarket_Adr, 0, True, A1_PVK)
    time.sleep(1)
                        # if taker_success: print('Taker successfully bought the makers order')
#*****************WAYNE DAI PURCHASE ORDER BOOK ORDERS LOGIC************************

#***************STARK DAI POPULATE ORDER BOOK LOGIC ***********************************
print('\n Making a large number of Maker STARK orders')
print('balance of Admin', STARK_C.functions.balanceOf(A0_Adr).call())

count = 0
for x, account in enumerate(accounts):
    if count == 5: break
    if account[0] ==A0_Adr: continue
    print('Aquiring STARK for ', account[0])
    STARKT = send_transaction(
        STARK_C.encodeABI(fn_name = 'transfer', args=[str(account[0]), web3.toWei(100, "ether")]),
        A0_Adr,
        "transfer 100 STARK to " + str(account[0]),
        STARK_Adr,
        0,
        True,
        A0_PVK
    )
    time.sleep(4)
    print('balance of', account[0])
    print(STARK_C.functions.balanceOf(account[0]).call())
    approveSTARKABI = STARK_C.encodeABI(fn_name = 'approve', args = [MatchingMarket_Adr, web3.toWei(100, "ether")])
    approveSTARKSuccess = send_transaction(approveSTARKABI, account[0], "maker approving STARK TX", STARK_Adr, 0, True, account[1])
    time.sleep(1)
    print('Sending offer for', account[0])
    send_transaction(
        MatchingMarket_C.encodeABI(fn_name = 'offer', args = [web3.toWei(100, "ether"), STARK_Adr, int(web3.toWei(350 + x, 'ether')), DAI_Adr, 0]),
        account[0],
        "Maker order for 100 STARK / " + str(350+x)+" DAI",
        MatchingMarket_Adr,
        0,
        True,
        account[1]
    )
    count+=1
    time.sleep(1)

print('\n Making a large number of Taker DAI orders')
for x, account in enumerate(accounts):
    if x <= 5: continue
    print('Aquiring DAI for ', account[0])
    mint = send_transaction(
        DAI_C.encodeABI(fn_name = 'mint', args = [account[0], int(web3.toWei(350, 'ether'))]),
        A0_Adr,
        "mint dai to "+ account[0],
        DAI_Adr,
        0,
        True,
        A0_PVK
    )
    time.sleep(1)
    print('Approving exhange DAI for ', account[0])
    approveDaiABI = DAI_C.encodeABI(fn_name = 'approve', args = [MatchingMarket_Adr, web3.toWei(350, 'ether')])
    approveDaiSuccess = send_transaction(approveDaiABI, account[0], "taker approving DAI TX", DAI_Adr, 0, True, account[1])
    time.sleep(1)
    send_transaction(
        # MatchingMarket_C.encodeABI(fn_name = 'offer', args = [web3.toWei(1 + (float(x)/10), 'ether'), WETH_Adr, int(web3.toWei(100, 'ether')), DAI_Adr, 0]),
        MatchingMarket_C.encodeABI(fn_name = 'offer', args = [int(web3.toWei(350, 'ether')), DAI_Adr, web3.toWei(100+x, "ether"), STARK_Adr,  0]),
        account[0],
        "Taker order for" + str(100 + x)+ " STARK / 350 DAI",
        MatchingMarket_Adr,
        0,
        True,
        account[1]
    )
    time.sleep(1)
#****************STARK DAI POPULATE ORDER BOOK LOGIC ***********************************


#*****************STARK DAI PURCHASE ORDER BOOK ORDERS LOGIC************************
print("\nAccept some trades by buying STARK with DAI:")

for x in range(4):
    best_offer_id = MatchingMarket_C.functions.getBestOffer(STARK_Adr, DAI_Adr).call()
    # print('Best offer id: ', best_offer_id)
    offer_details = MatchingMarket_C.functions.getOffer(best_offer_id).call() #this is WETH then DAI
    print('Offer details:', offer_details)
    print('Aquiring DAI for ', A1_Adr)
    mint = send_transaction(
        DAI_C.encodeABI(fn_name = 'mint', args = [A1_Adr, offer_details[2]]),
        A0_Adr,
        "mint dai ",
        DAI_Adr,
        0,
        True,
        A0_PVK
    )
    print('Approving exhange DAI for ', A1_Adr)
    approveDaiABI = DAI_C.encodeABI(fn_name = 'approve', args = [MatchingMarket_Adr, offer_details[2]])
    approveDaiSuccess = send_transaction(approveDaiABI, A1_Adr, "taker approving DAI TX", DAI_Adr, 0, True, A1_PVK)

    takerABI = MatchingMarket_C.encodeABI(fn_name = 'buy', args = [best_offer_id, offer_details[0]])
    taker_success = send_transaction(takerABI, A1_Adr, 'Taker buys the makers offer',
                            MatchingMarket_Adr, 0, True, A1_PVK)
    time.sleep(1)
                        # if taker_success: print('Taker successfully bought the makers order')
#*****************STARK DAI PURCHASE ORDER BOOK ORDERS LOGIC************************
