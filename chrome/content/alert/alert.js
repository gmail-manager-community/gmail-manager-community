// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Alert = new function() {
  gmanager_BundlePrefix.call(this, "gmanager-alert-");

  this.NOTIFY_ALERT_CLICKED = "gmanager-alert-notify-clicked";
  this.NOTIFY_ALERT_FINISHED = "gmanager-alert-notify-finished";

  this.OPEN_STAGE = 10;
  this.CLOSE_STAGE = 20;
  this.SLIDE_STAGE = 30;

  this.SLIDE_INCREMENT = 1;
  this.SLIDE_TIME = 10;
  this.OPEN_TIME = 2000;

  this._isPlaying = true;

  this.load = function() {
    // Load the services
    this._timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);

    // Unwrap the window arguments; if available
    if (window.arguments) {
      // window.arguments[0] : mail account
      // window.arguments[1] : callback listener

      this._account = window.arguments[0];
      this._callback = window.arguments[1];
    }

    // Check if the account is specified
    if (this._account == null) {
      // Close the window
      window.close();
    } else {
      // Set the account header tooltip
      var header = document.getElementById("gmanager-alert-header");
      header.setAttribute("tooltiptext", this._account.alias);

      // Set the account icon
      var image = document.getElementById("gmanager-alert-header-image");
      image.setAttribute("icontype", this._account.type);
      image.setAttribute("status", gmanager_Utils.toStyleStatus(this._account.status));
      image.setAttribute("newMail", this._account.unread > 0 ? "true" : "false");

      // Set the account alias
      var alias = document.getElementById("gmanager-alert-header-alias");
      alias.setAttribute("value", this._account.alias);

      // Get the account snippets
      this._snippets = this._account.getSnippets({});

      // Check if the account is logged in
      if (this._account.loggedIn) {
        // Check if the account has any snippets
        if (this._snippets.length === 0) {
          // Populate error message; account must have snippets
          this._populateError(this.getString("snippets"));
        } else {
          // Populate the first snippet
          this.firstSnippet();
        }
      } else {
        // Populate error message; account must be logged in
        this._populateError(this.getString("login"));
      }

      try {
        var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        var prefBranch = prefService.getBranch("alerts.");

        if (prefBranch.prefHasUserValue("slideIncrement")) {
          this.SLIDE_INCREMENT = prefBranch.getIntPref("slideIncrement");
        }

        if (prefBranch.prefHasUserValue("slideIncrementTime")) {
          this.SLIDE_TIME = prefBranch.getIntPref("slideIncrementTime");
        }

        if (prefBranch.prefHasUserValue("totalOpenTime")) {
          this.OPEN_TIME = prefBranch.getIntPref("totalOpenTime");
        }
      } catch (e) {
        gmanager_Utils.log("Error getting the alert preferences: " + e);
      }

      window.sizeToContent();

      window.moveTo(screen.availLeft + screen.availWidth - window.outerWidth, screen.availTop + screen.availHeight - window.outerHeight);
      this.MIN_Y = window.screenY;

      window.moveBy(0, window.outerHeight);
      this.MAX_Y = window.screenY;

      this._startTimer(this.OPEN_STAGE, this.SLIDE_TIME);
    }
  };

  this.play = function(aEvent) {
    gmanager_Alert._isPlaying = true;
  };

  this.pause = function(aEvent) {
    gmanager_Alert._isPlaying = false;
  };

  this._startTimer = function(aStage, aInterval) {
    this._stage = aStage;
    this._timer.initWithCallback(this, aInterval, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
  };

  this.notify = function(aTimer) {
    switch (this._stage) {
      case this.OPEN_STAGE:
      {
        if (window.screenY > this.MIN_Y) {
          window.moveBy(0, -this.SLIDE_INCREMENT);
        } else {
          this._startTimer(this.SLIDE_STAGE, this.OPEN_TIME);
        }

        break;
      }
      case this.SLIDE_STAGE:
      {
        if (this._isPlaying) {
          if (this._hasNext()) {
            this.nextSnippet();
          } else {
            this._startTimer(this.CLOSE_STAGE, this.SLIDE_TIME);
          }
        }

        break;
      }
      case this.CLOSE_STAGE:
      {
        if (window.screenY < this.MAX_Y) {
          window.moveBy(0, this.SLIDE_INCREMENT);
        } else {
          this.close();
        }

        break;
      }
      default:
      {
        gmanager_Utils.log("Unknown stage... definitely should not be here!");
        this.close();
        break;
      }
    }
  };

  this._populateError = function(aMsg) {
    document.getElementById("gmanager-alert-navigation").collapsed = true;
    document.getElementById("gmanager-alert-details").collapsed = true;
    document.getElementById("gmanager-alert-description").setAttribute("clickable", false);
    document.getElementById("gmanager-alert-description").removeAttribute("onclick");
    document.getElementById("gmanager-alert-description").firstChild.value = aMsg;
  };

  this._populateSnippet = function(aIndex) {
    var snippet = this._snippets[aIndex];

    // Set the snippet index
    this._snippetIndex = aIndex;

    document.getElementById("gmanager-alert-header-count").value = this.getFString("count", [this._snippetIndex + 1, this._snippets.length]);
    document.getElementById("gmanager-alert-details-from").value = gmanager_Utils.toUnicode(snippet.from);
    document.getElementById("gmanager-alert-details-date").value = gmanager_Utils.toUnicode(snippet.time);
    document.getElementById("gmanager-alert-details-subject").value = gmanager_Utils.toUnicode(snippet.subject);
    document.getElementById("gmanager-alert-description").firstChild.value = gmanager_Utils.toUnicode(snippet.msg);
  };

  this.nextSnippet = function() {
    if (this._hasNext()) {
      this._populateSnippet(this._snippetIndex + 1);
    }
  };

  this.previousSnippet = function() {
    if (this._hasPrevious()) {
      this._populateSnippet(this._snippetIndex - 1);
    }
  };

  this.firstSnippet = function() {
    this._populateSnippet(0);
  };

  this.lastSnippet = function() {
    this._populateSnippet(this._snippets.length - 1);
  };

  this._hasNext = function() {
    return (this._snippetIndex < this._snippets.length - 1);
  };

  this._hasPrevious = function() {
    return (this._snippetIndex > 0);
  };

  this._notifyObserver = function(aTopic, aData) {
    // Check if the callback listener is specified
    if (this._callback && typeof this._callback.observe === "function") {
      // Notify the observer about the alert
      this._callback.observe(null, aTopic, aData);
    }
  };

  this.click = function() {
    var snippet = this._snippets[this._snippetIndex];

    // Notify the observer that the alert was clicked
    this._notifyObserver(this.NOTIFY_ALERT_CLICKED, snippet.id);

    // Close the alert
    this.close();
  };

  this.close = function() {
    // Stop the timer
    this._timer.cancel();

    // Close the window
    window.close();

    // Notify the observer that the alert has finished
    this._notifyObserver(this.NOTIFY_ALERT_FINISHED, this._account.email);
  };
};

gmanager_Alert.prototype = Object.create(gmanager_BundlePrefix.prototype);
gmanager_Alert.prototype.constructor = gmanager_Alert;