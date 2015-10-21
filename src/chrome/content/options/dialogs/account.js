// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_OptionsAccount = new function()
{
  var gmOptionsAccount = Object.create(new gmanager_BundlePrefix("gmanager-options-"));
  
  gmOptionsAccount.load = function()
  {
    // Unwrap the window arguments; if available
    if (window.arguments)
    {
      // window.arguments[0] : manager
      // window.arguments[1] : email
      
      gmOptionsAccount._manager = window.arguments[0];
      gmOptionsAccount._email = window.arguments[1];
      
      // Check if the account exists
      if (gmOptionsAccount._manager.isAccount(gmOptionsAccount._email))
        gmOptionsAccount._account = gmOptionsAccount._manager.getAccount(gmOptionsAccount._email);
      else
        gmOptionsAccount._account = gmOptionsAccount._manager.defaultAccount;
    }
    
    // Check if the account is specified
    if (gmOptionsAccount._account == null)
    {
      // Close the dialog
      window.close();
    }
    
    var toolbar = document.getElementById("gm-prefs-toolbar-toolbar-id");
    var toolbars = gmanager_Toolbars.getToolbars();
    
    for (var i = 0, n = toolbars.length; i < n; i++)
    {
      var menuitem = document.createElement("menuitem");
      menuitem.setAttribute("label", toolbars[i].id);
      menuitem.setAttribute("value", toolbars[i].id);
      toolbar.appendChild(menuitem);
    }
    
    // Display the email (if available)
    document.getElementById("gmanager-options-account-email").value = gmOptionsAccount._account.email;
    document.getElementById("gmanager-options-account-email").disabled = gmOptionsAccount._email;
    
    // Display the alias
    var alias = gmOptionsAccount._account.node.getAttribute("alias");
    document.getElementById("gmanager-options-account-alias").value = (alias ? alias : "");
    
    // Display the password
    var password = gmOptionsAccount._account.node.getAttribute("password");
    document.getElementById("gmanager-options-account-password").value = (password ? password : "");
    
    // Load the page preferences
    gmanager_Prefs.loadPrefs(gmOptionsAccount._account.node, document);
    
    gmOptionsAccount.input();
  }
  
  gmOptionsAccount.input = function()
  {
    // Account
    document.getElementById("gmanager-options-account-alias").disabled = (document.getElementById("gmanager-options-account-email").value === "");
    document.getElementById("gmanager-options-account-password").disabled = (document.getElementById("gmanager-options-account-email").value === "");
    
    // Toolbar display
    var isToolbar = document.getElementById("gm-prefs-toolbar-display").checked;
    document.getElementById("gm-prefs-toolbar-toolbar-id").parentNode.disabled = !isToolbar;
    document.getElementById("gm-prefs-toolbar-placement").disabled = !isToolbar;
    document.getElementById("gm-prefs-toolbar-specific-position").disabled = (!isToolbar || document.getElementById("gm-prefs-toolbar-placement").value !== "specific-position");
    
    // Check messages
    var isCheck = document.getElementById("gm-prefs-notifications-check").checked;
    document.getElementById("gm-prefs-notifications-check-interval").disabled = !isCheck;
    
    // Sounds
    var isSound = document.getElementById("gm-prefs-notifications-sounds").checked;
    document.getElementById("gm-prefs-notifications-sounds-file").disabled = !isSound;
    document.getElementById("gm-prefs-notifications-sound-browse").disabled = !isSound;
    document.getElementById("gm-prefs-notifications-sound-preview").disabled = (!isSound || (isSound && document.getElementById("gm-prefs-notifications-sounds-file").value === ""));
  }
  
  gmOptionsAccount.selectSoundFile = function()
  {
    var path = gmanager_Sounds.selectFile();
    if (path)
      document.getElementById("gm-prefs-notifications-sounds-file").value = path;
  }
  
  gmOptionsAccount.previewSoundFile = function()
  {
    gmanager_Sounds.play(document.getElementById("gm-prefs-notifications-sounds-file").value);
  }
  
  gmOptionsAccount.dialogAccept = function()
  {
    var email = document.getElementById("gmanager-options-account-email").value;
    var alias = document.getElementById("gmanager-options-account-alias").value;
    var password = document.getElementById("gmanager-options-account-password").value;
    
    // Check if the email is valid
    if (!gmanager_Utils.isEmail(email))
    {
      // The email is not valid
      alert(gmanager_Bundle.getString("gmanager-login-valid-email"));
      
      // Keep the dialog open
      return false;
    }
    
    // Save the page preferences
    gmanager_Prefs.savePrefs(gmOptionsAccount._account.node, document);
    
    if (gmOptionsAccount._account && gmOptionsAccount._email)
    {
      // Update the account alias and password
      gmOptionsAccount._account.node.setAttribute("alias", alias);
      gmOptionsAccount._account.node.setAttribute("password", password);
    }
    else
    {
      // Create the account
      var account = gmOptionsAccount._manager.addAccount("gmail", email, alias, password, gmOptionsAccount._account.node);
      
      // Check if the account was created
      if (!account)
      {
        // The email already exists
        alert(gmOptionsAccount.getString("email-exists"));
        
        // Keep the dialog open
        return false;
      }
    }
    
    // Close the dialog
    return true;
  }

  return gmOptionsAccount;
}