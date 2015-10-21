// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

const GM_CLASS_NAME = "Mail Account";
const GM_CLASS_ID = Components.ID("{d4676ee3-7e3c-455a-b417-37eaea3082ad}");
const GM_CONTRACT_ID = "@hatterassoftware.com/gmanager/account;1";

// Global account type
const GLOBAL_TYPE = "global";

// Mail account types
const ACCOUNT_TYPE_GMAIL = "gmail";
const ACCOUNT_TYPE_YAHOO = "yahoo";

// Password site
const PASSWORD_SITE = "extensions.gmanager.account";

function gmAccount()
{
  this.wrappedJSObject = this;
  // Load the services
  this._logger = Components.classes["@hatterassoftware.com/gmanager/logger;1"].getService(Components.interfaces.gmILogger);
  this._timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
}
gmAccount.prototype = {
  _logger: null,
  _node: null,
  _prefs: null,
  _type: null,
  _email: null,
  _alias: null,
  _password: null,
  _service: null,
  
  _log: function(aMsg)
  {
    this._logger.log("(" + this.email + ") " + aMsg);
  },
  
  get node() { return this._node; },
  get type() { return this._type; },
  get email() { return this._email; },
  get alias() { return this._alias; },
  get password()
  {
    var password = null;
    
    // Check for Toolkit 1.9 (Firefox 3)
    if ("@mozilla.org/login-manager;1" in Components.classes)
    {
      // Lookup the login info
      var loginInfo = this._getLoginInfo();
      
      // Check if the login info exists
      if (loginInfo !== null)
        password = loginInfo.password;
    }
    else
    {
      // Load the password manager service
      var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"].getService(Components.interfaces.nsIPasswordManagerInternal);
      
      // Initialize the parameters to lookup
      var hostURIFound = { value: "" };
      var usernameFound = { value: "" };
      var passwordFound = { value: "" };
      
      try {
        // Lookup the password for this email
        passwordManager.findPasswordEntry(PASSWORD_SITE, this._email, null, hostURIFound, usernameFound, passwordFound);
      } catch(e) {
        this._log("Error getting the password: " + e);
      }
      
      // Check if the password was found
      if (passwordFound !== null)
        password = passwordFound.value;
    }
    
    // Return the password
    return password;
  },
  
  get newMail() { return this.unread > this._lastUnread; },
  get unread()
  {
    var unread = 0;
    
    if (this.getBoolPref("toolbar-unread-count-inbox"))
      unread += this.inboxUnread;
    
    if (this.getBoolPref("toolbar-unread-count-spam"))
      unread += this.spamUnread;
    
    if (this.getBoolPref("toolbar-unread-count-labels"))
    {
      var labels = this.getLabels({});
      
      for (var i = 0; i < labels.length; i++)
        unread += labels[i].unread;
    }
    
    return unread;
  },
  
  get status() { return (this._service ? this._service.status : null); },
  get loggedIn() { return (this._service ? this._service.loggedIn : false); },
  get checking() { return (this._service ? this._service.checking : false); },
  get inboxUnread() { return (this._service ? this._service.inboxUnread : -1); },
  get importantUnread() { return (this._service ? this._service.wrappedJSObject.importantUnread : -1); },
  get savedDrafts() { return (this._service ? this._service.savedDrafts : -1); },
  get spamUnread() { return (this._service ? this._service.spamUnread : -1); },
  get spaceUsed() { return (this._service ? this._service.spaceUsed : null); },
  get percentUsed() { return (this._service ? this._service.percentUsed : null); },
  get totalSpace() { return (this._service ? this._service.totalSpace : null); },
  
  getBoolPref: function(aId)
  {
    return (this.getCharPref(aId) === "true");
  },
  setBoolPref: function(aId, aValue)
  {
    this.setCharPref(aId, aValue ? "true" : "false");
  },
  
  getCharPref: function(aId)
  {
    if (aId in this._prefs)
    {
      var value = this._prefs[aId].getAttribute("value");
      this._log("Returning preference: " + aId + " = " + value);
      return value;
    }
    else
      this._log("Unknown preference: " + aId);
  },
  setCharPref: function(aId, aValue)
  {
    if (aId in this._prefs)
      this._prefs[aId].setAttribute("value", aValue);
  },
  
  getIntPref: function(aId)
  {
    return parseInt(this.getCharPref(aId));
  },
  setIntPref: function(aId, aValue)
  {
    this.setCharPref(aId, aValue ? aValue.toString() : "");
  },
  
  load: function(aNode)
  {
    this._node = aNode;
    this._prefs = new Array();
    
    if (this._type === null)
    {
      // Set the account type
      this._type = this._node.getAttribute("type");
      
      // Check the account type
      if (this._type === GLOBAL_TYPE)
      {
        // Set the account email
        this._email = GLOBAL_TYPE;
      }
      else
      {
        // Set the account email
        this._email = this._node.getAttribute("email");
        
        // Load the mail service
        switch (this._type)
        {
          case ACCOUNT_TYPE_GMAIL:
            // Create the Gmail mail service
            this._service = Components.classes["@hatterassoftware.com/gmanager/service/gmail;1"].createInstance(Components.interfaces.gmIServiceGmail);
            break;
          case ACCOUNT_TYPE_YAHOO:
            // TODO Create the Yahoo mail service
            break;
          default:
            break;
        }
        
        // Initialize the mail service
        this.init(this._email);
      }
    }
    
    // Set the account alias
    this._alias = this._node.getAttribute("alias");
    
    // Check if the password attribute is specified
    if (this._node.hasAttribute("password"))
    {
      // Save the account password
      this.savePassword(this._node.getAttribute("password"));
    }
    
    var prefs = this._node.getElementsByTagName("pref");
    
    for (var i = 0, n = prefs.length; i < n; i++)
    {
      var pref = prefs[i];
      if (pref.hasAttribute("id"))
        this._prefs[pref.getAttribute("id")] = pref;
    }
  },
  
  savePassword: function(aPassword)
  {
    // Save the password
    this._updatePassword(aPassword);
  },
  
  removePassword: function()
  {
    // Remove the password (if available)
    this._updatePassword(null);
  },
  
  _updatePassword: function(aPassword)
  {
    var isPassword = (aPassword != null && aPassword.length > 0);
    
    // Check for Toolkit 1.9 (Firefox 3)
    if ("@mozilla.org/login-manager;1" in Components.classes)
    {
      // Load the login manager service
      var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
      
      // Get the available login info
      var loginInfo = this._getLoginInfo();
      
      // Check if the password is specified
      if (isPassword)
      {
        // Create the updated login info
        var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Components.interfaces.nsILoginInfo, "init");
        var newLoginInfo = new nsLoginInfo(PASSWORD_SITE, "/", null, this._email, aPassword, "", "");
        
        // Check if the login info exists
        if (loginInfo === null)
          loginManager.addLogin(newLoginInfo);
        else
          loginManager.modifyLogin(loginInfo, newLoginInfo);
      }
      else
      {
        // Check if the login info exists
        if (loginInfo !== null)
          loginManager.removeLogin(loginInfo);
      }
    }
    else
    {
      // Load the password manager service
      var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"].getService(Components.interfaces.nsIPasswordManager);
      
      try {
        // Check if the password is specified
        if (isPassword)
          passwordManager.addUser(PASSWORD_SITE, this._email, aPassword);
        else
          passwordManager.removeUser(PASSWORD_SITE, this._email);
      } catch(e) {
        this._log("Error updating the password: " + e);
      }
    }
  },
  
  _getLoginInfo: function()
  {
    // Load the login manager service
    var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
    
    // Get all logins that match the site
    var logins = loginManager.findLogins({}, PASSWORD_SITE, "/", null);
    
    // Search for the matching login info
    for (var i = 0, n = logins.length; i < n; i++)
    {
      if (logins[i].username === this._email)
        return logins[i];
    }
    
    return null;
  },
  
  /**
   * gmIService
   */
  init: function(aEmail)
  {
    if (this._service)
      this._service.init(aEmail);
  },
  
  getFolder: function(/* Optional */ aPassword, aFolderId)
  {
    if (this._service)
      return this._service.getFolder((aPassword || this.password), aFolderId);
  },
  
  getMessage: function(/* Optional */ aPassword, aMessageId)
  {
    if (this._service)
      return this._service.getMessage((aPassword || this.password), aMessageId);
  },
  
  getCompose: function(/* Optional */ aPassword, aHref)
  {
    if (this._service)
      return this._service.getCompose((aPassword || this.password), aHref);
  },
  
  login: function(/* Optional */ aPassword)
  {
    if (this._service)
    {
      this._lastUnread = 0;
      this._service.login(aPassword || this.password);
      this._startTimer();
    }
  },
  
  logout: function()
  {
    if (this._service)
      this._service.logout();
  },
  
  check: function()
  {
    if (this._service)
    {
      this._lastUnread = this.unread;
      this._service.check();
      this._startTimer();
    }
  },
  
  resetUnread: function()
  {
    if (this._service)
    {
      this._service.resetUnread();
      this._startTimer();
    }
  },
  
  getLabels: function(aCount)
  {
    var labels = (this._service ? this._service.getLabels({}) : []);
    if (aCount)
      aCount.value = labels.length;
    return labels;
  },
  
  getSnippets: function(aCount)
  {
    var snippets = (this._service ? this._service.getSnippets({}) : []);
    if (aCount)
      aCount.value = snippets.length;
    return snippets;
  },
  
  _startTimer: function()
  {
    // Stop the check timer
    this._timer.cancel();
    
    if (this.getBoolPref("notifications-check"))
    {
      var interval = (this.getIntPref("notifications-check-interval") * 60000);
      
      // Check if the interval is valid
      if (!isNaN(interval) && interval > 0)
      {
        // Start the check timer, fire only once
        this._timer.initWithCallback(this, interval, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
      }
    }
  },
  
  notify: function(aTimer)
  {
    if (this.loggedIn)
      this.check();
  },
  
  classDescription: GM_CLASS_NAME,
  classID: GM_CLASS_ID,
  contractID: GM_CONTRACT_ID,
  
//  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.gmIAccount]),
  
  QueryInterface: function(aIID)
  {
    if (aIID.equals(Components.interfaces.gmIAccount) || 
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_ERROR_NO_INTERFACE;
  }
}

if (Components.utils && Components.utils.import)
{
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
  
  if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([gmAccount]);
//  else
//    var NSGetModule = XPCOMUtils.generateNSGetModule([gmAccount]);
}

// TODO Remove; Obsolete in Firefox 2 (Gecko 1.8.1)

const gmanager_Factory = {
  createInstance: function(aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    
    return (new gmAccount()).QueryInterface(aIID);
  }
}

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
    if (aCID.equals(GM_CLASS_ID))
      return gmanager_Factory;
    
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    
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