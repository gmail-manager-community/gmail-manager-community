// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

const GM_CLASS_NAME = "Mail Accounts Manager";
const GM_CLASS_ID = Components.ID("{bf43b6d0-f7dd-11da-974d-0800200c9a66}");
const GM_CONTRACT_ID = "@gmail-manager-community.github.com/gmanager/manager;1";

// Extension version
const EXTENSION_VERSION = "0.7";

// Global account type
const GLOBAL_TYPE = "global";

function gmManager()
{
  // Load the services
  this._logger = Components.classes["@gmail-manager-community.github.com/gmanager/logger;1"].getService(Components.interfaces.gmILogger);
  this._parser = Components.classes["@gmail-manager-community.github.com/gmanager/parser;1"].getService(Components.interfaces.gmIParser);
  
  // Initialize the preferences directory
  var directoryService = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
  var prefsDir = directoryService.get("ProfD", Components.interfaces.nsIFile);
  prefsDir.append("gmanager");
  
  // Make sure the preferences directory exists
  if (!prefsDir.exists()) {
    prefsDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
  }
  
  // Initialize the main preferences file
  this._prefsXML = prefsDir.clone();
  this._prefsXML.append("prefs.xml");
  
  // Initialize the backup preferences file
  this._prefsBAK = prefsDir.clone();
  this._prefsBAK.append("prefs.bak");
  
  // Load the preferences
  this.load();
}
gmManager.prototype = {
  _logger: null,
  _parser: null,
  _prefsXML: null,
  _prefsBAK: null,
  _doc: null,
  _accounts: null,
  _accountsRemoved: null,
  
  get version()
  {
    return EXTENSION_VERSION;
  },
  
  get global()
  {
    return this._accounts[GLOBAL_TYPE];
  },
  
  get defaultGlobal()
  {
    return this._createAccount(this._parser.globalNode);
  },
  
  get defaultAccount()
  {
    return this._createAccount(this._parser.accountNode);
  },
  
  load: function()
  {
    // Load the main preferences file
    this._doc = this._parser.open(this._prefsXML);
    
    // Check if the doc exists
    if (!this._doc) {
      // Load the backup preferences file
      this._doc = this._parser.open(this._prefsBAK);
      
      // Check if the doc exists
      if (!this._doc) {
        this._doc = this._parser.emptyDoc.cloneNode(true);
        this._doc.documentElement.setAttribute("version", EXTENSION_VERSION);
      }
    }
    
    // Load the accounts  
    this._loadAccounts();
  },
  
  _loadAccounts: function()
  {
    var accountsTemp = [];
    var accountElements = this._doc.getElementsByTagName("account");
    
    if (!this._accounts) {
      this._accounts = [];
    }
    
    for (var i = 0; i < accountElements.length; i++) {
      var account = this._createAccount(accountElements.item(i));
      var email = this._getEmail(account.node);
      
      if (email in this._accounts) {
        this._accounts[email].load(account.node);
        account = this._accounts[email];
        delete this._accounts[email];
      }
      
      accountsTemp[email] = account;
    }
    
    this._accountsRemoved = this._accounts;
    this._accounts = accountsTemp;
  },
  
  _getEmail: function(aNode)
  {
    if (aNode) {
      return (aNode.hasAttribute("email") ? aNode.getAttribute("email") : GLOBAL_TYPE);
    }
    return null;
  },
  
  _createAccount: function(aNode)
  {
    // Create the account
    var gmAccount = new Components.Constructor("@gmail-manager-community.github.com/gmanager/account;1", Components.interfaces.gmIAccount, "load");
    return new gmAccount(aNode.cloneNode(true));
  },
  
  save: function()
  {
    // Check if the main preferences file exists
    if (this._prefsXML.exists()) {
      // Check if the backup preferences file exists
      if (this._prefsBAK.exists()) {
        this._prefsBAK.remove(false);
      }
      
      // Save the backup preferences file
      this._prefsXML.copyTo(null, this._prefsBAK.leafName);
    }
    
    var accountNodes = this._doc.getElementsByTagName("account");
    
    for (var i = 0; i < accountNodes.length; i++) {
      var oldAccountNode = accountNodes.item(i);
      var oldAccountEmail = this._getEmail(oldAccountNode);
      
      if (oldAccountEmail in this._accounts) {
        var newAccountNode = this._accounts[oldAccountEmail].node;
        
        if (newAccountNode.hasAttribute("password")) {
          var password = newAccountNode.getAttribute("password");
          newAccountNode.removeAttribute("password");
          this._accounts[oldAccountEmail].savePassword(password);
        }
        
        // Replace the account node with the updated one
        this._doc.documentElement.replaceChild(newAccountNode, oldAccountNode);
      } else {
        this._doc.documentElement.removeChild(oldAccountNode);
      }
    }
    
    // Save the main preferences file
    this._parser.save(this._prefsXML, this._doc);
    
    for (var email in this._accountsRemoved) {
      this._accountsRemoved[email].removePassword();
    }
  },
  
  importPrefs: function(aFile)
  {
    var docTemp = this._parser.open(aFile);
    
    if (docTemp) {
      this._doc = docTemp;
      
      // Load the accounts  
      this._loadAccounts();
    }
    
    return (docTemp != null);
  },
  
  exportPrefs: function(aFile)
  {
    var docTemp = this._doc.cloneNode(true);
    var accountNodes = docTemp.getElementsByTagName("account");
    
    for (var i = 0; i < accountNodes.length; i++) {
      var accountNode = accountNodes.item(i);
      accountNode.removeAttribute("password");
    }
    
    return this._parser.save(aFile, docTemp);
  },
  
  getAccounts: function(aCount)
  {
    var accounts = [];
    
    for (var email in this._accounts) {
      if (this._accounts[email].type != GLOBAL_TYPE) {
        accounts.push(this._accounts[email]);
      }
    }
    
    if (aCount) {
      aCount.value = accounts.length;
    }
    
    return accounts;
  },
  
  getAccount: function(aEmail)
  {
    if (aEmail in this._accounts) {
      return this._accounts[aEmail];
    }
  },
  
  isAccount: function(aEmail)
  {
    return (aEmail in this._accounts);
  },
  
  addAccount: function(aType, aEmail, aAlias, aPassword, aNode)
  {
    // Check if the email account exists
    if (aEmail in this._accounts) {
      return null;
    }
    
    // Set the account node
    var node = (aNode ? aNode : this._parser.accountNode.cloneNode(true));
    
    // Set the account details
    node.setAttribute("type", aType);
    node.setAttribute("email", aEmail);
    node.setAttribute("alias", aAlias);
    node.setAttribute("password", aPassword);
    
    // Append the account node
    this._doc.documentElement.appendChild(node);
    
    // Create the account
    this._accounts[aEmail] = this._createAccount(node);
    
    // Check if the email account exists
    if (aEmail in this._accountsRemoved) {
      // Remove the account
      delete this._accountsRemoved[aEmail];
    }
    
    // Return the account
    return this._accounts[aEmail];
  },
  
  removeAccount: function(aEmail)
  {
    // Check if the email account exists
    if (aEmail in this._accounts) {
      // Add the account to the removed list
      this._accountsRemoved[aEmail] = this._accounts[aEmail];
      
      // Remove the account
      delete this._accounts[aEmail];
    }
  },
  
  classDescription: GM_CLASS_NAME,
  classID: GM_CLASS_ID,
  contractID: GM_CONTRACT_ID,
  
//  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.gmIManager]),
  
  QueryInterface: function(aIID)
  {
    if (aIID.equals(Components.interfaces.gmIManager) || 
        aIID.equals(Components.interfaces.nsISupports)) {
      return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
  }
};

if (Components.utils && Components.utils.import) {
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
  
  if (XPCOMUtils.generateNSGetFactory) {
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([gmManager]);
  }
  //else {
  //  var NSGetModule = XPCOMUtils.generateNSGetModule([gmManager]);
  //}
}

// TODO Remove; Obsolete in Firefox 2 (Gecko 1.8.1)

const gmanager_Factory = {
  createInstance: function(aOuter, aIID)
  {
    if (aOuter != null) {
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    }
    
    return (new gmManager()).QueryInterface(aIID);
  }
};

const gmanager_Module = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(
      GM_CLASS_ID,
      GM_CLASS_NAME,
      GM_CONTRACT_ID,
      aFileSpec,
      aLocation,
      aType);
  },
  
  unregisterSelf: function(aCompMgr, aFileSpec, aLocation)
  {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(
      GM_CLASS_ID,
      aFileSpec);
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (aCID.equals(GM_CLASS_ID)) {
      return gmanager_Factory;
    }
    
    if (!aIID.equals(Components.interfaces.nsIFactory)) {
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    }
    
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
  
  canUnload: function(aCompMgr)
  {
    return true;
  }
};

function NSGetModule(aCompMgr, aFileSpec)
{
  return gmanager_Module;
}