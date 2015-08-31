// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Options = new function()
{
  this.__proto__ = new gmanager_BundlePrefix("gmanager-options-");
  
  this.FILTER_TYPE_XML = "*.xml";
  
  this.load = function()
  {
    // Load the accounts manager sandbox
    this._manager = Components.classes["@hatterassoftware.com/gmanager/manager;1"].getService(Components.interfaces.gmIManager);
    this._sandbox = Components.classes["@hatterassoftware.com/gmanager/manager;1"].createInstance(Components.interfaces.gmIManager);
    
    var accounts = this._sandbox.getAccounts({});
    
    for (var i = 0, n = accounts.length; i < n; i++)
      accounts[i].node.setAttribute("password", accounts[i].password);
    
    // Get the last viewed page
    var pageValue = gmanager_Prefs.getCharPref("options-page");
    
    // Check if the debug page is visible
    if (!gmanager_Prefs.getBoolPref("debug"))
    {
      // Remove the debug page from the list of pages
      var debugPage = document.getElementById("gmanager-options-listbox").lastChild;
      debugPage.parentNode.removeChild(debugPage);
    }
    
    // Load the page
    this.loadPage(pageValue);
  }
  
  this.command = function()
  {
    var pageIndex = document.getElementById("gmanager-options-listbox").selectedIndex;
    var pageDocument = document.getElementById("gmanager-options-iframe").contentDocument;
    
    switch (pageIndex)
    {
      case 0: // general.xul
        break;
      case 1: // accounts.xul
      {
        var accountItem = pageDocument.getElementById("gmanager-options-accounts-listbox").selectedItem;
        
        if (accountItem && this._sandbox.isAccount(accountItem.email))
        {
          var account = this._sandbox.getAccount(accountItem.email);
          account.setBoolPref("general-auto-login", accountItem.checked);
        }
        
        break;
      }
      case 2: // compose.xul
      {
        var isMailtoDisabled = !pageDocument.getElementById("gm-prefs-compose-mailto-links").checked;
        
        pageDocument.getElementById("options-compose-default-account").disabled = isMailtoDisabled;
        pageDocument.getElementById("gm-prefs-compose-mailto-default").parentNode.disabled = isMailtoDisabled;
        
        break;
      }
      case 3: // security.xul
        break;
      case 4: // toolbar.xul
        break;
      case 5: // notifications.xul
        break;
      case 6: // help.xul
      {
        var contributorItem = pageDocument.getElementById("gmanager-options-help-contributors-list").selectedItem;
        
        if (contributorItem)
          pageDocument.getElementById("gmanager-options-help-visit-button").disabled = !contributorItem.hasAttribute("site");
        
        break;
      }
      case 7: // debug.xul
      {
        break;
      }
      default:
        break;
    }
  }
  
  this.loadPage = function(aPageValue)
  {
    var pagesList = document.getElementById("gmanager-options-listbox");
    var pageFrame = document.getElementById("gmanager-options-iframe");
    
    // Set the page value
    pagesList.value = aPageValue;
    
    // Check if the page is valid
    if (!pagesList.selectedItem)
      pagesList.selectedItem = pagesList.firstChild;
    
    // Save the page as last viewed
    gmanager_Prefs.setCharPref("options-page", pagesList.value);
    
    // Save the page preferences
    gmanager_Prefs.savePrefs(this._sandbox.global.node, pageFrame.contentDocument);
    
    // Display the page
    pageFrame.setAttribute("src", pagesList.value);
  }
  
  this.loadPagePrefs = function()
  {
    var pageIndex = document.getElementById("gmanager-options-listbox").selectedIndex;
    var pageDocument = document.getElementById("gmanager-options-iframe").contentDocument;
    
    switch (pageIndex)
    {
      case 0: // general.xul
        break;
      case 1: // accounts.xul
      {
        var accountsList = pageDocument.getElementById("gmanager-options-accounts-listbox");
        var accounts = this._sandbox.getAccounts({});
        
        // Make sure the list of accounts is empty
        while (accountsList.getRowCount() > 0)
          accountsList.removeItemAt(0);
        
        for (var i = 0, n = accounts.length; i < n; i++)
        {
          var accountSandbox = accounts[i];
          var accountReal = this._manager.getAccount(accountSandbox.email);
          var accountItem = pageDocument.createElement("listitem");
          
          accountItem.setAttribute("email", accountSandbox.email);
          accountItem.setAttribute("checked", accountSandbox.getBoolPref("general-auto-login"));
          accountItem.setAttribute("icontype", accountSandbox.type);
          accountItem.setAttribute("status", gmanager_Utils.toStyleStatus(accountReal ? accountReal.status : accountSandbox.status));
          accountItem.setAttribute("newMail", (accountReal ? accountReal.unread > 0 : false));
          
          accountsList.appendChild(accountItem);
        }
        
        break;
      }
      case 2: // compose.xul
      {
        // Populate the accounts
        this._populateAccounts(pageDocument.getElementById("gm-prefs-compose-mailto-default"));
        
        break;
      }
      case 3: // security.xul
        break;
      case 4: // toolbar.xul
        break;
      case 5: // notifications.xul
        break;
      case 6: // help.xul
      {
        var contributorsPopup = pageDocument.getElementById("gmanager-options-help-contributors-popup");
        var randomIndex = Math.floor(Math.random() * contributorsPopup.childNodes.length);
        
        // Select the random contributor
        contributorsPopup.parentNode.selectedIndex = randomIndex;
        
        break;
      }
      case 7: // debug.xul
      {
        var accountsPopup = pageDocument.getElementById("gmanager-options-debug-accounts-popup");
        var accounts = this._sandbox.getAccounts({});
        
        // Populate the accounts
        this._populateAccounts(accountsPopup);
        
        if (accounts.length > 0)
        {
          var menuSeparator = document.createElement("menuseparator");
          accountsPopup.insertBefore(menuSeparator, accountsPopup.firstChild);
          
          var menuItem = document.createElement("menuitem");
          menuItem.setAttribute("label", "<No account selected>");
          accountsPopup.insertBefore(menuItem, accountsPopup.firstChild);
        }
        
        break;
      }
      default:
        break;
    }
    
    // Load the page preferences
    gmanager_Prefs.loadPrefs(this._sandbox.global.node, pageDocument);
    
    // Update the page preferences
    this.command();
  }
  
  this._populateAccounts = function(aPopup)
  {
    // Check if the popup is specified
    if (aPopup)
    {
      var accounts = this._sandbox.getAccounts({});
      
      // Clear the menu items
      gmanager_Utils.clearKids(aPopup);
      
      if (accounts.length > 0)
      {
        for (var i = 0, n = accounts.length; i < n; i++)
        {
          // Create the email menu item
          var emailItem = document.createElement("menuitem");
          emailItem.setAttribute("label", accounts[i].email);
          emailItem.setAttribute("value", accounts[i].email);
          aPopup.appendChild(emailItem);
        }
      }
      else
      {
        var emailItem = document.createElement("menuitem");
        emailItem.setAttribute("label", this.getString("no-accounts"));
        aPopup.appendChild(emailItem);
      }
      
      // Select the first menu item
      aPopup.parentNode.selectedItem = aPopup.firstChild;
    }
  }
  
  this.importPrefs = function()
  {
    var file = this._selectFile("import");
    if (file)
    {
      if (this._sandbox.importPrefs(file))
      {
        // Update the page preferences
        this.loadPagePrefs();
        
        alert(this.getString("import-success"));
      }
      else
        alert(this.getString("import-error"));
    }
  }
  
  this.exportPrefs = function()
  {
    var file = this._selectFile("export");
    if (file)
    {
      var success = this._sandbox.exportPrefs(file);
      
      if (success)
        alert(this.getString("export-success"));
    }
  }
  
  this._selectFile = function(aMode)
  {
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    
    switch (aMode)
    {
      case "export":
        filePicker.init(window, this.getString("export"), nsIFilePicker.modeSave);
        break;
      case "import":
        filePicker.init(window, this.getString("import"), nsIFilePicker.modeOpen);
        break;
    }
    
    filePicker.appendFilter(this.getFString("xml-files", [this.FILTER_TYPE_XML]), this.FILTER_TYPE_XML);
    filePicker.show();
    
    return filePicker.file;
  }
  
  this.selectAccount = function()
  {
    var pageDocument = document.getElementById("gmanager-options-iframe").contentDocument;
    var accountsList = pageDocument.getElementById("gmanager-options-accounts-listbox");
    
    pageDocument.getElementById("gmanager-options-accounts-move-up-button").disabled = (accountsList.selectedIndex == 0)
    pageDocument.getElementById("gmanager-options-accounts-move-down-button").disabled = (accountsList.selectedIndex == (accountsList.getRowCount() - 1));
    pageDocument.getElementById("gmanager-options-accounts-modify-button").disabled = (accountsList.selectedCount == 0);
    pageDocument.getElementById("gmanager-options-accounts-remove-button").disabled = (accountsList.selectedCount == 0);
  }
  
  this.accountsAdd = function()
  {
    window.openDialog("chrome://gmanager/content/options/dialogs/account.xul", "account", "centerscreen,chrome,modal", this._sandbox);
    
    this.loadPagePrefs();
  }
  
  this.accountsModify = function()
  {
    var pageDocument = document.getElementById("gmanager-options-iframe").contentDocument;
    var accountItem = pageDocument.getElementById("gmanager-options-accounts-listbox").selectedItem;
    
    if (accountItem)
    {
      window.openDialog("chrome://gmanager/content/options/dialogs/account.xul", "account", "centerscreen,chrome,modal", this._sandbox, accountItem.email);
      
      this.loadPagePrefs();
    }
  }
  
  this.accountsRemove = function()
  {
    var pageDocument = document.getElementById("gmanager-options-iframe").contentDocument;
    var accountItem = pageDocument.getElementById("gmanager-options-accounts-listbox").selectedItem;
    
    if (accountItem)
    {
      var email = accountItem.email;
      
      if (confirm(this.getFString("remove-account", [email])))
      {
        // Remove the account
        this._sandbox.removeAccount(email);
        
        // Remove the account from the list
        accountItem.parentNode.removeChild(accountItem);
      }
    }
  }
  
  this.helpVisitSite = function()
  {
    var pageDocument = document.getElementById("gmanager-options-iframe").contentDocument;
    var contributorItem = pageDocument.getElementById("gmanager-options-help-contributors-list").selectedItem;
    
    if (contributorItem && contributorItem.hasAttribute("site"))
      gmanager_Utils.loadSimpleURI(contributorItem.getAttribute("site"));
  }
  
  this.debugMigrate = function()
  {
    var logins = gmanager_Utils.getStoredLogins("https://www.google.com", "https://www.google.com", null);
    window.openDialog("chrome://gmanager/content/migrate/migrate.xul", "migrate", "centerscreen,chrome,modal,resizable", logins);
  }
  
  this.debugLogin = function()
  {
    var pageDocument = document.getElementById("gmanager-options-iframe").contentDocument;
    var accountItem = pageDocument.getElementById("gmanager-options-debug-accounts-popup").parentNode.selectedItem;
    var account = this._manager.getAccount(accountItem.label);
    gmanager_Utils.showLogin(account);
  }
  
  this.debugAlert = function()
  {
    var pageDocument = document.getElementById("gmanager-options-iframe").contentDocument;
    var accountItem = pageDocument.getElementById("gmanager-options-debug-accounts-popup").parentNode.selectedItem;
    gmanager_Alerts.display(accountItem.label);
  }
  
  this.dialogAccept = function()
  {
    // Save the page preferences
    var pageDocument = document.getElementById("gmanager-options-iframe").contentDocument;
    gmanager_Prefs.savePrefs(this._sandbox.global.node, pageDocument);
    
    // Save the preferences
    this._sandbox.save();
    
    // Load the preferences
    this._manager.load();
    
    // Notify observers that the preferences have changed
    var observer = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    observer.notifyObservers(null, gmanager_Prefs.NOTIFY_CHANGED, null);
    
    // Close the window
    return true;
  }
}