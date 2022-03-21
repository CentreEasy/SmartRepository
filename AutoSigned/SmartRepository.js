const Web3=require('web3');
const config = require('../config/config.js')

let web3 =null;

exports.init = function(url) {
    web3 = new Web3(new Web3.providers.HttpProvider(url));
};

exports.getBN = function() {
    return web3.utils.BN;
};
exports.createWallet = function() {
    return web3.eth.accounts.create();
};
exports.getWallet = function(pk) {
    return web3.eth.accounts.privateKeyToAccount(pk);
};

exports.call= async function (contractData,functionName,args,from){

    let contract = new web3.eth.Contract(
        contractData.abi,
        contractData.address
    )
    return await contract.methods[functionName].apply(null, args).call({from:from.address});
    };
    exports.transaction = async function(contractData,functionName,args,from){
    let contract = new web3.eth.Contract(
        contractData.abi,
        contractData.address
    )
    let transaction= await contract.methods[functionName].apply(null, args);
    const gas = await transaction.estimateGas({from: from.address});

    let options = {
      to  : transaction._parent._address,
      data: transaction.encodeABI(),
      gas : gas
    };
    const signedTransaction = await web3.eth.accounts.signTransaction(options, from.privateKey);
    return web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
};

exports.deploy = async function (contractData,args,from){
    let contract = new web3.eth.Contract(contractData.abi)
    const transaction = contract.deploy({data: contractData.bytecode, arguments: args})
    const gas = await transaction.estimateGas({from: from.address});
    let options = {
        to  : transaction._parent._address,
        data: transaction.encodeABI(),
        gas : gas
    };
    const signedTransaction = await web3.eth.accounts.signTransaction(options, from.privateKey);
    contract = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    return contract.contractAddress;
};
exports.sendETH = async function (ethSend,to,from) {
    try {
        const ethBalance = web3.utils.fromWei(await web3.eth.getBalance(from.address), 'ether');
            let eth = Number(ethBalance);
            if (eth < ethSend) {
            return false;
        }
        ethSend = web3.utils.toHex(web3.utils.toWei(ethSend.toString(), "ether"));
        const signed = await web3.eth.accounts.signTransaction({
        to: to,
        from: from.address,
        value: ethSend,
        gasPrice: web3.utils.toWei('40', 'gwei'),
        gas: Math.round(await web3.eth.estimateGas({ to: to }) * 2),
        nonce: await web3.eth.getTransactionCount(from.address, 'pending')
        }, from.privateKey);
        const sentTx =await web3.eth.sendSignedTransaction(signed.rawTransaction);
        return true;
    }
    catch (e) {
      return false;
    }
};
