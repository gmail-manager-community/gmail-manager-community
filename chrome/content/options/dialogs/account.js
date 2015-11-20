// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_OptionsAccount = new function() {
  gmanager_BundlePrefix.call(this, "gmanager-options-");

  this.load = function() {
    // Unwrap the window arguments; if available
    if (window.arguments) {
      // window.arguments[0] : manager
      // window.arguments[1] : email

      this._manager = window.arguments[0];
      this._email = window.arguments[1];

      // Check if the account exists
      if (this._manager.isAccount(this._email)) {
        this._account = this._manager.getAccount(this._email);
      } else {
        this._account = this._manager.defaultAccount;
      }
    }

    // Check if the account is specified
    if (this._account == null) {
      // Close the dialog
      window.close();
    }

    var toolbar = document.getElementById("gm-prefs-toolbar-toolbar-id");
    var toolbars = gmanager_Toolbars.getToolbars();

    for (var i = 0, n = toolbars.length; i < n; i++) {
      var menuitem = document.createElement("menuitem");
      menuitem.setAttribute("label", toolbars[i].id);
      menuitem.setAttribute("value", toolbars[i].id);
      toolbar.appendChild(menuitem);
    }

    // Display the email (if available)
    document.getElementById("gmanager-options-account-email").value = this._account.email;
    document.getElementById("gmanager-options-account-email").disabled = this._email;

    // Display the alias
    var alias = this._account.node.getAttribute("alias");
    document.getElementById("gmanager-options-account-alias").value = (alias ? alias : "");

    // Display the password
    var password = this._account.node.getAttribute("password");
    document.getElementById("gmanager-options-account-password").value = (password ? password : "");

    // Load the page preferences
    gmanager_Prefs.loadPrefs(this._account.node, document);

    this.input();
  };

  this.input = function() {
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
  };

  this.selectSoundFile = function() {
    var path = gmanager_Sounds.selectFile();
    if (path) {
      document.getElementById("gm-prefs-notifications-sounds-file").value = path;
    }
  };

  this.previewSoundFile = function() {
    gmanager_Sounds.play(document.getElementById("gm-prefs-notifications-sounds-file").value);
  };

  this.dialogAccept = function() {
    var email = document.getElementById("gmanager-options-account-email").value;
    var alias = document.getElementById("gmanager-options-account-alias").value;
    var password = document.getElementById("gmanager-options-account-password").value;

    // Check if the email is valid
    if (!gmanager_Utils.isEmail(email)) {
      // The email is not valid
      alert(gmanager_Bundle.getString("gmanager-login-valid-email"));

      // Keep the dialog open
      return false;
    }

    // Save the page preferences
    gmanager_Prefs.savePrefs(this._account.node, document);

    if (this._account && this._email) {
      // Update the account alias and password
      this._account.node.setAttribute("alias", alias);
      this._account.node.setAttribute("password", password);
    } else {
      // Create the account
      var account = this._manager.addAccount("gmail", email, alias, password, this._account.node);

      // Check if the account was created
      if (!account) {
        // The email already exists
        alert(this.getString("email-exists"));

        // Keep the dialog open
        return false;
      }
    }

    // Close the dialog
    return true;
  };
};

gmanager_OptionsAccount.prototype = Object.create(gmanager_BundlePrefix.prototype);
gmanager_OptionsAccount.prototype.constructor = gmanager_OptionsAccount;