require("dotenv").config();
const Web3 = require('web3');

let web3 = new Web3("https://optimism-kovan.infura.io/v3/" + process.env.INFURA_API_KEY);

var { abi } = require("../build/contracts/USDCWithFaucet.json");
var DAIKovanAddr = process.env.OP_KOVAN_TC_USDC;
var USDCContractKovan = new web3.eth.Contract(abi, DAIKovanAddr);

// Load the RubiconMarket contract
var { abi } = require("../build/contracts/RubiconMarket.json");
var rubiconMarketKovanAddr = process.env.OP_KOVAN_TC_MARKET;
var RubiconMarketContractKovan = new web3.eth.Contract(abi, rubiconMarketKovanAddr);

var { abi } = require("../build/contracts/EquityToken.json");
const WBTC = new web3.eth.Contract(abi, process.env["OP_KOVAN_TC_WBTC"]);
const MKR = new web3.eth.Contract(abi, process.env["OP_KOVAN_TC_MKR"]);
const REP = new web3.eth.Contract(abi, process.env["OP_KOVAN_TC_REP"]);
const RGT = new web3.eth.Contract(abi, process.env["OP_KOVAN_TC_RGT"]);
const SNX = new web3.eth.Contract(abi, process.env["OP_KOVAN_TC_SNX"]);
const tokens = [[WBTC, 15000.00],  [MKR, 411.58],  [REP, 180.17],  [RGT, 110.00],  [SNX, 27.47]];

const zeroResult = {
    '0': '0',
    '1': '0x0000000000000000000000000000000000000000',
    '2': '0',
    '3': '0x0000000000000000000000000000000000000000'
  };

// Asset Contracts, load and store in an array

// Participants
const participants = [
    "0x08Cf7A84Fe8Bba7c348FbE4D565C7Cd65ECF6fe7",
    "0x9C3389D5c30b429abc2bA4e32C402300A067A6fC",
    "0x76EF4B28df1F590db4cD680675d734c27CAa32BA",
    "0x7417E3bCdE8726908895152A8F3925a756b1894D",
    "0x2a231e4308C07cc69D5C4467fbE6a18b2Fa6Ef93",
    "0xF00eD8bE50a88b8859aff0A93c28E4bBB9808dde",
    "0xA9ABF14f9397dBE984EeF6edA7a857cE47f6A65e",
    "0xFbe300Db166B41e554a9d7820fd7183977deE24e",
    "0x3dBe953eddB69DbD611e1FCD59d4BdefA5acB439",
    "0x8BBD6dEcE4191b5d1257676697Ea7938e0C19362",
    "0x2b49f133CC7666147D96Eb749a5291042f72fcA7",
    "0x90187c75000C36aCdFe3d9fE78AFB92D07331D4C",
    "0xA4e9D4f5C380c95Ca438CED0E3Ae6F697B8c8C58",
    "0xB6F471cBCCB145c70E7E9b467b1f5dc1EDc01878",
    "0x0526788e62A4C5C505Aa6103c3BDFb585A96dd38",
    "0x20e3680b59d80F2dDD798492Db9b701e03Fd33B9",
    "0xFdE79EaD88c2aB4e34cF1A20393E247B49A3beC3",
    "0xAf4b7B45A36F483C4672bC06cE2eB9c68C660e5A",
    "0xBfcb8b7EC2afb177309494E00bc9F34C0571a81e",
    "0x358c43e316b3D7B31fa2546675f684D09cDAB89f",
    "0x583dE915CFC397310eE3C3d7f76f761Be644A121",
    "0xE5B314Fa02F366B136685Ef322a91586EF2364De",
    "0x3F13eb8B57C6C56C54DC14eAfC9dC38205b6b4bB",
    "0x03925FeeC7FF0082670C14A50792a0DC253493b5",
    "0x707726ebdCfd2a715331DD8d5F195DaB6494E89D",
    "0x6EeD8B536791C56C218F4aa923d81B4b7220a08b",
    "0x25812D027Fe6A925d747E289af736FD2c4C6ca0f",
    "0x1488599681B69cf168457A133136D69967Fbf744",
    "0xD94FA7CAa50FeEc78AcEDdDB3a2ee242dF7900d8",
    "0xE5406c9c2ca1Afd903D76F518328d135aF3A0Ac2",
    "0xE6Ef030aCC0DB829EdCF5d335651c87A19b18573",
    "0x4b78459b25C8070f5865a72806b84F721586B701",
    "0x05F5aC82820Fe10A4020b0899eA6e914398131dD",
    "0x6077aEf7eF8De1aE77e7c572c79b1dAc54F162F6",
    "0x503372eefD3DE85A507f93DDd3E5f6A891316AaC",
    "0x3aC520D923a5696d71e3C0AB3BC9aBc6ECCaA543",
    "0x3BBF618EFE0767A72B024C93867D8f96C926126B",
    "0x616Cc348B0E5CCCc5cD9E8900C151c2f6baF3612",
    "0x6483091a0E2972cfe2efEa7fbaC6fa0c97C6C0E2",
    "0xe0D62CC9233C7E2F1f23fE8C77D6b4D1a265D7Cd",
    "0x9D8b852fCD0cfe5534Ccfb19775915bd3Df453f9",
    "0x769A8Df8C20923963e90671524De38dDADDa0De3",
    "0xc98D2a4A5d0388Fe9a102F7D16A398cf5f81D8D4",
    "0xcD3671a9598D31F875e5CD7c653ec33A97027eAE",
    "0xD42921b5F2FfeD5538Ee542e85e4eCFF19B1d9d3",
    "0x7417E3bCdE8726908895152A8F3925a756b1894D",
    "0x2a231e4308C07cc69D5C4467fbE6a18b2Fa6Ef93",
    "0x683e2Ae49af295AB50d0a907077A3a612c80D592",
    "0x46B7469b3C97dEEE139125BFd18525b470E613f9",
    "0xF00eD8bE50a88b8859aff0A93c28E4bBB9808dde",
    "0x46E89cd78148F9B44d2CF74f5fbBCC2e6635709b",
    "0xb87C9dd213C51F3d246810Aa7d4b21B52dAB7FDf",
    "0xa4698F1589E603B3f9107018aEb430feD79AC02d"
];

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
            await tokens[x][0].methods.balanceOf(participant).call().then(async (r) =>{
                const tokenBalance = web3.utils.fromWei(r);
                const newVal = (tokens[x][1] * tokenBalance);
                val += newVal;
                // Mark-to-market
                // await RubiconMarketContractKovan.methods.getBestOffer(tokens[x][0]._address, process.env.OP_KOVAN_USDC).call().then(async (r) => {
                //     await RubiconMarketContractKovan.methods.getOffer(r).call().then((r) => {
                //         if ((r[2]) != 0) {
                //             const price = r[2] / r[0];
                //             const newVal = (price * tokenBalance);
                //             val += newVal;
                //             console.log(x);                      
                //         } else {
                //             // console.log(r);
                //         }  
                //     });
                // });
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
        return b[1] - a[1];  
    });

    console.log('**** Contest Results by Address ****');
    console.log(await results);
}
trackPerformance();