// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

const GM_CLASS_NAME = "Logger Service";
const GM_CLASS_ID = Components.ID("{07d9b512-8e83-418a-a540-0ec804b82195}");
const GM_CONTRACT_ID = "@gmail-manager-community.github.com/gmanager/logger;1";

function gmLogger() {
  // Load the console service
  this._console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

  // Load the preference branch observer
  var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
  this._branch = prefService.getBranch("extensions.gmanager.").QueryInterface(Components.interfaces.nsIPrefBranchInternal);
  this._branch.addObserver("", this, false);

  // Get the current debug preference value (silent)
  this._debug = this._branch.getBoolPref("debug");
}

gmLogger.prototype = {
  _console: null,
  _branch: null,
  _debug: false,

  log: function(aMsg) {
    // Check if debug is enabled
    if (this._debug) {
      // Log the message to the console
      this._console.logStringMessage("gmanager: " + aMsg);
    }
  },

  _toggle: function() {
    // Get the current debug preference value
    this._debug = this._branch.getBoolPref("debug");

    // Display the logging status
    this._console.logStringMessage("gmanager: " + "Logging has been " + (this._debug ? "enabled" : "disabled"));
  },

  observe: function(aSubject, aTopic, aData) {
    if (aTopic == "nsPref:changed") {
      switch (aData) {
        case "debug":
          // Toggle the logging status
          this._toggle();
          break;
      }
    }
  },

  classDescription: GM_CLASS_NAME,
  classID: GM_CLASS_ID,
  contractID: GM_CONTRACT_ID,

//  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.gmILogger]),

  QueryInterface: function(aIID) {
    if (aIID.equals(Components.interfaces.gmILogger) ||
        aIID.equals(Components.interfaces.nsISupports)) {
      return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
  }
};

if (Components.utils && Components.utils.import) {
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

  if (XPCOMUtils.generateNSGetFactory) {
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([gmLogger]);
  }
  //else {
  //  var NSGetModule = XPCOMUtils.generateNSGetModule([gmLogger]);
  //}
}

// TODO Remove; Obsolete in Firefox 2 (Gecko 1.8.1)

const gmanager_Factory = {
  createInstance: function(aOuter, aIID) {
    if (aOuter != null) {
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    }

    return (new gmLogger()).QueryInterface(aIID);
  }
};

const gmanager_Module = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType) {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(
      GM_CLASS_ID,
      GM_CLASS_NAME,
      GM_CONTRACT_ID,
      aFileSpec,
      aLocation,
      aType);
  },

  unregisterSelf: function(aCompMgr, aFileSpec, aLocation) {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(
      GM_CLASS_ID,
      aFileSpec);
  },

  getClassObject: function(aCompMgr, aCID, aIID) {
    if (aCID.equals(GM_CLASS_ID)) {
      return gmanager_Factory;
    }

    if (!aIID.equals(Components.interfaces.nsIFactory)) {
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    }

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) {
    return true;
  }
};

function NSGetModule(aCompMgr, aFileSpec) {
  return gmanager_Module;
}