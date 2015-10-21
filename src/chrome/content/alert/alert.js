// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Alert = new function()
{
  var gmAlert = Object.create(new gmanager_BundlePrefix("gmanager-alert-"));
  
  gmAlert.NOTIFY_ALERT_CLICKED  = "gmanager-alert-notify-clicked";
  gmAlert.NOTIFY_ALERT_FINISHED = "gmanager-alert-notify-finished";
  
  gmAlert.OPEN_STAGE  = 10;
  gmAlert.CLOSE_STAGE = 20;
  gmAlert.SLIDE_STAGE = 30;
  
  gmAlert.FINAL_HEIGHT    = 100;
  gmAlert.SLIDE_INCREMENT = 1;
  gmAlert.SLIDE_TIME      = 10;
  gmAlert.OPEN_TIME       = 2000;
  
  gmAlert._isPlaying = true;
  
  gmAlert.load = function()
  {
    // Load the services
    gmAlert._timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
    
    // Unwrap the window arguments; if available
    if (window.arguments)
    {
      // window.arguments[0] : mail account
      // window.arguments[1] : callback listener
      
      gmAlert._account = window.arguments[0];
      gmAlert._callback = window.arguments[1];
    }
    
    // Check if the account is specified
    if (gmAlert._account == null)
    {
      // Close the window
      window.close();
    }
    else
    {
      // Set the account header tooltip
      var header = document.getElementById("gmanager-alert-header");
      header.setAttribute("tooltiptext", gmAlert._account.alias);
      
      // Set the account icon
      var image = document.getElementById("gmanager-alert-header-image");
      image.setAttribute("icontype", gmAlert._account.type);
      image.setAttribute("status", gmanager_Utils.toStyleStatus(gmAlert._account.status));
      image.setAttribute("newMail", gmAlert._account.unread > 0 ? "true" : "false");
      
      // Set the account alias
      var alias = document.getElementById("gmanager-alert-header-alias");
      alias.setAttribute("value", gmAlert._account.alias);
      
      // Get the account snippets
      gmAlert._snippets = gmAlert._account.getSnippets({});
      
      // Check if the account is logged in
      if (gmAlert._account.loggedIn)
      {
        // Check if the account has any snippets
        if (gmAlert._snippets.length === 0)
        {
          // Populate error message; account must have snippets
          gmAlert._populateError(gmAlert.getString("snippets"));
        }
        else
        {
          // Populate the first snippet
          gmAlert.firstSnippet();
        }
      }
      else
      {
        // Populate error message; account must be logged in
        gmAlert._populateError(gmAlert.getString("login"));
      }
      
      try {
        var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        var prefBranch = prefService.getBranch("alerts.");
        
        if (prefBranch.prefHasUserValue("slideIncrement"))
          gmAlert.SLIDE_INCREMENT = prefBranch.getIntPref("slideIncrement");
        
        if (prefBranch.prefHasUserValue("slideIncrementTime"))
          gmAlert.SLIDE_TIME = prefBranch.getIntPref("slideIncrementTime");
        
        if (prefBranch.prefHasUserValue("totalOpenTime"))
          gmAlert.OPEN_TIME = prefBranch.getIntPref("totalOpenTime");
      } catch(e) {
        gmanager_Utils.log("Error getting the alert preferences: " + e);
      }
      
      sizeToContent();
      
      gmAlert.FINAL_HEIGHT = window.outerHeight;
      
      window.outerHeight = 1;
      window.moveTo((screen.availLeft + screen.availWidth - window.outerWidth) - 10, screen.availTop + screen.availHeight - window.outerHeight);
      
      gmAlert._startTimer(gmAlert.OPEN_STAGE, gmAlert.SLIDE_TIME);
    }
  }
  
  gmAlert.play = function(aEvent)
  {
    gmanager_Alert._isPlaying = true;
  }
  
  gmAlert.pause = function(aEvent)
  {
    gmanager_Alert._isPlaying = false;
  }
  
  gmAlert._startTimer = function(aStage, aInterval)
  {
    gmAlert._stage = aStage;
    gmAlert._timer.initWithCallback(gmAlert, aInterval, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
  }
  
  gmAlert.notify = function(aTimer)
  {
    switch (gmAlert._stage)
    {
      case gmAlert.OPEN_STAGE:
      {
        if (window.outerHeight < gmAlert.FINAL_HEIGHT)
        {
          window.screenY -= gmAlert.SLIDE_INCREMENT;
          window.outerHeight += gmAlert.SLIDE_INCREMENT;
        }
        else
          gmAlert._startTimer(gmAlert.SLIDE_STAGE, gmAlert.OPEN_TIME);
        
        break;
      }
      case gmAlert.SLIDE_STAGE:
      {
        if (gmAlert._isPlaying)
        {
          if (gmAlert._hasNext())
            gmAlert.nextSnippet();
          else
            gmAlert._startTimer(gmAlert.CLOSE_STAGE, gmAlert.SLIDE_TIME);
        }
        
        break;
      }
      case gmAlert.CLOSE_STAGE:
      {
        if (window.outerHeight > 1)
        {
          window.screenY += gmAlert.SLIDE_INCREMENT;
          window.outerHeight -= gmAlert.SLIDE_INCREMENT;
        }
        else
          gmAlert.close();
        
        break;
      }
      default:
      {
        gmanager_Utils.log("Unknown stage...definitely should not be here!");
        break;
      }
    }
  }
  
  gmAlert._populateError = function(aMsg)
  {
    document.getElementById("gmanager-alert-navigation").collapsed = true;
    document.getElementById("gmanager-alert-details").collapsed = true;
    document.getElementById("gmanager-alert-description").setAttribute("clickable", false);
    document.getElementById("gmanager-alert-description").removeAttribute("onclick");
    document.getElementById("gmanager-alert-description").firstChild.nodeValue = aMsg;
  }
  
  gmAlert._populateSnippet = function(aIndex)
  {
    var snippet = gmAlert._snippets[aIndex];
    
    // Set the snippet index
    gmAlert._snippetIndex = aIndex;
    
    document.getElementById("gmanager-alert-header-count").value = gmAlert.getFString("count", [gmAlert._snippetIndex + 1, gmAlert._snippets.length]);
    document.getElementById("gmanager-alert-details-from").value = gmanager_Utils.toUnicode(snippet.from);
    document.getElementById("gmanager-alert-details-date").value = gmanager_Utils.toUnicode(snippet.time);
    document.getElementById("gmanager-alert-details-subject").value = gmanager_Utils.toUnicode(snippet.subject);
    document.getElementById("gmanager-alert-description").firstChild.nodeValue = gmanager_Utils.toUnicode(snippet.msg);
  }
  
  gmAlert.nextSnippet = function()
  {
    if (gmAlert._hasNext())
      gmAlert._populateSnippet(gmAlert._snippetIndex + 1);
  }
  
  gmAlert.previousSnippet = function()
  {
    if (gmAlert._hasPrevious())
      gmAlert._populateSnippet(gmAlert._snippetIndex - 1);
  }
  
  gmAlert.firstSnippet = function()
  {
    gmAlert._populateSnippet(0);
  }
  
  gmAlert.lastSnippet = function()
  {
    gmAlert._populateSnippet(gmAlert._snippets.length - 1);
  }
  
  gmAlert._hasNext = function()
  {
    return (gmAlert._snippetIndex < gmAlert._snippets.length - 1);
  }
  
  gmAlert._hasPrevious = function()
  {
    return (gmAlert._snippetIndex > 0);
  }
  
  gmAlert._notifyObserver = function(aTopic, aData)
  {
    // Check if the callback listener is specified
    if (gmAlert._callback && typeof gmAlert._callback.observe === "function")
    {
      // Notify the observer about the alert
      gmAlert._callback.observe(null, aTopic, aData);
    }
  }
  
  gmAlert.click = function()
  {
    var snippet = gmAlert._snippets[gmAlert._snippetIndex];
    
    // Notify the observer that the alert was clicked
    gmAlert._notifyObserver(gmAlert.NOTIFY_ALERT_CLICKED, snippet.id);
    
    // Close the alert
    gmAlert.close();
  }
  
  gmAlert.close = function()
  {
    // Stop the timer
    gmAlert._timer.cancel();
    
    // Close the window
    window.close();
    
    // Notify the observer that the alert has finished
    gmAlert._notifyObserver(gmAlert.NOTIFY_ALERT_FINISHED, gmAlert._account.email);
  }

  return gmAlert;
}