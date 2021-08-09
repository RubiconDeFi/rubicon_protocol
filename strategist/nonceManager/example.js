const noncemanager = require("./noncemanager.js");

var nonceFunction = () => {
  return new Promise((resolve, reject) => {
    console.log("asking web3 for current nonce..");
    setTimeout(resolve, 2000);
  });
};

noncemanager.getInstance(0, nonceFunction);
// noncemanager.getInstance(currentNonce, nonceFunctionWeb3).getTransactionPermission().then( () => {
// console.log("Next nonce", noncemanager.getInstance().getNextNonce());
// });

var printNonce = function () {
  var l = Math.floor(Math.random() * 10);
  for (var i = 0; i < l; i++) {
    noncemanager
      .getInstance()
      .getTransactionPermission()
      .then(() => {
        console.log("Next nonce", noncemanager.getInstance().getNextNonce());
      });
  }

  setTimeout(printNonce, Math.floor(Math.random() * 1000 * 45));
};

printNonce();
