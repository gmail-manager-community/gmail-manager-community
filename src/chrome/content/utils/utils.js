// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Utils = new function()
{
  this.WEBSITE = "https://github.com/gmail-manager-community/gmail-manager-community";
  
  this.init = function()
  {
    // Get the logger service
    this._logger = Components.classes["@gmail-manager-community.github.com/gmanager/logger;1"].getService(Components.interfaces.gmILogger);
    
    // Get the platform version
    this._platformVersion = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo).platformVersion;
    
    // Create the unicode converter
    this._unicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
  }
  
  this.log = function(aMsg, /* Optional */ aEmail)
  {
    this._logger.log((aEmail ? "(" + aEmail + ") " : "") + aMsg);
  }
  
  this.getPlatformVersion = function()
  {
    return this._platformVersion;
  }
  
  this.getBrowser = function()
  {
    var browser = null;
    
    if (typeof getBrowser === "function")
      browser = getBrowser();
    else
    {
      var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
      var recentWindow = windowMediator.getMostRecentWindow("navigator:browser");
      
      if (recentWindow)
      {
        if (recentWindow.gBrowser)
          browser = recentWindow.gBrowser;
        else if (typeof recentWindow.getBrowser === "function")
          browser = recentWindow.getBrowser();
        else
          this.log("Unable to get the browser.");
      }
      else
        this.log("Unable to get the most recent window.");
    }
    
    return browser;
  }
  
  this.getDocument = function()
  {
    var browser = this.getBrowser();
    return (browser ? browser.ownerDocument : null);
  }
  
  this.getStoredLogins = function(aHostname, aActionURL, aUsername)
  {
    var logins = [];
    
    // Check for Toolkit 1.9 (Firefox 3)
    if (Components.classes["@mozilla.org/login-manager;1"])
    {
      // Get the nsILoginManager service
      var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
      
      // Find logins that match the hostname and action URL
      var loginInfos = (aHostname ? loginManager.findLogins({}, aHostname, aActionURL, null) : loginManager.getAllLogins({}));
      
      for (var i = 0, n = loginInfos.length; i < n; i++)
      {
        // Check if the login matches the username
        if (aUsername == null || loginInfos[i].username === aUsername)
          logins.push(loginInfos[i]);
      }
    }
    else if (Components.classes["@mozilla.org/passwordmanager;1"])
    {
      // Get the nsIPasswordManager service
      var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"].getService(Components.interfaces.nsIPasswordManager);
      
      // Enumerate through the passwords 
      var passwordEnumerator = passwordManager.enumerator;
      
      while (passwordEnumerator.hasMoreElements())
      {
        var password = passwordEnumerator.getNext().QueryInterface(Components.interfaces.nsIPassword);
        
        // Check if the login matches the hostname and username
        if ((aHostname == null || password.host === aHostname) && 
            (aUsername == null || password.user === aUsername))
        {
          logins.push({
            hostname: password.host,
            username: password.user,
            password: password.password
          });
        }
      }
    }
    
    // Return the logins
    return logins;
  }
  
  this.getHref = function(aNode)
  {
    var linkNode = null;
    
    if (aNode && aNode instanceof Node)
    {
      var targetNode = aNode;
      
      while (targetNode)
      {
        if (targetNode instanceof HTMLAnchorElement ||
            targetNode instanceof HTMLAreaElement ||
            targetNode instanceof HTMLLinkElement)
        {
          if (targetNode.hasAttribute("href"))
            linkNode = targetNode;
        }
        
        targetNode = targetNode.parentNode;
      }
    }
    
    return (linkNode ? (linkNode.href || linkNode.getAttributeNS("http://www.w3.org/1999/xlink", "href")) : null);
  }
  
  this.isEmail = function(aEmail)
  {
    const emailRegExp = /^.+@.+\..+$/;
    return emailRegExp.test(aEmail);
  }
  
  this.isMailto = function(aHref)
  {
    const mailtoRegExp = /^mailto:/i;
    return mailtoRegExp.test(aHref);
  }
  
  this.showLogin = function(/* Optional */ aAccount)
  {
    var loginWindowName = "gmanager-login-" + (aAccount ? aAccount.email : "empty");
    
    if (!this.isWindow(loginWindowName))
      window.openDialog("chrome://gmanager/content/login/login.xul", loginWindowName, "centerscreen,chrome,dependent=no", aAccount);
  }
  
  this.isWindow = function(aName)
  {
    var windowWatcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
    return (windowWatcher && windowWatcher.getWindowByName(aName, null) !== null);
  }
  
  this.toStyleStatus = function(aStatus)
  {
    switch (aStatus)
    {
      case Components.interfaces.gmIService.STATE_CONNECTING:
        return "connecting";
      case Components.interfaces.gmIService.STATE_LOGGED_OUT:
        return "logged-out";
      case Components.interfaces.gmIService.STATE_LOGGED_IN:
        return "logged-in";
      case Components.interfaces.gmIService.STATE_ERROR_PASSWORD:
      case Components.interfaces.gmIService.STATE_ERROR_NETWORK:
      case Components.interfaces.gmIService.STATE_ERROR_TIMEOUT:
        return "error";
      default:
        return "unknown";
    }
  }
  
  this.toUnicode = function(aString)
  {
    try {
      // Required for some reason otherwise encoding is lost
      this._unicodeConverter.charset = "UTF-8";
      
      // Return the unicode converted string
      return this._unicodeConverter.ConvertToUnicode(aString);
    } catch(e) {
      this.log("Error converting to unicode: " + e);
      return aString;
    }
  }
  
  this.clearKids = function(aNode)
  {
    if (aNode && aNode instanceof Node)
    {
      while (aNode.hasChildNodes())
        aNode.removeChild(aNode.lastChild);
    }
  }
  
  this.loadSimpleURI = function(aUrl)
  {
    const GM_EXTENSION_ID = "gmail-manager-community@gmail-manager-community.github.com";
    
    if (Components.classes["@mozilla.org/extensions/manager;1"])
    {
      var extensionManager = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
      var extension = extensionManager.getItemForID(GM_EXTENSION_ID);
      
      this.loadURI(aUrl, this.WEBSITE + extension.version + "/", null, "background");
    }
    else if (Components.utils && Components.utils.import)
    {
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      
      var self = this;
      
      AddonManager.getAddonByID(GM_EXTENSION_ID, function(aAddon) {
        self.loadURI(aUrl, self.WEBSITE + aAddon.version + "/", null, "background");
      });
    }
  }
  
  this.loadURI = function(aUrl, aReferrerUrl, aData, aLocation)
  {
    var tabbrowser = this.getBrowser();
    var referrerUri = null;
    var mimeInputStream = null;
    
    if (typeof aReferrerUrl === "string")
    {
      var ioService = Components.classes["@mozilla.org/network/io-service;1"].createInstance(Components.interfaces.nsIIOService);
      referrerUri = ioService.newURI(aReferrerUrl, null, null);
    }
    
    if (typeof aData === "string")
    {
      var stringInputStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
      stringInputStream.setData(aData, aData.length);
      
      mimeInputStream = Components.classes["@mozilla.org/network/mime-input-stream;1"].createInstance(Components.interfaces.nsIMIMEInputStream);
      mimeInputStream.addHeader("Content-Type", "application/x-www-form-urlencoded");
      mimeInputStream.addContentLength = true;
      mimeInputStream.setData(stringInputStream);
    }
    
    switch (aLocation)
    {
      case "blank":
      case "existing":
      {
        var browsers = tabbrowser.browsers;
        var hostname = (aLocation === "blank" ? "" : "mail.google.com");
        var browser = null;
        
        for (var i = 0, n = browsers.length ; i < n && browser === null; i++)
        {
          if (browsers[i].currentURI.asciiHost === hostname)
            browser = browsers[i];
        }
        
        if (browser)
          browser.webNavigation.loadURI(aUrl, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, referrerUri, mimeInputStream, null);
        else
          this.loadURI(aUrl, aReferrerUrl, aData, "background");
        
        break;
      }
      case "current":
        tabbrowser.webNavigation.loadURI(aUrl, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, referrerUri, mimeInputStream, null);
        break;
      case "focused":
        tabbrowser.selectedTab = tabbrowser.addTab();
        tabbrowser.webNavigation.loadURI(aUrl, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, referrerUri, mimeInputStream, null);
        break;
      case "background":
        var newTab = tabbrowser.getBrowserForTab(tabbrowser.addTab());
        newTab.webNavigation.loadURI(aUrl, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, referrerUri, mimeInputStream, null);
        break;
      case "window":
        window.openDialog("chrome://browser/content", "_blank", "chrome,all,dialog=no", aUrl, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, referrerUri, mimeInputStream);
        break;
      default:
        break;
    }
  }
  
  this.loadDefaultMail = function(aHref)
  {
    var externalProtocolService = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);
    var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    var uri = ioService.newURI((this.isMailto(aHref) ? aHref : "mailto:"), null, null);
    
    externalProtocolService.loadUrl(uri);
  }
  
  this.init();
}