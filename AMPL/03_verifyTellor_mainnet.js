
/**************************Verify Tellor's AMPL price ********************************************/

//                Ensure there are no disputes on AMPL                               //

/******************************************************************************************/
//node 03_verifyTellor_mainnet.js

require('dotenv').config()
const ethers = require('ethers');
const fetch = require('node-fetch-polyfill')
const path = require("path")
const loadJsonFile = require('load-json-file')

const pubAddr = process.env.ETH_PUB
const privKey = process.env.ETH_PK
const infuraKey = process.env.INFURA_TOKEN

var _UTCtime  = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
var gas_limit= 400000

const network = "mainnet";
const etherscanUrl = "https://etherscan.io"
var AMPLInterAddress = "????????"
var tellorMasterAddress = '0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5'

console.log(_UTCtime)
console.log("Tellor Address: ", tellorMasterAddress)
console.log('<https://www.etherchain.org/api/gasPriceOracle>')
console.log("AMPL Intermediate address: ", AMPLInterAddress)


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
    const gasPriceNow = await jsonData.fast*1;
    const gasPriceNow2 = await (gasPriceNow)*1000000000;
    console.log(jsonData);
    return(gasPriceNow2);
  } catch(e){
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
        var wallet = new ethers.Wallet(privKey, provider);
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
    
    if (gasP != 0 && txestimate < balNow ) {
        try{
            
            let abiAmpl = await loadJsonFile(path.join("abi", "abiAmplIntermediate.json"))
            let amplInter = new ethers.Contract(AMPLInterAddress, abiAmpl, provider);
            var amplIntertWithSigner = amplInter.connect(wallet)
            console.log("await instating AMPL intermediate contract")
        } catch(error) {
            console.error(error)
            console.log("AMPL intermediate contract not instantiated")
            process.exit(1)
        }

            console.log("Verify Tellor's AMPL price")
            try{
                let tx = await amplIntertWithSigner.verifyTellorReports({ from: pubAddr, gasLimit: gas_limit, gasPrice: gasP })
                var link = "".concat(etherscanUrl, '/tx/', tx.hash)
                var ownerlink = "".concat(etherscanUrl, '/address/', pubAddr)
                    console.log('Yes, a request was sent for the APML price')
                    console.log("Hash link: ", link)
                    console.log("Sender address: ", ownerlink)
                
            } catch(error) {
                console.error(error)
                process.exit(1)
            }
            console.log("AMPL has not been disputed")
            

    }
    process.exit()

}

run()


