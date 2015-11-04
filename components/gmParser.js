// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

const GM_CLASS_NAME = "Preferences XML Parser";
const GM_CLASS_ID = Components.ID("{d0fe9af0-f7bc-11da-974d-0800200c9a66}");
const GM_CONTRACT_ID = "@gmail-manager-community.github.com/gmanager/parser;1";

// Extension version
const EXTENSION_VERSION = "0.7";

// Version where the preferences file was first introduced
const DEFAULT_VERSION = "0.5";

// XML content type
const XML_CONTENT_TYPE = "text/xml";

// XPath result types
const STRING_TYPE = Components.interfaces.nsIDOMXPathResult.STRING_TYPE;
const UNORDERED_NODE_SNAPSHOT_TYPE = Components.interfaces.nsIDOMXPathResult.UNORDERED_NODE_SNAPSHOT_TYPE;

function gmParser()
{
  // Load the parsing services
  this._logger = Components.classes["@gmail-manager-community.github.com/gmanager/logger;1"].getService(Components.interfaces.gmILogger);
  this._converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
  this._domParser = Components.classes['@mozilla.org/xmlextras/domparser;1'].getService(Components.interfaces.nsIDOMParser);
  this._domSerializer = Components.classes['@mozilla.org/xmlextras/xmlserializer;1'].getService(Components.interfaces.nsIDOMSerializer);
  
  // Initialize the converter
  this._converter.charset = "UTF-8";
  
  // Initialize the transforms directory
  var directoryService = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
  this._transformsDir = directoryService.get("ProfD", Components.interfaces.nsIFile);
  this._transformsDir.append("extensions");
  this._transformsDir.append("gmail-manager-community@gmail-manager-community.github.com");
  this._transformsDir.append("defaults");
  this._transformsDir.append("transforms");
  
  // Check if the transforms directory exists
  if (!this._transformsDir.exists())
  {
    // This is used for development
    this._transformsDir = directoryService.get("ProfD", Components.interfaces.nsIFile);
    this._transformsDir.append("gmanager");
    this._transformsDir.append("transforms");
  }
}
gmParser.prototype = {
  get emptyDoc()
  {
    return this._domParser.parseFromString(
        '<?xml version="1.0"?>\n' + 
        '<prefs version="' + EXTENSION_VERSION + '">\n' + 
        this._domSerializer.serializeToString(this.globalNode) + 
        '</prefs>', XML_CONTENT_TYPE);
  },
  
  get globalNode()
  {
    return this._domParser.parseFromString(
        '  <account type="global">\n' + 
        '    <pref id="general-hide-context-menu" value="false"/>\n' + 
        '    <pref id="general-hide-tools-menu" value="false"/>\n' + 
        '    <pref id="general-auto-login" value="false"/>\n' + 
        '    <pref id="compose-tab-location" value="existing"/>\n' + 
        '    <pref id="compose-mailto-links" value="false"/>\n' + 
        '    <pref id="compose-mailto-default" value=""/>\n' + 
        '    <pref id="compose-context-menu" value="false"/>\n' + 
        '    <pref id="security-never-save-passwords" value="false"/>\n' + 
        '    <pref id="security-secured-connection" value="true"/>\n' + 
        '    <pref id="toolbar-auto-login" value="true"/>\n' + 
        '    <pref id="toolbar-auto-check" value="true"/>\n' + 
        '    <pref id="toolbar-auto-switch" value="false"/>\n' + 
        '    <pref id="toolbar-left-click" value="background"/>\n' + 
        '    <pref id="toolbar-middle-click" value="check-messages"/>\n' + 
        '    <pref id="toolbar-reset-unread-count" value="false"/>\n' + 
        '  </account>\n', XML_CONTENT_TYPE).documentElement;
  },
  
  get accountNode()
  {
    return this._domParser.parseFromString(
        '  <account>\n' + 
        '    <pref id="general-auto-login" value="false"/>\n' + 
        '    <pref id="toolbar-display" value="true"/>\n' + 
        '    <pref id="toolbar-toolbar-id" value="addon-bar"/>\n' + 
        '    <pref id="toolbar-placement" value="always-last"/>\n' + 
        '    <pref id="toolbar-specific-position" value="0"/>\n' + 
        '    <pref id="toolbar-account-hide-unread-count" value="false"/>\n' + 
        '    <pref id="toolbar-account-hide-alias" value="false"/>\n' + 
        '    <pref id="toolbar-tooltip-show-labels" value="true"/>\n' + 
        '    <pref id="toolbar-tooltip-show-snippets" value="true"/>\n' + 
        '    <pref id="toolbar-unread-count-inbox" value="true"/>\n' + 
        '    <pref id="toolbar-unread-count-spam" value="false"/>\n' + 
        '    <pref id="toolbar-unread-count-labels" value="false"/>\n' + 
        '    <pref id="notifications-check" value="true"/>\n' + 
        '    <pref id="notifications-check-interval" value="15"/>\n' + 
        '    <pref id="notifications-display-snippets" value="true"/>\n' + 
        '    <pref id="notifications-sounds" value="false"/>\n' + 
        '    <pref id="notifications-sounds-file" value=""/>\n' + 
        '  </account>\n', XML_CONTENT_TYPE).documentElement;
  },
  
  open: function(aFile)
  {
    var doc = null;
    
    // Check if the specified file exists
    if (aFile && aFile.exists())
    {
      var docTemp = this._readFileToXML(aFile);
      
      if (docTemp)
      {
        var docElementTemp = docTemp.documentElement;
        
        if (docElementTemp && !docElementTemp.hasAttribute("version"))
          docElementTemp.setAttribute("version", DEFAULT_VERSION);
        
        docTemp = this._transform(docTemp);
        
        if (this._validate(docTemp))
          doc = docTemp;
      }
    }
    
    return doc;
  },
  
  save: function(aFile, aDoc)
  {
    return this._writeXMLToFile(aFile, aDoc);
  },
  
  _readFileToXML: function(aFile)
  {
    var doc = null;
    var fiStream = null;
    var siStream = null;
    
    try {
      var data = new String();
      
      // Load the input streams
      fiStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
      siStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
      
      // Initialize the input streams
      fiStream.init(aFile, 1, 0, false);
      siStream.init(fiStream);
      
      while (siStream.available() > 0)
      {
        // Read the data from the input stream
        var chunk = siStream.read(siStream.available());
        data += this._converter.ConvertToUnicode(chunk);      
      }
      
      // Convert the XML string to DOM document
      doc = this._domParser.parseFromString(data, XML_CONTENT_TYPE);
    } catch(e) {
      // There was an error reading from the file
      doc = null;
    } finally {
      // Make sure the input streams are closed
      if (!fiStream)
        fiStream.close();
      if (!siStream)
        siStream.close();
    }
    
    // Return the DOM document
    return doc;
  },
  
  _writeXMLToFile: function(aFile, aDoc)
  {
    var success = false;
    var foStream = null;
    
    try {
      // Convert the DOM document to XML string
      var data = this._domSerializer.serializeToString(aDoc);
      
      // Load the output stream
      foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
      
      // Initialize the output stream
      foStream.init(aFile, 0x02 | 0x08 | 0x20, 0664, 0); // wronly | create | truncate
      
      // Write the data to file
      var chunk = this._converter.ConvertFromUnicode(data);
      foStream.write(chunk, chunk.length);
      
      // Make sure all of the data has been written
      var fin = this._converter.Finish();
      if (fin && fin.length > 0)
        foStream.write(fin, fin.length);
      
      // Success for writing to the file
      success = true;
    } catch(e) {
      // There was an error writing to the file
      success = false;
    } finally {
      // Make sure the output stream is closed
      if (!foStream)
        foStream.close();
    }
    
    // Return if successful or not
    return success;
  },
  
  _validate: function(aDoc)
  {
    var globalResult = this._xpath(aDoc, "/prefs/account[@type=\"global\"]", UNORDERED_NODE_SNAPSHOT_TYPE);
    
    // Check if the global account is defined (required)
    if (globalResult && globalResult.snapshotLength == 1)
    {
      var globalNode = globalResult.snapshotItem(0);
      var nodeIdResults = this._xpath(this.globalNode, "/account/pref/@id", UNORDERED_NODE_SNAPSHOT_TYPE);
      
      // Validate the global account preferences
      if (this._validateIds(globalNode, nodeIdResults))
      {
        var accountsResult = this._xpath(aDoc, "/prefs/account[@type and @email and @alias]", UNORDERED_NODE_SNAPSHOT_TYPE);
        
        // Check if any mail accounts are defined (not required)
        if (accountsResult && accountsResult.snapshotLength > 0)
        {
          nodeIdResults = this._xpath(this.accountNode, "/account/pref/@id", UNORDERED_NODE_SNAPSHOT_TYPE);
          
          for (var i = 0; i < accountsResult.snapshotLength; i++)
          {
            var accountNode = accountsResult.snapshotItem(i);
            
            // Validate the mail account preferences
            if (!this._validateIds(accountNode, nodeIdResults))
              return false;
          }
        }
        
        return true;
      }
    }
    
    return false;
  },
  
  _validateIds: function(aNode, aNodeIdResults)
  {
    if (!aNodeIdResults)
      return false;
    
    for (var i = 0; i < aNodeIdResults.snapshotLength; i++)
    {
      var id = aNodeIdResults.snapshotItem(i).nodeValue;
      var nodeIdResult = this._xpath(aNode, "./pref[@id=\"" + id + "\"]", UNORDERED_NODE_SNAPSHOT_TYPE);
      
      if (!nodeIdResult || nodeIdResult.snapshotLength != 1)
        return false;
    }
    
    return true;
  },
  
  _transform: function(aDoc)
  {
    // Get the preferences version
    var versionResult = this._xpath(aDoc, "/prefs/@version", STRING_TYPE);
    
    // Check if the preferences version exists
    if (versionResult)
    {
      // Get the preferences transform file
      var transformFile = this._transformsDir.clone();
      transformFile.append("prefs-" + versionResult.stringValue + ".xsl");
      
      // Check if the transform file exists
      if (versionResult.stringValue != EXTENSION_VERSION && transformFile.exists())
      {
        try {
          // Import the transform file
          var processor = Components.classes["@mozilla.org/document-transformer;1?type=xslt"].createInstance(Components.interfaces.nsIXSLTProcessor);
          processor.importStylesheet(this._readFileToXML(transformFile));
          
          // Transform the preferences
          return this._transform(processor.transformToDocument(aDoc));
        } catch(e) {
          this._logger.log("There was an error transforming the preferences: " + e);
          return null;
        }
      }
    }
    
    // Return the transformed preferences
    return aDoc;
  },
  
  _xpath: function(aNode, aExpression, aType)
  {
    var results = null;
    try {
      // Evaluate the XPath expression
      //var xpathEvaluator = Components.classes["@mozilla.org/dom/xpath-evaluator;1"].createInstance(Components.interfaces.nsIDOMXPathEvaluator);
      //results = xpathEvaluator.evaluate(aExpression, aNode, null, aType, null);
      var aDoc = aNode.ownerDocument ? aNode.ownerDocument : aNode;
      results = aDoc.evaluate(aExpression, aNode, null, aType, null);
    } catch(e) {}
    return results;
  },
  
  classDescription: GM_CLASS_NAME,
  classID: GM_CLASS_ID,
  contractID: GM_CONTRACT_ID,
  
//  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.gmIParser]),
  
  QueryInterface: function(aIID)
  {
    if (aIID.equals(Components.interfaces.gmIParser) || 
        aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_ERROR_NO_INTERFACE;
  }
}

if (Components.utils && Components.utils.import)
{
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
  
  if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([gmParser]);
//  else
//    var NSGetModule = XPCOMUtils.generateNSGetModule([gmParser]);
}

// TODO Remove; Obsolete in Firefox 2 (Gecko 1.8.1)

const gmanager_Factory = {
  createInstance: function(aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    
    return (new gmParser()).QueryInterface(aIID);
  }
}

const gmanager_Module = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(
      GM_CLASS_ID,
      GM_CLASS_NAME,
      GM_CONTRACT_ID,
      aFileSpec,
      aLocation,
      aType);
  },
  
  unregisterSelf: function(aCompMgr, aFileSpec, aLocation)
  {
    aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(
      GM_CLASS_ID,
      aFileSpec);
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (aCID.equals(GM_CLASS_ID))
      return gmanager_Factory;
    
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
  
  canUnload: function(aCompMgr)
  {
    return true;
  }
};

function NSGetModule(aCompMgr, aFileSpec)
{
  return gmanager_Module;
}