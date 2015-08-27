// Gmail Manager NG
// Erik Nedwidek (http://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Bundle = new function()
{
  this.PROPERTIES = "chrome://gmanager/locale/gmanager.properties";
  
  this.init = function()
  {
    var bundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
    if (bundleService)
      this._bundle = bundleService.createBundle(this.PROPERTIES);
  }
  
  this.getString = function(aName)
  {
    try {
      return this._bundle.GetStringFromName(aName);
    } catch(e) {
      gmanager_Utils.log("Error getting bundled string: " + e);
      return aName;
    }
  }
  
  this.getFString = function(aName, aParams)
  {
    try {
      return this._bundle.formatStringFromName(aName, aParams, aParams.length);
    } catch(e) {
      gmanager_Utils.log("Error getting bundled string: " + e);
      return aName;
    }
  }
  
  this.init();
}

var gmanager_BundlePrefix = function(aPrefix)
{
  this.PREFIX = aPrefix;
  
  this.getString = function(aKey)
  {
    return gmanager_Bundle.getString(this.PREFIX + aKey);
  }
  
  this.getFString = function(aKey, aParams)
  {
    return gmanager_Bundle.getFString(this.PREFIX + aKey, aParams);
  }
}