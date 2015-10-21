// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Login = new function()
{
  var gmLogin = Object.create(new gmanager_BundlePrefix("gmanager-login-"));
  
  gmLogin.load = function()
  {
    // Unwrap the window arguments; if available
    if (window.arguments)
    {
      // window.arguments[0] : mail account
      
      gmLogin._account = window.arguments[0];
    }
    
    // Check if the account is specified
    if (gmLogin._account)
    {
      var password = gmLogin._account.password;
      
      document.getElementById("gmanager-login-email").disabled = true;
      document.getElementById("gmanager-login-email").value = gmLogin._account.email;
      document.getElementById("gmanager-login-password").value = (password ? password : "");
      document.getElementById("gmanager-login-remember").checked = (password && password !== "");
    }
    
    gmLogin.input();
  }
  
  gmLogin.input = function()
  {
    document.getElementById("gmanager-login-password").disabled = (document.getElementById("gmanager-login-email").value === "");
    document.getElementById("gmanager-login-remember").disabled = (document.getElementById("gmanager-login-password").value === "");
  }
  
  gmLogin.dialogAccept = function()
  {
    const passwordRegExp = /^\s*$/;
    
    var errors = [];
    var email = document.getElementById("gmanager-login-email").value;
    var password = document.getElementById("gmanager-login-password").value;
    
    // Check if the email is valid
    if (!gmanager_Utils.isEmail(email))
      errors.push(gmLogin.getString("valid-email"));
    
    // Check if the password is valid
    if (passwordRegExp.test(password))
      errors.push(gmLogin.getString("valid-password"));
    
    // Check if there were any errors
    if (errors.length > 0)
    {
      // Display the error message
      alert(errors.join("\n"));
    }
    else
    {
      var manager = Components.classes["@hatterassoftware.com/gmanager/manager;1"].getService(Components.interfaces.gmIManager);
      var account = (gmLogin._account ? gmLogin._account : manager.getAccount(email));
      
      // Check if the account does not exist
      if (account === null)
      {
        // Create the account
        account = manager.addAccount("gmail", email, email, null, null);
        
        // Prompt the user to add the account
        if (confirm(gmLogin.getString("email-doesnt-exist")))
        {
          // Save the accounts
          manager.save();
        }
        
        // Notify observers that preferences have changed
        var observer = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        observer.notifyObservers(null, "gmanager-prefs-notify-changed", null);
      }
      
      // Check if the account exists
      if (account)
      {
        // Check if the password should be saved
        if (document.getElementById("gmanager-login-remember").checked)
          account.savePassword(password);
        else
          account.removePassword();
        
        // Login to the account (supply the password since it may not be saved)
        account.login(password);
        
        // Close the dialog
        return true;
      }
    }
    
    // Keep the dialog open
    return false;
  }

  return gmLogin;
}