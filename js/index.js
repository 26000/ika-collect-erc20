window.addEventListener("load", function() {
  var Web3 = require("web3");
  var web3 = new Web3("https://rinkeby.infura.io/v3/84e0a3375afd4f57b4753d39188311d7");

  var plus = document.getElementById("add");
  var setAll = document.getElementById("setall");
  var form = document.getElementById("config");

  form.onsubmit = () => {
    sendEth(web3);

    return false;
  };

  //document.getElementById("send").addEventListener("click", () => {
    //sendEth(web3);
  //});

  plus.addEventListener("click", () => {
    var row = document.createElement("div");
    row.className = "wallet cards row";
    row.innerHTML = `
      <div class="col-md-6">
      <input type="text" class="card address" placeholder="ETH address (0x012345...)" name="address" required />
      </div>

      <div class="col-md-2">
      <input type="number" class="card amount" placeholder="amount (eth)" name="amount" step="0.00000001" min="0" required />
      </div>

      <div class="col-md-2">
      <input type="number" class="card fee" placeholder="fee (gwei)" name="fee" step="1" min="0" />
      </div>

      <div class="col-md-2 middle">
      <span class="middle">
      ⚙️
      </span>
      </div>
      `;

    document.getElementById("config").insertBefore(row, plus.parentElement.parentElement);

    return false;
  });

  setAll.addEventListener("click", () => {
    var amount = document.getElementById("setall-amount").value;
    var fee = document.getElementById("setall-fee").value;

    var amounts = document.getElementsByClassName("amount");
    var fees = document.getElementsByClassName("fee");

    for (var i = 0; i < amounts.length; i++) {
      amounts[i].value = amount;
      fees[i].value = fee;
    }

    return false;
  });
});

function sendEth(web3) {
  getInputData().then((dataAndOrder) => {
    var data = dataAndOrder[0];
    var order = dataAndOrder[1];

    if (data.privkey.startsWith("0x")) {
      data.privkey = data.privkey.slice(2);
    }
    console.log(order);

    var BN = web3.utils.BN;
    var Tx = require('ethereumjs-tx');
    var privateKey = new Buffer(data.privkey, 'hex');

    setWaiting();

    web3.eth.getTransactionCount(web3.eth.accounts.privateKeyToAccount(`0x${data.privkey}`).address).then(count => {
      data.transactions.forEach((txn, i, a) => {
        if (web3.utils.isAddress(txn.address)) {
          var tx = new Tx();
          tx.gasPrice = new BN(web3.utils.toWei(txn.fee, "shannon"));
          tx.gasLimit = 21000;
          tx.value = new BN(web3.utils.toWei(txn.amount, "ether"));
          tx.to = txn.address;
          tx.nonce = count++;
          tx.sign(privateKey);

          var serializedTx = tx.serialize();

          web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
            .on('receipt', (r) => {
              showReceipt(r, order);
            }).on("error", (e) => {
              showError(e, order[txn.address]);
              console.log(e);
            });
        } else {
          document.querySelectorAll("span.middle")[order[txn.address]].innerText = "❌";
          console.log(`${txn.address} is not a valid Ethereum address!!!!`);
        }
      });
    });
  });
}

function showError(e, order) {
  alert(e);
}

function showReceipt(r, order) {
  document.getElementsByClassName("wallet")[order[r.to]].lastElementChild.lastElementChild.innerText = "✅";
}

function setWaiting() {
  document.querySelectorAll("span.middle").forEach(el => {
    el.innerText = "🕟";
  });
}

function getInputData() {
  return new Promise(resolve => {
    var data = new FormData(document.getElementById("config"));
    var parsed = {transactions: []};
    var order = {};
    var txn = {};

    var i = 0;
    for (var pair of data) {
      if (pair[1] == "") {
        continue;
      }

      if (["address", "amount", "fee"].includes(pair[0])) {
        if (pair[0] == "address" && Object.keys(txn).length != 0) {
          parsed.transactions.push(txn);

          order[txn.address] = i++;
          txn = {};
        }

        txn[pair[0]] = pair[1];
      } else {
        parsed[pair[0]] = pair[1];
      }
    }

    parsed.transactions.push(txn);
    order[txn.address] = i++;

    resolve([parsed, order]);
  });
}
