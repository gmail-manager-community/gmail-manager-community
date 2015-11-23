// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Accounts = new function() {
  this.NOTIFY_STATE = "gmanager-accounts-notify-state";

  this.init = function() {
    // Load the accounts manager
    this._manager = Components.classes["@gmail-manager-community.github.com/gmanager/manager;1"].getService(Components.interfaces.gmIManager);
  };

  this.loginAllAccounts = function() {
    var accounts = this._manager.getAccounts({});

    accounts.forEach(function(account, index, array) {
      if (account && !account.loggedIn) {
        account.login(null);
      }
    });
  };

  this.logoutAllAccounts = function() {
    var accounts = this._manager.getAccounts({});

    accounts.forEach(function(account, index, array) {
      if (account && account.loggedIn) {
        account.logout();
      }
    });
  };

  this.checkAllAccounts = function() {
    var accounts = this._manager.getAccounts({});

    accounts.forEach(function(account, index, array) {
      if (account && account.loggedIn) {
        account.check();
      }
    });
  };

  this.loginAccount = function(aEmail) {
    if (this._manager.isAccount(aEmail)) {
      var account = this._manager.getAccount(aEmail);

      if (!account.loggedIn) {
        account.login(null);
      }
    }
  };

  this.logoutAccount = function(aEmail) {
    if (this._manager.isAccount(aEmail)) {
      var account = this._manager.getAccount(aEmail);

      if (account.loggedIn) {
        account.logout();
      }
    }
  };

  this.checkAccount = function(aEmail) {
    if (this._manager.isAccount(aEmail)) {
      var account = this._manager.getAccount(aEmail);

      if (account.loggedIn) {
        account.check();
      }
    }
  };

  this.openFolder = function(aEmail, aLocation, aFolderId) {
    if (this._manager.isAccount(aEmail)) {
      var account = this._manager.getAccount(aEmail);
      var folder = account.getFolder(null, aFolderId);

      // Check if the unread count should be reset
      if (this._manager.global.getBoolPref("toolbar-reset-unread-count")) {
        account.resetUnread();
      }

      gmanager_Utils.loadURI(folder.url, null, folder.data, aLocation);
    }
  };

  this.openMessage = function(aEmail, aLocation, aMessageId) {
    if (this._manager.isAccount(aEmail)) {
      var account = this._manager.getAccount(aEmail);
      var message = account.getMessage(null, aMessageId);

      // Check if the unread count should be reset
      if (this._manager.global.getBoolPref("toolbar-reset-unread-count")) {
        account.resetUnread();
      }

      gmanager_Utils.loadURI(message.url, null, message.data, aLocation);
    }
  };

  this.openCompose = function(aEmail, aLocation, aHref) {
    if (this._manager.isAccount(aEmail)) {
      var account = this._manager.getAccount(aEmail);
      var compose = account.getCompose(null, aHref);

      gmanager_Utils.loadURI(compose.url, null, compose.data, aLocation);
    } else {
      gmanager_Utils.loadDefaultMail(aHref);
    }
  };

  this.init();
};