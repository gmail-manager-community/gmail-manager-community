// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Prefs = new function() {
  gmanager_BundlePrefix.call(this, "gmanager-prefs-");

  this.NOTIFY_CHANGED = "gmanager-prefs-notify-changed";
  this.ELEMENT_PREFIX = "gm-prefs-";
  this.BRANCH = "extensions.gmanager.";

  this.init = function() {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    this._prefBranch = prefService.getBranch(this.BRANCH);
  };

  this.hasPref = function(aName) {
    return this._prefBranch.prefHasUserValue(aName);
  };

  this.getBoolPref = function(aName) {
    return this._prefBranch.getBoolPref(aName);
  };

  this.setBoolPref = function(aName, aValue) {
    this._prefBranch.setBoolPref(aName, aValue);
  };

  this.getCharPref = function(aName) {
    return this._prefBranch.getCharPref(aName);
  };

  this.setCharPref = function(aName, aValue) {
    this._prefBranch.setCharPref(aName, aValue);
  };

  this.getIntPref = function(aName) {
    return this._prefBranch.getIntPref(aName);
  };

  this.setIntPref = function(aName, aValue) {
    this._prefBranch.setIntPref(aName, aValue);
  };

  this.loadPrefs = function(aNode, aDocument) {
    var prefs = aNode.getElementsByTagName("pref");

    for (var i = 0, n = prefs.length; i < n; i++) {
      var element = aDocument.getElementById(this.ELEMENT_PREFIX + prefs[i].getAttribute("id"));

      if (element) {
        var value = prefs[i].getAttribute("value");

        switch (element.localName) {
          case "checkbox":
            element.checked = (value === "true");
            break;
          case "menupopup":
            element.parentNode.value = value;

            if (element.parentNode.selectedItem === null) {
              // TODO Remove; Obsolete in Firefox 3.6 (Gecko 1.9.2)

              if (value === "nav-bar") {
                element.parentNode.value = "status-bar";
              }

              if (element.parentNode.selectedItem === null) {
                element.parentNode.selectedItem = element.firstChild;
              }
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
  };

  this.savePrefs = function(aNode, aDocument) {
    var prefs = aNode.getElementsByTagName("pref");

    for (var i = 0, n = prefs.length; i < n; i++) {
      var element = aDocument.getElementById(this.ELEMENT_PREFIX + prefs[i].getAttribute("id"));

      if (element) {
        switch (element.localName) {
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
  };

  this.init();
};

gmanager_Prefs.prototype = Object.create(gmanager_BundlePrefix.prototype);
gmanager_Prefs.prototype.constructor = gmanager_Prefs;