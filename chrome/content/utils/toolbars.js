// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Toolbars = new function()
{
  this.TOOLBARS = ["toolbar", "statusbar"];
  this.TOOLBAR_ITEM_ID = "gmanager-toolbar-item";
  
  this.init = function()
  {
    // Load the accounts manager
    this._manager = Components.classes["@gmail-manager-community.github.com/gmanager/manager;1"].getService(Components.interfaces.gmIManager);
  };
  
  this.getToolbars = function()
  {
    var toolbars = [];
    var doc = gmanager_Utils.getDocument();
    
    this.TOOLBARS.forEach(function(toolbar, index, array) {
      var toolbarElements = doc.getElementsByTagName(toolbar);
      for (var i = 0; i < toolbarElements.length; i++) {
        toolbars.push(toolbarElements[i]);
      }
    });
    
    return toolbars;
  };
  
  this.getDefaultToolbar = function()
  {
    var toolbar = document.getElementById("addon-bar");
    
    // TODO Remove; Obsolete in Firefox 3.6 (Gecko 1.9.2)
    
    if (toolbar === null) {
      toolbar = document.getElementById("status-bar");
    }
    
    return toolbar;
  };
  
  this.getToolbarItemId = function(/* Optional */ aEmail)
  {
    return this.TOOLBAR_ITEM_ID + (aEmail ? "-" + aEmail : "");
  };
  
  this.isToolbarItem = function(aNode)
  {
    const idRegExp = new RegExp("^" + this.TOOLBAR_ITEM_ID, "i");
    return (aNode && aNode instanceof Node && idRegExp.test(aNode.getAttribute("id")));
  };
  
  this.getToolbarItem = function(/* Optional */ aEmail)
  {
    // Return the toolbar item
    return document.getElementById(this.getToolbarItemId(aEmail));
  };
  
  this.createToolbarItem = function(/* Optional */ aEmail)
  {
    // Create the toolbaritem element
    var toolbarItem = document.createElement("toolbaritem");
    toolbarItem.className += " gmanager-account-info";
    
    // Initialize the XBL bindings
    document.documentElement.appendChild(toolbarItem);
    
    // Check if the account exists
    if (this._manager.isAccount(aEmail)) {
      // Set the referenced account
      toolbarItem.account = this._manager.getAccount(aEmail);
    } else {
      var defaultToolbar = this.getDefaultToolbar();
      
      // Set the toolbar item id
      toolbarItem.id = this.TOOLBAR_ITEM_ID;
      
      if (defaultToolbar) {
        defaultToolbar.appendChild(toolbarItem);
      }
    }
    
    // Return the toolbar item
    return toolbarItem;
  };
  
  this.init();
};