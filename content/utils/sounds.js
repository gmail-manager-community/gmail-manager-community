// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Sounds = new function()
{
  this.__proto__ = new gmanager_BundlePrefix("gmanager-sounds-");
  
  this.WAV_FILTER_TYPE = "*.ogg; *.wav";
  
  this.init = function()
  {
    this._ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    //this._soundService = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
    //this._soundService.init();
  }
  
  this.play = function(aPath)
  {
    var uri = null;
    
    try {
      var localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
      localFile.initWithPath(aPath);
      
      if (localFile.exists())
        uri = this._ioService.newFileURI(localFile);
    } catch(e) {
      uri = this._ioService.newURI(aPath, null, null);
    }
    
    if (uri) {
      var audio = new Audio();
      audio.src = uri.spec
      audio.play();
    }
      
  }
  
  this.selectFile = function()
  {
    var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
    
    filePicker.init(window, this.getString("select-file"), Components.interfaces.nsIFilePicker.modeOpen);
    filePicker.appendFilter(this.getFString("sound-files", [this.WAV_FILTER_TYPE]), this.WAV_FILTER_TYPE);
    filePicker.show();
    
    return (filePicker.file ? filePicker.file.path : null);
  }
  
  this.init();
}