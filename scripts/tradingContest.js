require("dotenv").config();
const Web3 = require("web3");

let web3 = new Web3(
  "https://optimism-kovan.infura.io/v3/" + process.env.INFURA_API_KEY
);

var { abi } = require("../build/contracts/USDCWithFaucet.json");
var DAIKovanAddr = process.env.OP_KOVAN_3_USDC;
var USDCContractKovan = new web3.eth.Contract(abi, DAIKovanAddr);

// Load the RubiconMarket contract
var { abi } = require("../build/contracts/RubiconMarket.json");
var rubiconMarketKovanAddr = process.env.OP_KOVAN_3_MARKET;
var RubiconMarketContractKovan = new web3.eth.Contract(
  abi,
  rubiconMarketKovanAddr
);

var { abi } = require("../build/contracts/EquityToken.json");
const WBTC = new web3.eth.Contract(abi, process.env["OP_KOVAN_3_WBTC"]);
const MKR = new web3.eth.Contract(abi, process.env["OP_KOVAN_3_MKR"]);
const REP = new web3.eth.Contract(abi, process.env["OP_KOVAN_3_REP"]);
const RGT = new web3.eth.Contract(abi, process.env["OP_KOVAN_3_RGT"]);
const SNX = new web3.eth.Contract(abi, process.env["OP_KOVAN_3_SNX"]);
const AAVE = new web3.eth.Contract(abi, process.env["OP_KOVAN_3_AAVE"]);
const COMP = new web3.eth.Contract(abi, process.env["OP_KOVAN_3_COMP"]);
const OHM = new web3.eth.Contract(abi, process.env["OP_KOVAN_3_OHM"]);

const tokens = [
  [WBTC, 40290.0],
  [MKR, 343.0],
  [REP, 5.3],
  [RGT, 3],
  [SNX, 50],
  [AAVE, 51.54],
  [OHM, 435.51],
  [COMP, 259.7],
];

const zeroResult = {
  0: "0",
  1: "0x0000000000000000000000000000000000000000",
  2: "0",
  3: "0x0000000000000000000000000000000000000000",
};

// Asset Contracts, load and store in an array

// Participants
const participants = [
  "0x08Cf7A84Fe8Bba7c348FbE4D565C7Cd65ECF6fe7",
  "0xA74bBDFd65CE13E4D36Aab724F798a211FA1Cea5",
  "0x7A7fF2961252a8F571f5aFa2F1C808f6961f0E7e",
  "0xFbe300Db166B41e554a9d7820fd7183977deE24e",
  "0xAf4b7B45A36F483C4672bC06cE2eB9c68C660e5A",
  "0xBfcb8b7EC2afb177309494E00bc9F34C0571a81e",
  "0x358c43e316b3D7B31fa2546675f684D09cDAB89f",
  "0x358c43e316b3D7B31fa2546675f684D09cDAB89f",
  "0x583dE915CFC397310eE3C3d7f76f761Be644A121",
  "0x3F13eb8B57C6C56C54DC14eAfC9dC38205b6b4bB",
  "0x03925FeeC7FF0082670C14A50792a0DC253493b5",
  "0x707726ebdCfd2a715331DD8d5F195DaB6494E89D",
  "0x6EeD8B536791C56C218F4aa923d81B4b7220a08b",
  "0x25812D027Fe6A925d747E289af736FD2c4C6ca0f",
  "0x1488599681B69cf168457A133136D69967Fbf744",
  "0xD94FA7CAa50FeEc78AcEDdDB3a2ee242dF7900d8",
  "0xE5406c9c2ca1Afd903D76F518328d135aF3A0Ac2",
  "0x7417E3bCdE8726908895152A8F3925a756b1894D",
  "0x769A8Df8C20923963e90671524De38dDADDa0De3",
  "0x9c97C7A5879F0069e1EDcBFB5C00ADD6Acd08019",
  "0x9eC6757e6870b36D7fb78217a17397102CF40c6C",
  "0x91186E77010bE57A10f6F983e2dffaFC9B9081b9",
  "0x9C3389D5c30b429abc2bA4e32C402300A067A6fC",
  "0xe0D62CC9233C7E2F1f23fE8C77D6b4D1a265D7Cd",
  "0x7417E3bCdE8726908895152A8F3925a756b1894D",
  "0x7417E3bCdE8726908895152A8F3925a756b1894D",
  "0x6DE81B345D32f92b8F0e5C51c118df6f189eB6F6",
  "0x88F371700a6a39D273045C4118D075E67b15Cd1f",
  "0x9137E9CC808CB3400A9421DaF328413762a85de9",
  "0x422317eDDb77Cef980c14e7e4b2058900Bc8B618",
  "0x76EF4B28df1F590db4cD680675d734c27CAa32BA",
  "0x46B7469b3C97dEEE139125BFd18525b470E613f9",
  "0x305A012916054C51407D3cd1e7C7321495078E4d",
];

async function trackPerformance() {
  if ((await web3.version) < 1) {
    throw "web3 error";
  }

  var resultsUnsorted = [];

  // Loop through participants and build unsorted results array
  for (let index = 0; index < participants.length; index++) {
    const participant = participants[index];
    let val = 0.0;
    // Loop through existing tokens and get market value of portfolio
    for (let x = 0; x < tokens.length; x++) {
      // get balance
      await tokens[x][0].methods
        .balanceOf(participant)
        .call()
        .then(async (r) => {
          const tokenBalance = web3.utils.fromWei(r);
          const newVal = tokens[x][1] * tokenBalance;
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
    await USDCContractKovan.methods
      .balanceOf(participant)
      .call()
      .then(async (r) => {
        const balance = web3.utils.fromWei(r);
        val += parseFloat(balance);
      });
    resultsUnsorted.push([participant, val]);
  }

  const results = resultsUnsorted.sort((a, b) => {
    return b[1] - a[1];
  });

  console.log("**** Contest Results by Address ****");
  console.log(await results);
}
trackPerformance();
