// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Prefs = new function()
{
  var gmPrefs = Object.create(new gmanager_BundlePrefix("gmanager-prefs-"));
  
  gmPrefs.NOTIFY_CHANGED = "gmanager-prefs-notify-changed";
  gmPrefs.ELEMENT_PREFIX = "gm-prefs-";
  gmPrefs.BRANCH = "extensions.gmanager.";
  
  gmPrefs.init = function()
  {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    gmPrefs._prefBranch = prefService.getBranch(gmPrefs.BRANCH);
  }
  
  gmPrefs.hasPref = function(aName)
  {
    return gmPrefs._prefBranch.prefHasUserValue(aName);
  }
  
  gmPrefs.getBoolPref = function(aName)
  {
    return gmPrefs._prefBranch.getBoolPref(aName);
  }
  
  gmPrefs.setBoolPref = function(aName, aValue)
  {
    gmPrefs._prefBranch.setBoolPref(aName, aValue);
  }
  
  gmPrefs.getCharPref = function(aName)
  {
    return gmPrefs._prefBranch.getCharPref(aName);
  }
  
  gmPrefs.setCharPref = function(aName, aValue)
  {
    gmPrefs._prefBranch.setCharPref(aName, aValue);
  }
  
  gmPrefs.getIntPref = function(aName)
  {
    return gmPrefs._prefBranch.getIntPref(aName);
  }
  
  gmPrefs.setIntPref = function(aName, aValue)
  {
    gmPrefs._prefBranch.setIntPref(aName, aValue);
  }
  
  gmPrefs.loadPrefs = function(aNode, aDocument)
  {
    var prefs = aNode.getElementsByTagName("pref");
    
    for (var i = 0, n = prefs.length; i < n; i++)
    {
      var element = aDocument.getElementById(gmPrefs.ELEMENT_PREFIX + prefs[i].getAttribute("id"));
      
      if (element)
      {
        var value = prefs[i].getAttribute("value");
        
        switch (element.localName)
        {
          case "checkbox":
            element.checked = (value === "true");
            break;
          case "menupopup":
            element.parentNode.value = value;
            
            if (element.parentNode.selectedItem === null)
            {
              // TODO Remove; Obsolete in Firefox 3.6 (Gecko 1.9.2)
              
              if (value === "addon-bar")
                element.parentNode.value = "status-bar";
              
              if (element.parentNode.selectedItem === null)
                element.parentNode.selectedItem = element.firstChild;
            }
            
            break;
          case "radiogroup":
          case "textbox":
            element.value = value;
            break;
          default:
            break;
        }
      }
    }
  }
  
  gmPrefs.savePrefs = function(aNode, aDocument)
  {
    var prefs = aNode.getElementsByTagName("pref");
    
    for (var i = 0, n = prefs.length; i < n; i++)
    {
      var element = aDocument.getElementById(gmPrefs.ELEMENT_PREFIX + prefs[i].getAttribute("id"));
      
      if (element)
      {
        switch (element.localName)
        {
          case "checkbox":
            prefs[i].setAttribute("value", element.checked);
            break;
          case "menupopup":
            prefs[i].setAttribute("value", element.parentNode.value);
            break;
          case "radiogroup":
          case "textbox":
            prefs[i].setAttribute("value", element.value);
            break;
          default:
            break;
        }
      }
    }
  }
  
  gmPrefs.init();

  return gmPrefs;
}