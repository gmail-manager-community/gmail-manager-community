// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

const GM_CLASS_NAME = "Connection Listener";
const GM_CLASS_ID = Components.ID("{7e8e54b5-a41a-4a08-9fc3-bed4c5e9adb1}");
const GM_CONTRACT_ID = "@gmail-manager-community.github.com/gmanager/connection;1";

function gmConnection() {
  // Load the services
  this._logger = Components.classes["@gmail-manager-community.github.com/gmanager/logger;1"].getService(Components.interfaces.gmILogger);
  this._observer = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

  // Initialize the cookies
  this._cookies = {};
}
gmConnection.prototype = {
  _channel: null,
  _data: null,
  _callback: null,

  get channel() {
    return this._channel;
  },

  get data() {
    return this._data;
  },

  getCookies: function(aCount) {
    var cookies = [];

    for (var cookieHost in this._cookies) {
      for (var cookiePath in this._cookies[cookieHost]) {
        for (var cookieName in this._cookies[cookieHost][cookiePath]) {
          var cookie = this._cookies[cookieHost][cookiePath][cookieName];
          cookies.push(cookie);
        }
      }
    }

    if (aCount) {
      aCount.value = cookies.length;
    }

    return cookies;
  },

  send: function(aUrl, aData) {
    // Clear data
    this._data = "";

    // Initialize the channel
    this._initChannel(aUrl, aData);

    // Open the channel blocking
    var stream = this._channel.open();

    // Remove the HTTP observers
    this._observer.removeObserver(this, "http-on-modify-request");
    this._observer.removeObserver(this, "http-on-examine-response");

    // Initialize the stream
    var scriptableInputStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
    scriptableInputStream.init(stream);

    // Read the stream data
    while (scriptableInputStream.available()) {
      this._data += scriptableInputStream.read(4096);
    }
  },

  sendAsync: function(aUrl, aData, aCallback) {
    // Save the callback function
    this._callback = aCallback;

    // Initialize the channel
    this._initChannel(aUrl, aData);

    // Open the channel asynchronously
    this._channel.asyncOpen(this._channel.notificationCallbacks, null);
  },

  _initChannel: function(aUrl, aData) {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"].createInstance(Components.interfaces.nsIIOService);
    var uri = ioService.newURI(aUrl, null, null);

    Components.utils.import("resource://gre/modules/Services.jsm");

    // Create the HTTP channel
    this._channel = ioService.newChannelFromURI2(uri, null, Services.scriptSecurityManager.getSystemPrincipal(), null,
      Components.interfaces.nsILoadInfo.SEC_NORMAL, Components.interfaces.nsIContentPolicy.TYPE_OTHER);

    // Check for POST data
    if (typeof aData === "string") {
      var stringInputStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
      stringInputStream.setData(aData, aData.length);

      var uploadChannel = this._channel.QueryInterface(Components.interfaces.nsIUploadChannel);
      uploadChannel.setUploadStream(stringInputStream, "application/x-www-form-urlencoded", -1);

      var httpChannel = this._channel.QueryInterface(Components.interfaces.nsIHttpChannel);
      httpChannel.requestMethod = "POST";
    }

    // Add the HTTP observers
    this._observer.addObserver(this, "http-on-modify-request", false);
    this._observer.addObserver(this, "http-on-examine-response", false);

    // Create the observer for server response
    var observer = new this.observer(this);

    // Open the HTTP channel for server request
    this._channel.notificationCallbacks = observer;
  },

  observe: function(aSubject, aTopic, aData) {
    // Check if this is the channel being followed
    if (aSubject === this._channel) {
      // Get the HTTP channel
      var httpChannel = aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);

      switch (aTopic) {
        case "http-on-modify-request":
        {
          // Clears the cookies
          httpChannel.setRequestHeader("Cookie", "", false);

          for (var cookieHost in this._cookies) {
            // Check if the cookie should be added to this request
            if (httpChannel.URI.host.indexOf(cookieHost) > -1) {
              for (var cookiePath in this._cookies[cookieHost]) {
                for (var cookieName in this._cookies[cookieHost][cookiePath]) {
                  var cookie = this._cookies[cookieHost][cookiePath][cookieName];

                  // Check if the cookie has expired
                  if (Date.parse(cookie.expires) < Date.now()) {
                    // Delete the cookie since it has expired
                    delete this._cookies[cookieHost][cookiePath][cookieName];
                  } else {
                    // Add the cookie to the request header
                    httpChannel.setRequestHeader("Cookie", cookie.pair, true);
                  }
                }
              }
            }
          }

          break;
        }
        case "http-on-examine-response":
        {
          try {
            var cookieHeader = httpChannel.getResponseHeader("Set-Cookie");
            var rawCookies = cookieHeader.split("\n");

            rawCookies.forEach(function(rawCookie, index, array) {
              var cookieTokens = rawCookie.split(";");
              var cookie = {
                name: "",
                value: "",
                host: httpChannel.URI.host,
                path: httpChannel.URI.path,
                isSecure: false,
                isHttpOnly: false,
                isSession: false,
                expires: null
              };

              for (var i = 0, n = cookieTokens.length; i < n; i++) {
                var cookieToken = cookieTokens[i];
                var cookieTokenPair = cookieToken.match(/(.+?)=(.*)/);

                if (cookieTokenPair === null) {
                  if (/^\s*Secure\s*$/i.test(cookieToken)) {
                    cookie.isSecure = true;
                  } else if (/^\s*HttpOnly\s*$/i.test(cookieToken)) {
                    cookie.isHttpOnly = true;
                  } else {
                    this._logger.log("Cookie token not handled: " + cookieToken);
                  }
                } else {
                  var cookieTokenAttr = cookieTokenPair[1];
                  var cookieTokenValue = cookieTokenPair[2];

                  if (i === 0) {
                    cookie.pair = cookieTokenAttr + "=" + cookieTokenValue;
                    cookie.name = cookieTokenAttr;
                    cookie.value = cookieTokenValue;
                  } else if (/^\s*Domain\s*$/i.test(cookieTokenAttr)) {
                    cookie.host = cookieTokenValue;
                  } else if (/^\s*Path\s*$/i.test(cookieTokenAttr)) {
                    cookie.path = cookieTokenValue;
                  } else if (/^\s*Expires\s*$/i.test(cookieTokenAttr)) {
                    cookie.expires = cookieTokenValue.replace(/-/g, " ");
                  } else {
                    this._logger.log("Cookie token attribute not handled: " + cookieTokenAttr);
                  }
                }
              }

              if (cookie.expires === null) {
                cookie.isSession = true;
                cookie.expires = Math.pow(2, 34);
              }

              this._logger.log("raw cookie = " + rawCookie);

              for (var i in cookie) {
                this._logger.log("cookie " + i + " = " + cookie[i]);
              }

              if (this._cookies[cookie.host] == null) {
                this._cookies[cookie.host] = {};
              }

              if (this._cookies[cookie.host][cookie.path] == null) {
                this._cookies[cookie.host][cookie.path] = {};
              }

              this._cookies[cookie.host][cookie.path][cookie.name] = cookie;
            }, this);
          } catch (e) {
            this._logger.log("Error reading cookies from the response header: " + e);
          }

          // Clear the incoming cookies; Firefox 2 (Gecko 1.8.1)
          httpChannel.setResponseHeader("Set-Cookie", "", false);

          break;
        }
      }
    }
  },

  callback: function(aRequest, aData) {
    // Remove the HTTP observers
    this._observer.removeObserver(this, "http-on-modify-request");
    this._observer.removeObserver(this, "http-on-examine-response");

    // Save the data
    this._data = aData;

    // Check if the callback function was specified
    if (this._callback && typeof this._callback.callback === "function") {
      this._callback.callback(this);
    }
  },

  observer: function(aThis) {
    return ({
      _data: "",

      /**
       * nsIStreamListener
       */
      onStartRequest: function(aRequest, aContext) {
        this._data = "";
      },

      onStopRequest: function(aRequest, aContext, aStatus) {
        aThis.callback(aRequest, this._data);
      },

      onDataAvailable: function(aRequest, aContext, aStream, aSourceOffset, aLength) {
        var scriptableInputStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
        scriptableInputStream.init(aStream);
        this._data += scriptableInputStream.read(aLength);
      },

      /**
       * nsIChannelEventSink
       */
      asyncOnChannelRedirect: function(aOldChannel, aNewChannel, aFlags, aCallback) {
        this.onChannelRedirect(aOldChannel, aNewChannel, aFlags);
        aCallback.onRedirectVerifyCallback(0);
      },

      // TODO Remove; Obsolete in Firefox 3.6 (Gecko 1.9.2)

      onChannelRedirect: function(aOldChannel, aNewChannel, aFlags) {
        aThis._channel = aNewChannel;
      },

      /**
       * nsIProgressEventSink
       */
      onProgress: function(aRequest, aContext, aProgress, aProgressMax) { /* Stub */ },
      onStatus: function(aRequest, aContext, aStatus, aStatusArg) { /* Stub */ },

      /**
       * nsIHttpEventSink
       */
      onRedirect: function(aOldChannel, aNewChannel) { /* Stub */ },

      /**
       * nsIInterfaceRequestor
       */
      getInterface: function(aIID) {
        return this.QueryInterface(aIID);
      },

      QueryInterface: function(aIID) {
        if (aIID.equals(Components.interfaces.nsIStreamListener) ||
            aIID.equals(Components.interfaces.nsIChannelEventSink) ||
            aIID.equals(Components.interfaces.nsIProgressEventSink) ||
            aIID.equals(Components.interfaces.nsIHttpEventSink) ||
            aIID.equals(Components.interfaces.nsIInterfaceRequestor) ||
            aIID.equals(Components.interfaces.nsISupports)) {
          return this;
        }
        throw Components.results.NS_ERROR_NO_INTERFACE;
      }
    });
  },

  classDescription: GM_CLASS_NAME,
  classID: GM_CLASS_ID,
  contractID: GM_CONTRACT_ID,

//  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.gmIConnection]),

  QueryInterface: function(aIID) {
    if (aIID.equals(Components.interfaces.gmIConnection) ||
        aIID.equals(Components.interfaces.nsISupports)) {
      return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
  }
};

if (Components.utils && Components.utils.import) {
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

  if (XPCOMUtils.generateNSGetFactory) {
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([gmConnection]);
  }
  //else {
  //  var NSGetModule = XPCOMUtils.generateNSGetModule([gmConnection]);
  //}
}

// TODO Remove; Obsolete in Firefox 2 (Gecko 1.8.1)

const gmanager_Factory = {
  createInstance: function(aOuter, aIID) {
    if (aOuter != null) {
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    }

    return (new gmConnection()).QueryInterface(aIID);
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