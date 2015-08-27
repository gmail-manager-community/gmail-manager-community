// Gmail Manager NG
// Erik Nedwidek (http://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Alerts = new function()
{
  this.NOTIFY_ALERT_CLICKED  = "gmanager-alert-notify-clicked";
  this.NOTIFY_ALERT_FINISHED = "gmanager-alert-notify-finished";
  
  this.ALERT_WINDOW_NAME = "gmanager-alert";
  
  this.display = function(aEmail)
  {
    if (this._emails == null)
      this._emails = [];
    
    var emailsRegExp = new RegExp("^(?:" + this._emails.join("|") + ")$", "i");
    
    if (!emailsRegExp.test(aEmail))
    {
      this._emails.push(aEmail);
      
      if (!gmanager_Utils.isWindow(this.ALERT_WINDOW_NAME))
        this._displayNext();
    }
  }
  
  this._displayNext = function()
  {
    if (this._emails.length > 0)
    {
      var manager = Components.classes["@hatterassoftware.com/gmanager/manager;1"].getService(Components.interfaces.gmIManager);
      
      this._email = this._emails.shift();
      
      if (manager.isAccount(this._email))
        window.openDialog("chrome://gmanager/content/alert/alert.xul", this.ALERT_WINDOW_NAME, "chrome,dialog=yes,titlebar=no,popup=yes", manager.getAccount(this._email), this);
      else
        this._displayNext();
    }
  }
  
  this.observe = function(aSubject, aTopic, aData)
  {
    switch (aTopic)
    {
      case this.NOTIFY_ALERT_CLICKED:
      {
        // aSubject : null
        // aTopic   : gmanager_Alerts.NOTIFY_ALERT_CLICKED
        // aData    : snippet id (e.g. 12dca68e5a1f041e)
        
        // Load the account message
        gmanager_Accounts.openMessage(this._email, "background", aData);
        
        break;
      }
      case this.NOTIFY_ALERT_FINISHED:
      {
        // aSubject : null
        // aTopic   : gmanager_Alerts.NOTIFY_ALERT_FINISHED
        // aData    : email (e.g. longfocus@gmail.com)
        
        // Display the next alert (if available)
        this._displayNext();
        
        break;
      }
      default:
      {
        gmanager_Utils.log("Unknown state...definitely should not be here!");
        break;
      }
    }
  }
}