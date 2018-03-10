// 2018 Console, http://github.com/u/scottie
// 

// ~# ./btcpd -daemon -testnet -gen -exportdir="~/" -walletnotify=""

//./bitcoind -walletnotify="./bitcoind getblock %s >> /tmp/blocks.txt"


//
// redvoid:redvoid123
// dbmane: wallet
// collectionName: accounts
// mongodb://<dbuser>:<dbpassword>@ds251588.mlab.com:51588/wallet
//
// DB Structure:
//              { 
//                  UniqueId: "telegram phonenumber/user",
//                  creationDate: "hh/mm/yy-hh/mm/ss",
//                  address: "x12345123123123123",
//                  balance: "9001"
//              }
//
// Refrences:
// https://en.bitcoin.it/wiki/Running_Bitcoin
// https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_calls_list
// https://www.npmjs.com/package/altcoin-rpc
// Accounts Depreciated in Zcash and Latest Bitcoin Daemons.
//
// Test Address:
// n1idkSr1Scp6UvqQ79nKk8mrw5iJw4AcHGL
//
// daemon.conf (btcprivate.conf)
/*
mainnet=1
addnode=dnsseed.btcprivate.org
server=1
#gen=1
rpcuser=console
rpcpassword=123
rpcclienttimeout=30
# By default, only RPC connections from localhost are allowed.
rpcallowip=149.167.163.164 #make local host for production
rpcport=1234

*/

var config = require('./config.js');
var mongoDBurl = config.config.mongoDBurl;
var daemonLogin = config.config.daemonLogin;
var daemonPass = config.config.daemonPass;
var daemonIP = config.config.daemonIP;
var daemonPort = config.config.daemonPort;

console.log(config.config.daemonIP);
const Client = require('altcoin-rpc'); // Libary to interact with RPC JSON daemon
var mongojs = require('mongojs'); // Libary to interact with mongodb

var db = mongojs(mongoDBurl, ['accounts']); //DB connection
var request = require('request');

const client = new Client({ 
    host: daemonIP,
    port: daemonPort,
    username: daemonLogin,
    password: daemonPass
}); //The daemon

// Debug for database stuff
db.on('connect', function () {
    console.log('Doing database work....')
})

// Returns daemons info
module.exports.getInfo = function getInfo(callback){
        client.getInfo(function(error, help){
            if(!error){
                return callback({error:false, response:help});
            }else{
                console.log({error:true, response:error});
            }
        });
};

// Creates a new account by generating address and storing details to database
// Account API method has been depreciated from bitcoin and all clones, we have to impiment our own using database :(
module.exports.newAccount = function newAccount(uniqueID, callback){
        if(uniqueID == undefined){
            console.log("uniqueID Error: Wrong Syntax...");
            return callback({error:true, response:"Wrong Syntax, try give command a uniqueID"});        
        }
        db.accounts.find({UniqueId:uniqueID}, function (err, res) {
            console.log("error: " + err);
            console.log("res: " + res);
            if(!err && res == ""){
                client.getNewAddress(function(error, address){
                    if(!error){
                        var dateTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                        var dbStructure = { 
                                              UniqueId: uniqueID, //the unique ID of wallet Account
                                              creationDate: dateTime, // creation date and time
                                              address: address, // the address for wallet account
                                              balance: 0 // accounts start balance
                                          };
                        db.accounts.insert(dbStructure, function (err, res) {
                            if(!err){
                                return callback({error:false, response:res});
                            }else{
                                return callback({error:true, response:err});
                            }
                        })
                    }else{
                        return callback({error:true, response:error});
                    }            
                });  
            }else{
                console.log("user already exists... ?");
                return callback({error:true, response:"You already have a account, try the /address command or /help"});
            }
        });
        
};

// Get Address of account
module.exports.getAccountAddress = function getAccountAddress(uniqueID, callback){
        if(uniqueID == undefined){
            return callback({error:true, resposne:"Wrong Syntax, try give command a uniqueID"});        
        }
        db.accounts.find({UniqueId:uniqueID}, function (err, res) {
            if(!err && res != ""){
                return callback({error:false, response:res[0].address});
            }else{
                return callback({error:true, response:"Do you even have a account yet? try /newAccount or /help"});
            }
        })
}

// This method checks the users balance in DB against the address, this is the balance of account
module.exports.checkBalance2 = function checkBalance2(uniqueID, callback){
        if(uniqueID == undefined){
            return callback({error:true, resposne:"Wrong Syntax, try give command a address"});        
        }
        db.accounts.find({UniqueId:uniqueID}, function (err, res) {
            if(!err && res != ""){
                return callback({error:false, response:res[0].balance});
            }else{
                return callback({error:true, response:"Do you even have a account yet? try /newAccount or /help"});
            }
        });
}


module.exports.checkBalance  = function checkBalance(address, callback){
    // Set the headers
    var address = config.config.blockExploreUrl + "/api/addr/" + address + "/balance";
    console.log(address);
    var headers = {
        'User-Agent':       'Mozilla/5.0 (Android 4.4; Mobile; rv:41.0) Gecko/41.0 Firefox/41.0',
        'Content-Type':     'application/x-www-form-urlencoded'
    }

    // Configure the request
    var options = {
        url: address
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            var balance = body / 100000000;
            console.log("BALANCE: " + balance);
            return callback({error:false, response:balance});
        }else{
            console.log(error);
            console.log(response.statusCode);
            return callback({error:true, response:"Do you even have a account yet? try /newAccount or /help"});
        }
    })


}
// Send coins
module.exports.send = function send(uniqueID, amount, to, callback){
    if(amount == undefined || to == undefined){
        console.log(uniqueID);
        console.log(amount);
        console.log(to);
        console.log("amount or to Error: Wrong Syntax...");
        return callback({error:true, response:"Wrong Syntax, try give command a amount or to"});        
    }

    client.sendToAddress(to, amount, function(error, tx){
        if(!error){
            return callback({error:true, response:tx});  
        }else{
            console.log(error);
            return callback({error:true, response:"Not enough balance..."});  
        }
    });   
}

// Safely copies wallet.dat to the specified file, which can be a directory or a path with filename.
module.exports.backupWallet = function backupWallet(fileName, callback){
    if(fileName == undefined){
        console.log(" fileName Error: Wrong Syntax...");
        return callback({error:true, response:"Wrong Syntax, try give command a fileName"});        
    }
    client.backupWallet(fileName, function(error, response){
        if(!error){
            return callback({error:false,response:response});
        }else{
            if(error.code == -4){
                console.log(error);
                return callback({error:true, response:"Only use numbers and letters in your file name please, and no .dat at the end, ie: walletBackUp1"});                 
            }
            console.log(error);
        }            
    });  
};

// Need another sscript to work with this a cron job that runs every 30seconds checking for new deposits and crediting account when found
// This is due to the changes they made in bitcoin removing accounts...
// GetReceivedByAddress: returns the total amount received by the specified address in transactions with the specified number of confirmations

// [Test Functions]

//getInfo((info) => console.log("Peer Connections: " + info.connections + "\n" + console.log("Blocks: " + info.blocks)));
//newAccount("console@console.com", function(response){ if(!response.error){ console.log(response.response); }else{ console.log(response.response); }});
//getAccountAddress("console@console.com", function(response){ if(!response.error){ console.log(response.response); }else{  console.log(response.response);} });
//checkBalance("tmMRc4VkLooUaNf4rgsy3Mpy6ioKx1YTZGn", function(response){ if(!response.error){ console.log(response.response); }else{  console.log(response.response);} });
//backupWallet("walletbackup1", function(response){ if(!response.error){  console.log("Wallet Backup Response: " + response.response); }else{ console.log(response.response); }});
//allAddressReceived("tmMRc4VkLooUaNf4rgsy3Mpy6ioKx1YTZGn", function(response){ if(!response.error){  console.log("All Received to Address Response: " + response.response); }else{ console.log(response.response); }});
//checkBalance2("b1Djpfhr6wdkVoJ7qWngBAZK5jgPZ4xSTAL", function(response){ if(!response.error){  console.log(response.response); }else{ console.log(response.response); }});




//client.sendToAddress('mmXgiR6KAhZCyQ8ndr2BCfEq1wNG2UnyG6', 0.1,  'sendtoaddress example', 'Nemo From Example.com')

//Module Exports
/*
exports.checkBalance = checkBalance(address, callback);
exports.backupWallet = backupWallet(fileName, callback);
exports.deposit = deposit();
exports.allAddressReceived = allAddressReceived(address, callback);
exports.send = send(uniqueID, amount, to, callback);
exports.getAccountAddress = getAccountAddress(uniqueID, callback);
exports.newAccount = newAccount(uniqueID, callback);
exports.getInfo = getInfo(callback);
exports.newAccount = newAccount(uniqueID, callback);
*/