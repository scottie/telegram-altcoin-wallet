// 2018 Console, http://github.com/u/scottie
// 

// Telegram Bot Token:
/*
    💰 🛠 🤖 📱 🕹 📢
*/
//t.me/btcpWalletBot


// Refrences:
// https://web.telegram.org/#/login
// https://www.npmjs.com/package/telebot
// https://core.telegram.org/bots/api
var config = require('./config.js');
var adminUserID = config.config.adminUserID;
var telegramBotToken = config.config.telegramBotToken; // The API key for our telegram bot account
var botsOwnerEmail = config.config.botsOwnerEmail; // Contact details for the owner of this bot
var botBrand = config.config.botBrand; //The bot image that is sent starting every command reply
var blockExploreUrl = config.config.blockExploreUrl; // Url for a block explorer
var helpText = config.config.helpText;
var mongoDBurl = config.config.mongoDBurl;
var mongojs = require('mongojs'); // Libary to interact with mongodb

var db = mongojs(mongoDBurl, ['accounts']); //DB connection
const TeleBot = require('telebot'); // The libary we use to interact with telegram
const daemon = require('./bitcoin-private.js'); // our module for daemon interaciton
const bot = new TeleBot(telegramBotToken); 

bot.on('text', function(msg){
    console.log(msg.chat.id + " " + msg.chat + ": " + msg.text);
}) 

// Shows current block status of daemon
bot.on('/blocks', function(msg){
    console.log(msg.chat.id);
    daemon.getInfo(function(d){
        if(!d.error){
            msg.reply.text("Block: " + d.response.blocks);
        }else{
            msg.reply.text(d.response);
        }        
    });
}); //

// Gives users link to block explorer
bot.on('/explore', function(msg){
    console.log(msg.chat.id);
    msg.reply.text(blockExploreUrl);
}); //

// Help Command see helpText varible
bot.on(['/help', '/start', '/wiki', '/about', '/consolerules'], function(msg){ 
        console.log(msg.chat.id);
        msg.reply.text(helpText);
});

// create new account
bot.on('/newAccount', function(msg){
    var uniqueID = msg.from.id;
    console.log("new: " + uniqueID);
    daemon.newAccount(uniqueID, function(d){
        //console.log(d);
        if(!d.error){
            msg.reply.text(d.response.address);
        }else{
            msg.reply.text(d.response);
        }
    });
}); //

// create account address if user has one
bot.on('/address', function(msg){
    var uniqueID = msg.from.id;
    daemon.getAccountAddress(uniqueID, function(d){
        //console.log(d);
        if(!d.error){
            msg.reply.text(d.response);
        }else{
            msg.reply.text(d.response);
        }
    });
}); //

// checks accounts balance
bot.on('/balance', function(msg){
    var uniqueID = msg.from.id;
    db.accounts.find({UniqueId:uniqueID}, function (err, res) {
        if(!err && res != ""){
            daemon.checkBalance(res[0].address, function(d){
                //console.log(d);
                if(!d.error){
                    msg.reply.text(d.response);
                }else{
                    msg.reply.text(d.response);
                }
            });
        }else{
            return callback({error:true, response:"Do you even have a account yet? try /newAccount or /help"});
        }
    });
   
}); //

// lets admin backup wallet
bot.on(/^\/backup (.+)$/, (msg, props) => {
    var uniqueID = msg.from.id;
    var filename = props.match[1];
    if(uniqueID == adminUserID){
        daemon.backupWallet(filename, function(d){
            //console.log(d);
            if(!d.error){
                msg.reply.text(d.response);
            }else{
                msg.reply.text(d.response);
            }
        });
    }else{
        msg.reply.text("You are not Admin, dont try be sneaky...");
    }
}); //


// Send command, send amount to address if balance allows
bot.on(/^\/send (.+)$/, (msg, props) => {
    var uniqueID = msg.from.id;
    if(props != null){
        const command = props.match[1];
        var params = command.split(" ");
        var amount = params[0];
        var to = params[1];
        db.accounts.find({UniqueId:uniqueID}, function (err, res) {
            var address = res[0].address;
            daemon.checkBalance(address, function(d){
                if(!d.error){
                    console.log("Balance: " + d.response);
                    console.log("Amount: " + amount);
                    if(d.response >= amount){
                        console.log({amount:amount, address:to});
                        daemon.send(uniqueID, amount, to, function(d){
                            //console.log(d);
                            if(!d.error){
                                msg.reply.text(d.response);
                            }else{
                                msg.reply.text(d.response);
                            }
                        });
                    }else{
                        console.log(d.response);
                        msg.reply.text("You dont have enough balance to make this transfer...");
                    }
                    
                }else{
                    msg.reply.text(d.response);
                }
            });
        });        
        
    }else{
        msg.reply.text("Please use correct syntax, /send <amount> <to>, ie: /send 1 1nMvtopgycXmkJvcPK4vMBHADYgEVWexWMv");
    }

    //return bot.sendMessage(msg.from.id, text, { replyToMessage: msg.message_id });
});

bot.on(['error'], msg => {
    console.log(msg);
    //email / message / notify owner
    //botsOwnerEmail
  });

//brands every text going out with our bots brand / image
//bot.mod('text', (data) => {
//    let msg = data.message;
//    msg.text =  botBrand + " " + msg.text;
//    return data;
//});

// Fun easter egg
bot.on('cats suck', (msg) => {
    console.log("yep1");
   return msg.reply.photo('http://thecatapi.com/api/images/get');
});

bot.start();


