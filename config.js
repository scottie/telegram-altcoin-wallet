//Config file
// - console/scottie
//

//The config file
exports.config = config = {
    mongoDBurl:"", //mongo db connection string
    daemonLogin:"", // daemon user
    daemonPass:"", // daemon pass
    daemonIP:"", // daemons ip if not local host be sure to whitelist the ip this script runs on
    daemonPort:"", // port you have daemon running on
    adminUserID :"", // the user ID of admin check console output for it
    telegramBotToken:"", // The API key for our telegram bot account
    botsOwnerEmail:"scottlindh@gmail.com", // Contact details for the owner of this bot
    botBrand:"[💰]", //The bot image that is sent starting every command reply
    blockExploreUrl:"", // Url for a block explorer
    //Help Text !
    helpText : "             \n" +
               " /help - Displays this help file. \n" +
               " /newAccount = Sets up a wallet, may only be used once. \n" +
               " /balance = Returns your balance. \n" +
               " /address = Returns your address. \n" +
               " /blocks = Returns wallet block and sync state of wallet. \n" +
               " /send <amount> <to> = Sends amount to Address.\n" +              
               " /backup <fileName> = Backs up wallet.dat (Admin Only).\n" +
               " /explore = The url for block chain explorer.\n" +
               "\n" +
               "Any issues please contact " + this.botsOwnerEmail + "\n"
};

