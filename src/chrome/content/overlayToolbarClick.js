// Gmail Manager NG
// Erik Nedwidek (http://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_ToolbarClick = new function()
{
  this.click = function(aEvent)
  {
    var toolbarItem = aEvent.target;
    
    if (aEvent.button !== 2 && gmanager_Toolbars.isToolbarItem(toolbarItem))
    {
      var account = toolbarItem.displayAccount;
      
      if (account)
      {
        var manager = Components.classes["@hatterassoftware.com/gmanager/manager;1"].getService(Components.interfaces.gmIManager);
        var action = null;
        
        switch (aEvent.button)
        {
          case 0: // Left Click
            action = manager.global.getCharPref("toolbar-left-click");
            break;
          case 1: // Middle Click
            action = manager.global.getCharPref("toolbar-middle-click");
            break;
          default:
            break;
        }
        
        switch (action)
        {
          case "check-messages":
            // Check if the account is logged in
            if (account.loggedIn)
              account.check();
            else
              account.login(null);
            
            break;
          case "compose-message":
            gmanager_Accounts.openCompose(account.email, manager.global.getCharPref("compose-tab-location"), null);
            break;
          case "blank":
          case "current":
          case "existing":
          case "focused":
          case "background":
          case "window":
          {
            // Check if the account is logged in
            if (account.loggedIn)
              gmanager_Accounts.openFolder(account.email, action);
            else
              account.login(null);
            
            break;
          }
          default:
            break;
        }
      }
      else
        window.openDialog("chrome://gmanager/content/login/login.xul", "login", "centerscreen,chrome,modal");
    }
    
    return true;
  }
}