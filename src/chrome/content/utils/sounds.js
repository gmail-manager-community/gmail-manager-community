// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_Sounds = new function()
{
  var gmSounds = Object.create(new gmanager_BundlePrefix("gmanager-sounds-"));
  
  gmSounds.WAV_FILTER_TYPE = "*.ogg; *.wav";
  
  gmSounds.init = function()
  {
    gmSounds._ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    //gmSounds._soundService = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
    //gmSounds._soundService.init();
  }
  
  gmSounds.play = function(aPath)
  {
    var uri = null;
    
    try {
      var localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
      localFile.initWithPath(aPath);
      
      if (localFile.exists())
        uri = gmSounds._ioService.newFileURI(localFile);
    } catch(e) {
      uri = gmSounds._ioService.newURI(aPath, null, null);
    }
    
    if (uri) {
      var audio = new Audio();
      audio.src = uri.spec
      audio.play();
    }
      
  }
  
  gmSounds.selectFile = function()
  {
    var filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
    
    filePicker.init(window, gmSounds.getString("select-file"), Components.interfaces.nsIFilePicker.modeOpen);
    filePicker.appendFilter(gmSounds.getFString("sound-files", [gmSounds.WAV_FILTER_TYPE]), gmSounds.WAV_FILTER_TYPE);
    filePicker.show();
    
    return (filePicker.file ? filePicker.file.path : null);
  }
  
  gmSounds.init();

  return gmSounds;
}