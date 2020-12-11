/**************************ETH tip AMPL********************************************/

//                Tip AMPL on Tellor                                  //

/******************************************************************************************/
// node 01_tip_apl_rinkeby.js

require('dotenv').config()
const ethers = require('ethers');
const fetch = require('node-fetch-polyfill')
const path = require("path")
const loadJsonFile = require('load-json-file')

const pubAddr = process.env.RINKEBY_ETH_PUB
const privKey = process.env.RINKEBY_ETH_PK
const infuraKey = process.env.INFURA_TOKEN

var _UTCtime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
var gas_limit = 400000

const network = "rinkeby";
const etherscanUrl = "https://rinkeby.etherscan.io"
const tellorMasterAddress = '0xFe41Cb708CD98C5B20423433309E55b53F79134a'

console.log(_UTCtime)
console.log("Tellor Address: ", tellorMasterAddress)
console.log('https://www.etherchain.org/api/gasPriceOracle')

function sleep_s(secs) {
    secs = (+new Date) + secs * 1000;
    while ((+new Date) < secs);
}

//https://ethgasstation.info/json/ethgasAPI.json
//https://www.etherchain.org/api/gasPriceOracle
async function fetchGasPrice() {
    const URL = `https://www.etherchain.org/api/gasPriceOracle`;
    try {
        const fetchResult = fetch(URL);
        const response = await fetchResult;
        const jsonData = await response.json();
        const gasPriceNow = await jsonData.fast * 1;
        const gasPriceNow2 = await (gasPriceNow) * 1000000000;
        return (gasPriceNow2);
    } catch (e) {
        throw Error(e);
    }
}



let run = async function () {
    try {
        var gasP = await fetchGasPrice()
        console.log("gasP1", gasP)
    } catch (error) {
        console.error(error)
        console.log("no gas price fetched")
        process.exit(1)
    }

    try {
        var provider = ethers.getDefaultProvider(network, infuraKey);
        let wallet = new ethers.Wallet(privKey, provider);
        let abi = await loadJsonFile(path.join("abi", "tellor.json"))
        let contract = new ethers.Contract(tellorMasterAddress, abi, provider);
        var contractWithSigner = contract.connect(wallet);

    } catch (error) {
        console.error(error)
        console.log("oracle not instantiated")
        process.exit(1)
    }


    try {
        var balNow = ethers.utils.formatEther(await provider.getBalance(pubAddr))
        console.log("Requests Address", pubAddr)
        console.log("Requester ETH Balance", balNow)
        var ttbalanceNow = ethers.utils.formatEther(await contractWithSigner.balanceOf(pubAddr))
        console.log('Tellor Tributes balance', ttbalanceNow)
        var txestimate = (gasP * gas_limit / 1e18);
    } catch (error) {
        console.error(error)
        process.exit(1)
    }

    if (gasP != 0 && txestimate < balNow && ttbalanceNow > 1) {
        console.log("Send request for AMPL")
        try {
            //var gasP = await fetchGasPrice()

            let tx = await contractWithSigner.addTip(10, 1, { from: pubAddr, gasLimit: gas_limit, gasPrice: gasP });
            var link = "".concat(etherscanUrl, '/tx/', tx.hash)
            var ownerlink = "".concat(etherscanUrl, '/address/', tellorMasterAddress)
            console.log('Yes, a request was sent for the APML price')
            console.log("Hash link: ", link)
            console.log("Contract link: ", ownerlink)
            console.log('Waiting for the transaction to be mined');
            await tx.wait() // If there's an out of gas error the second parameter is the receipt.
        } catch (error) {
            console.error(error)
            process.exit(1)
        }
        console.log("AMPL was tipped")
        process.exit()
    }
    console.error('Not enough balance');
    process.exit(1)
}

run()