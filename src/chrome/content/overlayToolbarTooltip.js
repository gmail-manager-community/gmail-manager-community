// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_ToolbarTooltip = new function()
{
  this.__proto__ = new gmanager_BundlePrefix("gmanager-toolbar-tooltip-");
  
  this.buildTooltip = function(aTooltip)
  {
    var toolbarItem = aTooltip.parentNode.parentNode;
    
    // Clear the menu
    gmanager_Utils.clearKids(aTooltip);
    
    if (gmanager_Toolbars.isToolbarItem(toolbarItem))
    {
      var account = toolbarItem.displayAccount;
      var hasDetails = false;
      
      // Check if the account exists
      if (account)
      {
        // Account Header
        aTooltip.appendChild(this._buildAccountHeader(account));
        
        // Check if the account is logged in
        hasDetails = account.loggedIn;
      }
      
      if (hasDetails)
      {
        // Account Details
        aTooltip.appendChild(this._buildAccountDetails(account));
      }
      else
      {
        // Account Status
        aTooltip.appendChild(this._buildAccountStatus(account));
      }
    }
    
    // Show the tooltip
    return true;
  }
  
  this._createLabel = function(aValue)
  {
    var label = document.createElement("label");
    label.setAttribute("value", aValue);
    return label;
  }
  
  this._buildAccountHeader = function(aAccount)
  {
    var elParent = document.createElement("hbox");
    elParent.setAttribute("id", "gmanager-tooltip-header");
    
    // Status Icon
    var el = document.createElement("image");
    el.setAttribute("class", "gmanager-icon");
    el.setAttribute("iconsize", "small");
    el.setAttribute("icontype", aAccount.type);
    el.setAttribute("status", gmanager_Utils.toStyleStatus(aAccount.status));
    el.setAttribute("newMail", (aAccount.unread > 0 ? "true" : "false"));
    elParent.appendChild(el);
    
    // Account Email
    el = this._createLabel(gmanager_Utils.toUnicode(aAccount.alias));
    el.setAttribute("class", "gmanager-bold");
    elParent.appendChild(el);
    
    var bundleKey = null;
    
    if (aAccount.status === Components.interfaces.gmIService.STATE_CONNECTING)
      bundleKey = (aAccount.loggedIn ? "checking-mail" : "logging-in");
    else
      bundleKey = (aAccount.loggedIn ? "logged-in" : "logged-out");
    
    // Account Status
    elParent.appendChild(this._createLabel(this.getString(bundleKey)));
    
    return elParent;
  }
  
  this._buildAccountDetails = function(aAccount)
  {
    var elParent = document.createElement("vbox");
    elParent.setAttribute("id", "gmanager-tooltip-details");
    
    // Important Unread
    var el = this._createLabel(this.getFString("important-unread", [aAccount.wrappedJSObject.importantUnread]));
    el.setAttribute("flex", "1");
    el.setAttribute("hidden", (aAccount.wrappedJSObject.importantUnread === 0));
    elParent.appendChild(el);

    // Inbox Unread
    el = this._createLabel(this.getFString("inbox-unread", [aAccount.inboxUnread]));
    el.setAttribute("flex", "1");
    elParent.appendChild(el);
    
    // Saved Drafts
    el = this._createLabel(this.getFString("saved-drafts", [aAccount.savedDrafts]));
    el.setAttribute("hidden", (aAccount.savedDrafts === 0));
    elParent.appendChild(el);
    
    // Spam Unread
    el = this._createLabel(this.getFString("spam-unread", [aAccount.spamUnread]));
    el.setAttribute("hidden", (aAccount.spamUnread === 0));
    elParent.appendChild(el);
    
    // TODO Add option to show/hide labels
    
    if (true)
    {
      var elGrid = document.createElement("grid");
      var elRows = document.createElement("rows");
      var labels = aAccount.getLabels({});
      
      labels.forEach(function(label, index, array) {
        var isUnread = (label.unread > 0);
        var elRow = document.createElement("row");
        elRow.setAttribute("align", "center");
        elRow.setAttribute("class", (isUnread ? "gmanager-bold" : ""));
        
        // Label Name
        elRow.appendChild(this._createLabel(label.name));
        
        // Label Unread
        elRow.appendChild(this._createLabel(label.unread));
        
        // TODO Add option to show/hide labels with unread mail
        
        if (isUnread || !aAccount.getBoolPref("toolbar-tooltip-show-labels"))
          elRows.appendChild(elRow);
      }, this);
      
      if (elRows.hasChildNodes())
      {
        elGrid.appendChild(elRows);
        elParent.appendChild(elGrid);
      }
    }
    
    // Space Used
    elParent.appendChild(this._createLabel(this.getFString("space-used", [aAccount.spaceUsed, aAccount.percentUsed, aAccount.totalSpace])));
    
    if (aAccount.getBoolPref("toolbar-tooltip-show-snippets"))
    {
      // Snippets
      var snippets = aAccount.getSnippets({});
      
      if (snippets.length > 0)
      {
        // Separator
        el = document.createElement("separator");
        el.setAttribute("class", "groove");
        elParent.appendChild(el);
        
        // TODO Add option for number of snippets to show
        
        for (var i = 0, n = Math.min(10, snippets.length); i < n; i++)
        {
          var elVbox = document.createElement("vbox");
          elVbox.setAttribute("class", "gmanager-tooltip-details-snippet");
          
          var elHbox = document.createElement("hbox");
          elHbox.setAttribute("flex", "1");
          
          el = this._createLabel(gmanager_Utils.toUnicode(snippets[i].from) + " > " + gmanager_Utils.toUnicode(snippets[i].subject));
          el.setAttribute("crop", "end");
          el.setAttribute("flex", "1");
          el.setAttribute("class", "gmanager-bold");
          elHbox.appendChild(el);
          
          el = this._createLabel(gmanager_Utils.toUnicode(snippets[i].date));
          el.setAttribute("class", "gmanager-bold");
          elHbox.appendChild(el);
          elVbox.appendChild(elHbox);
          
          el = document.createElement("description");
          el.setAttribute("crop", "end");
          el.setAttribute("value", gmanager_Utils.toUnicode(snippets[i].msg));
          elVbox.appendChild(el);
          
          elParent.appendChild(elVbox);
        }
      }
    }
    
    return elParent;
  }
  
  this._buildAccountStatus = function(/* Optional */ aAccount)
  {
    var bundleKey = "msg-logged-out";
    
    // Check if the account is specified
    if (aAccount)
    {
      switch (aAccount.status)
      {
        case Components.interfaces.gmIService.STATE_CONNECTING:
          bundleKey = "msg-connecting";
          break;
        case Components.interfaces.gmIService.STATE_ERROR_PASSWORD:
          bundleKey = "msg-error-password";
          break;
        case Components.interfaces.gmIService.STATE_ERROR_NETWORK:
          bundleKey = "msg-error-network";
          break;
        case Components.interfaces.gmIService.STATE_ERROR_TIMEOUT:
          bundleKey = "msg-error-timeout";
          break;
      }
    }
    
    var elParent = document.createElement("vbox");
    elParent.setAttribute("id", "gmanager-tooltip-details");
    
    var bundleStrings = this.getString(bundleKey).split("|");
    for (var i = 0, n = bundleStrings.length; i < n; i++)
      elParent.appendChild(this._createLabel(bundleStrings[i]));
    
    return elParent;
  }
}