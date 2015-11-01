// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

function gmanager_OverlayLoad(aEvent)
{
  // Load the overlay
  gmanager_Overlay.load();
}

function gmanager_OverlayUnload(aEvent)
{
  // Unload the overlay
  gmanager_Overlay.unload();
}

function gmanager_ContentAreaClick(aEvent)
{
  var manager = Components.classes["@gmail-manager-community.github.com/gmanager/manager;1"].getService(Components.interfaces.gmIManager);
  var global = manager.global;
  var href = gmanager_Utils.getHref(aEvent.target);
  
  switch (aEvent.button)
  {
    case 0: // Left Click
    case 1: // Middle Click
    {
      if (global.getBoolPref("compose-mailto-links") && gmanager_Utils.isMailto(href))
      {
        var email = global.getCharPref("compose-mailto-default");
        var location = global.getCharPref("compose-tab-location");
        
        gmanager_Accounts.openCompose(email, location, href);
        
        // Prevent the default mail client from loading
        aEvent.preventDefault();
      }
      
      break;
    }
    case 2: // Right Click
    {
      var isHidden = global.getBoolPref("general-hide-context-menu");
      
      if (!isHidden && !gmanager_Utils.isMailto(href))
        isHidden = global.getBoolPref("compose-context-menu");
      
      document.getElementById("gmanager-context-menu-separator").hidden = isHidden;
      document.getElementById("gmanager-context-menu").hidden = isHidden;
      
      break;
    }
    default:
      break;
  }
}

var gmanager_Overlay = new function()
{
  this.load = function()
  {
    // Load the services
    this._manager = Components.classes["@gmail-manager-community.github.com/gmanager/manager;1"].getService(Components.interfaces.gmIManager);
    this._observer = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    
    // Load the observers
    this._observer.addObserver(this, gmanager_Prefs.NOTIFY_CHANGED, false);
    this._observer.addObserver(this, gmanager_Accounts.NOTIFY_STATE, false);
    
    const GM_EXTENSION_ID = "gmail-manager-community@gmail-manager-community.github.com";
    
    if (Components.classes["@mozilla.org/extensions/manager;1"])
    {
      var extensionManager = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
      var extension = extensionManager.getItemForID(GM_EXTENSION_ID);
      
      if (extension.version !== gmanager_Prefs.getCharPref("version"))
        this._welcome(extension.version);
    }
    else if (Components.utils && Components.utils.import)
    {
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      
      var self = this;
      
      AddonManager.getAddonByID(GM_EXTENSION_ID, function(aAddon) {
        if (aAddon.version !== gmanager_Prefs.getCharPref("version"))
          self._welcome(aAddon.version);
      });
    }
    
    // Load the mail accounts
    this._loadAccounts(true);
    
    // Toggle the Tools menu
    this._toggleToolsMenu();
  }
  
  this.unload = function()
  {
    // Remove the observers
    this._observer.removeObserver(this, gmanager_Prefs.NOTIFY_CHANGED);
    this._observer.removeObserver(this, gmanager_Accounts.NOTIFY_STATE);
  }
  
  this._welcome = function(aCurrentVersion)
  {
    // Get the previous version
    var previousVersion = gmanager_Prefs.getCharPref("version");
    
    gmanager_Utils.log("Previous version = " + previousVersion);
    gmanager_Utils.log("Current version = " + aCurrentVersion);
    
    // Check for previous version
    if (previousVersion < "0.7")
    {
      // Check if the preference exists
      if (gmanager_Prefs.hasPref("current"))
      {
        var email = gmanager_Prefs.getCharPref("current");
        
        // Check if the account exists
        if (this._manager.isAccount(email))
        {
          var account = this._manager.getAccount(email);
          
          // Set the account to be displayed
          account.setBoolPref("toolbar-display", true);
          
          // Save the accounts
          this._manager.save();
        }
      }
    }
    
    // Check for first time running (i.e. just installed)
    if (gmanager_Prefs.getBoolPref("first-time"))
    {
      var logins = gmanager_Utils.getStoredLogins("https://www.google.com", "https://www.google.com", null);
      
      // Check if there are any logins
      if (logins.length > 0)
        window.openDialog("chrome://gmanager/content/migrate/migrate.xul", "migrate", "centerscreen,chrome,resizable=yes", logins);
      
      // Mark the extension as having already run
      gmanager_Prefs.setBoolPref("first-time", false);
    }
    
    // Set the current version
    gmanager_Prefs.setCharPref("version", aCurrentVersion);
  }
  
  this._loadAccounts = function(aStartupFlag)
  {
    var accounts = this._manager.getAccounts({});
    var isAutoLogin = this._manager.global.getBoolPref("general-auto-login");
    var defaultToolbarItem = gmanager_Toolbars.getToolbarItem();
    
    accounts.forEach(function(account, index, array) {
      var toolbarItem = gmanager_Toolbars.getToolbarItem(account.email);
      
      // Check if the toolbar item exists
      if (toolbarItem)
      {
        // Update the toolbar item
        toolbarItem.update();
      }
      else
      {
        // Create the toolbar item
        toolbarItem = gmanager_Toolbars.createToolbarItem(account.email);
      }
      
      // Check if the account should automatically login
      if (aStartupFlag && (isAutoLogin || account.getBoolPref("general-auto-login")))
        account.login(null);
    });
    
    // Check if the default toolbar item exists
    if (defaultToolbarItem === null)
    {
      // Create the default toolbar item
      defaultToolbarItem = gmanager_Toolbars.createToolbarItem();
    }
    
    // Show the default toolbar item if there are no accounts
    defaultToolbarItem.hidden = (accounts.length > 0);
  }
  
  this._toggleToolsMenu = function()
  {
    var toolsMenu = document.getElementById("gmanager-tools-menu");
    
    // Check if the Tools menu exists
    if (toolsMenu)
    {
      // Display the Tools menu based on the preference
      toolsMenu.collapsed = this._manager.global.getBoolPref("general-hide-tools-menu");
    }
  }
  
  this.observe = function(aSubject, aTopic, aData)
  {
    gmanager_Utils.log("aSubject = " + aSubject);
    gmanager_Utils.log("aTopic = " + aTopic);
    gmanager_Utils.log("aData = " + aData);
    
    if (aTopic === gmanager_Prefs.NOTIFY_CHANGED)
    {
      // aSubject : null
      // aTopic   : gmanager_Prefs.NOTIFY_CHANGED
      // aData    : null
      
      // Load the mail accounts
      this._loadAccounts(false);
      
      // Toggle the Tools menu
      this._toggleToolsMenu();
    }
    else if (aTopic === gmanager_Accounts.NOTIFY_STATE)
    {
      // aSubject : null
      // aTopic   : gmanager_Accounts.NOTIFY_STATE
      // aData    : email (e.g. longfocus@gmail.com)
      
      // Check if the account exists
      if (this._manager.isAccount(aData))
      {
        var account = this._manager.getAccount(aData);
        
        switch (account.status)
        {
          case Components.interfaces.gmIService.STATE_CONNECTING:
          case Components.interfaces.gmIService.STATE_LOGGED_OUT:
            break;
          case Components.interfaces.gmIService.STATE_LOGGED_IN:
          {
            if (account.newMail)
            {
              // Play sound
              if (account.getBoolPref("notifications-sounds"))
              {
                var file = account.getCharPref("notifications-sounds-file");
                
                gmanager_Utils.log("Playing sound file: " + file);
                gmanager_Sounds.play(file);
              }
              
              // Show snippets
              if (account.getBoolPref("notifications-display-snippets"))
              {
                gmanager_Utils.log("Displaying alerts for: " + account.email);
                gmanager_Alerts.display(account.email);
              }
              
              // Switch accounts
              if (this._manager.global.getBoolPref("toolbar-auto-switch"))
              {
                gmanager_Utils.log("Switching to account: " + account.email);
                
                var accounts = this._manager.getAccounts({});
                
                accounts.forEach(function(otherAccount, index, array) {
                  var toolbarItem = gmanager_Toolbars.getToolbarItem(otherAccount.email);
                  
                  // Check if the toolbar item exists and is not hidden
                  if (toolbarItem && !toolbarItem.hidden)
                    toolbarItem.displayAccount = account;
                });
              }
            }
            
            break;
          }
          case Components.interfaces.gmIService.STATE_ERROR_PASSWORD:
          {
            gmanager_Utils.log("Displaying login for: " + account.email);
            gmanager_Utils.showLogin(account);
            break;
          }
          case Components.interfaces.gmIService.STATE_ERROR_NETWORK:
          case Components.interfaces.gmIService.STATE_ERROR_TIMEOUT:
            break;
          default:
          {
            gmanager_Utils.log("Unknown state...definitely should not be here!");
            break;
          }
        }
      }
    }
  }
}