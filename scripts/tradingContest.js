require("dotenv").config();
const Web3 = require('web3');

let web3 = new Web3("https://optimism-kovan.infura.io/v3/c7c4543c849a4d8d96b0fedeb8bb273c");

var { abi } = require("../build/contracts/DaiWithFaucet.json");
var DAIKovanAddr = process.env.OP_KOVAN_USDC;
var USDCContractKovan = new web3.eth.Contract(abi, DAIKovanAddr);

// Load the RubiconMarket contract
var { abi } = require("../build/contracts/RubiconMarket.json");
var rubiconMarketKovanAddr = process.env.OP_KOVAN_MARKET;
var RubiconMarketContractKovan = new web3.eth.Contract(abi, rubiconMarketKovanAddr);

// Load in WAYNE Contract
var { abi } = require("../build/contracts/EquityToken.json");
var WAYNEKovanAddr = process.env.OP_KOVAN_WAYNE;
var WAYNEContractKovan = new web3.eth.Contract(abi, WAYNEKovanAddr);

// Load in GME Contract
var { abi } = require("../build/contracts/EquityToken.json");
var GMEKovanAddr = process.env.OP_KOVAN_GME;
var GMEContractKovan = new web3.eth.Contract(abi, GMEKovanAddr);

// Inputs

// Asset Contracts, load and store in an array
var tokens = [WAYNEContractKovan, GMEContractKovan];

// Participants
const participants = [process.env.OP_KOVAN_ADMIN, "0xF7EEea13cd2A0231C2A95a7f21FB47dBBe2FC60a", "0x75E7aBED3406df8f2fD4E036Cbb5f6830bce525d"];


async function trackPerformance() {
    if (await web3.version < 1) {
        throw("web3 error");
    }

    var resultsUnsorted = [];

    // Loop through participants and build unsorted results array
    for (let index = 0; index < participants.length; index++) {
        const participant = participants[index];
        let val = 0.0;
        // Loop through existing tokens and get market value of portfolio
        for (let x = 0; x < tokens.length; x++) {
            // get balance
            await tokens[x].methods.balanceOf(participant).call().then(async (r) =>{
                const tokenBalance = web3.utils.fromWei(r);

                // Mark-to-market
                await RubiconMarketContractKovan.methods.getBestOffer(tokens[x]._address, process.env.OP_KOVAN_USDC).call().then(async (r) => {
                    await RubiconMarketContractKovan.methods.getOffer(r).call().then((r) => {
                        const price = r[2] / r[0];
                        const newVal = (price * tokenBalance);
                        val += newVal;
                    });
                });
            });
        }
        // Add their stablecoin balance
        await USDCContractKovan.methods.balanceOf(participant).call().then(async (r) =>{
            const balance = web3.utils.fromWei(r);
            val += parseFloat(balance);
        });

        resultsUnsorted.push([participant, val]);

    }

    const results = resultsUnsorted.sort((a,b) => {
        return b[2] - a[2];  
    });

    console.log('**** Contest Results by Address ****');
    console.log(results);
}

trackPerformance();