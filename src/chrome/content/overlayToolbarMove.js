// Gmail Manager-community
// Alexis THOMAS (https://github.com/ath0mas)
// Forked from Gmail Manager NG by Erik Nedwidek (https://github.com/nedwidek)
// Based on Gmail Manager by Todd Long <longfocus@gmail.com>

var gmanager_ToolbarMove = new function()
{
  this.TOOLBAR_FLAVOUR = "text/" + gmanager_Toolbars.TOOLBAR_ITEM_ID;
  this.DRAGDROP_ACTION = Components.interfaces.nsIDragService.DRAGDROP_ACTION_MOVE;
  
  this.init = function()
  {
    // Get the "drop" type listener; Firefox 3.5 (Gecko 1.9.1)
    this._dropType = (gmanager_Utils.getPlatformVersion() >= "1.9.1" ? "drop" : "dragdrop");
  }
  
  this.initDrag = function(aEvent)
  {
    this._toolbars = gmanager_Toolbars.getToolbars();
    this._dragOverItem = null;
    
    if (this._toolbars.length > 0)
    {
      var splitter = document.getElementById("urlbar-search-splitter");
      if (splitter)
        splitter.parentNode.removeChild(splitter);
      
      this._toggleMenuBar(true);
      this._addToolbarListeners();
      this._wrapToolbarItems();
      
      // Borrowed from nsDragAndDrop.js (used for modal drag session)
      
      // Set the drag item
      this._dragItem = aEvent.target;
      
      var transferData = new TransferData();
      transferData.addDataForFlavour(this.TOOLBAR_FLAVOUR, aEvent.target.id);
      
      var transArray = Components.classes["@mozilla.org/supports-array;1"].createInstance(Components.interfaces.nsISupportsArray);
      transArray.AppendElement(nsTransferable.set(transferData));
      
      try {
        var dragService = nsDragAndDrop.mDragService;
        
        if (typeof dragService.invokeDragSessionWithImage === "function")
        {
          var dataTransfer = aEvent.dataTransfer;
          dataTransfer.mozSetDataAt(this.TOOLBAR_FLAVOUR, aEvent.target.id, 0);
          
          // Invoke the modal drag session with image
          dragService.invokeDragSessionWithImage(aEvent.target, transArray,
                                                 null, this.DRAGDROP_ACTION,
                                                 null, 0, 0, aEvent, dataTransfer);
        }
        else
        {
          // Invoke the modal drag session without image
          dragService.invokeDragSession(aEvent.target, transArray, null, this.DRAGDROP_ACTION);
        }
      } catch(e) {
        // this could be because the user pressed escape to
        // cancel the drag. even if it's not, there's not much
        // we can do, so be silent.
      }
      
      this._toggleMenuBar(false);
      this._removeToolbarListeners();
      this._unwrapToolbarItems();
      
      if (typeof UpdateUrlbarSearchSplitterState === "function")
        UpdateUrlbarSearchSplitterState();
    }
  }
  
  this._toggleMenuBar = function(aBool)
  {
    var menubar = document.getElementById("main-menubar");
    
    // Check if the menubar exists
    if (menubar)
    {
      var menubarKids = menubar.childNodes;
      
      for (var i = 0, n = menubarKids.length; i < n; i++)
        menubarKids[i].setAttribute("disabled", aBool);
    }
  }
  
  this._addToolbarListeners = function()
  {
    this._toolbars.forEach(function(toolbar, index, array) {
      toolbar.addEventListener("dragover", this._onToolbarDragOver, false);
      toolbar.addEventListener(this._dropType, this._onToolbarDragDrop, false);
    }, this);
  }
  
  this._removeToolbarListeners = function()
  {
    this._toolbars.forEach(function(toolbar, index, array) {
      toolbar.removeEventListener("dragover", this._onToolbarDragOver, false);
      toolbar.removeEventListener(this._dropType, this._onToolbarDragDrop, false);
    }, this);
  }
  
  this._isCustomizableToolbar = function(aToolbar)
  {
    if (aToolbar && aToolbar instanceof Node)
    {
      var toolbarsRegExp = new RegExp("^(?:" + gmanager_Toolbars.TOOLBARS.join("|") + ")$", "i");
      return toolbarsRegExp.test(aToolbar.localName);
    }
    
    return false;
  }
  
  this._getCustomizableToolbar = function(aNode)
  {
    var toolbar = aNode;
    
    while (!this._isCustomizableToolbar(toolbar))
      toolbar = toolbar.parentNode;
    
    return toolbar;
  }
  
  this._isToolbarItem = function(aItem)
  {
    if (aItem && aItem instanceof Node)
      return (aItem.localName === "toolbarbutton" ||
              aItem.localName === "toolbaritem" ||
              aItem.localName === "toolbarseparator" ||
              aItem.localName === "toolbarspacer" ||
              aItem.localName === "toolbarspring" ||
              aItem.localName === "statusbarpanel");
    
    return false;
  }
  
  this._wrapToolbarItem = function(aItem)
  {
    var wrapper = this._createWrapper(aItem.id);
    
    wrapper.flex = aItem.flex;
    
    if (aItem.parentNode)
      aItem.parentNode.removeChild(aItem);
    
    wrapper.appendChild(aItem);
    
    return wrapper;
  }
  
  this._getWrapperId = function(aId)
  {
    return "wrapper-" + aId;
  }
  
  this._createWrapper = function(aId)
  {
    var wrapper = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarpaletteitem");
    wrapper.id = this._getWrapperId(aId);
    return wrapper;
  }
  
  this._cleanupItemForToolbar = function(aItem, aWrapper)
  {
    this._setWrapperType(aItem, aWrapper);
    aWrapper.setAttribute("place", "toolbar");
    
    // Check if the item has a command
    if (aItem.hasAttribute("command"))
    {
      aWrapper.setAttribute("itemcommand", aItem.getAttribute("command"));
      aItem.removeAttribute("command");
    }
    
    function _attributeInverter(aAttribute, aBool) {
      if (aItem.hasAttribute(aAttribute) &&
          aItem.getAttribute(aAttribute) === (aBool + ""))
      {
        aWrapper.setAttribute("item" + aAttribute, aBool);
        aItem.setAttribute(aAttribute, !aBool);
      }
    }
    
    // Invert the item attributes
    _attributeInverter("disabled", true);
    _attributeInverter("collapsed", true);
    _attributeInverter("hidden", true);
  }
  
  this._setWrapperType = function(aItem, aWrapper)
  {
    if (aItem.localName === "toolbarseparator")
      aWrapper.setAttribute("type", "separator");
    else if (aItem.localName === "toolbarspring")
      aWrapper.setAttribute("type", "spring");
    else if (aItem.localName === "toolbarspacer")
      aWrapper.setAttribute("type", "spacer");
    else if (aItem.localName === "toolbaritem" && aItem.firstChild)
      aWrapper.setAttribute("type", aItem.firstChild.localName);
  }
  
  this._wrapToolbarItems = function()
  {
    this._toolbars.forEach(function(toolbar, index, array) {
      if (this._isCustomizableToolbar(toolbar))
      {
        var toolbarKids = toolbar.childNodes;
        
        for (var i = 0, n = toolbarKids.length; i < n; i++)
        {
          var toolbarItem = toolbarKids[i];
          
          if (this._isToolbarItem(toolbarItem))
          {
            var nextSibling = toolbarItem.nextSibling;
            var wrapper = this._wrapToolbarItem(toolbarItem);
            
            if (nextSibling)
              toolbar.insertBefore(wrapper, nextSibling);
            else
              toolbar.appendChild(wrapper);
            
            this._cleanupItemForToolbar(toolbarItem, wrapper);
          }
        }
      }
    }, this);
  }
  
  this._unwrapToolbarItems = function()
  {
    this._toolbars.forEach(function(toolbar, index, array) {
      var paletteItems = toolbar.getElementsByTagName("toolbarpaletteitem");
      
      while (paletteItems.length > 0)
      {
        var paletteItem = paletteItems.item(0);
        var attributes = paletteItem.attributes;
        var toolbarItem = paletteItem.firstChild;
        
        for (var i = 0, n = attributes.length; i < n; i++)
        {
          const itemRegExp = /^item(.+)$/i;
          
          var attributeName = attributes[i].nodeName;
          var nameMatch = (attributeName.match(itemRegExp) || [])[1];
          
          if (nameMatch)
            toolbarItem.setAttribute(nameMatch, paletteItem.getAttribute(attributeName));
        }
        
        paletteItem.parentNode.replaceChild((toolbarItem || this._dragItem), paletteItem);
      }
    }, this);
  }
  
  this._onToolbarDragOver = function(aEvent)
  {
    nsDragAndDrop.dragOver(aEvent, gmanager_ToolbarMove);
  }
  
  this._onToolbarDragDrop = function(aEvent)
  {
    nsDragAndDrop.drop(aEvent, gmanager_ToolbarMove);
  }
  
  this._setDragActive = function(aItem, aBool)
  {
    if (aItem && aItem instanceof Node)
    {
      if (aBool)
      {
        var direction = window.getComputedStyle(aItem, null).direction;
        var value = (direction === "ltr" ? "left" : "right");
        
        aItem.setAttribute("dragover", value);
      }
      else
        aItem.removeAttribute("dragover");
    }
  }
  
  this.onDragStart = function(aEvent, aXferData, aDragAction)
  {
    // Only required if nsDragAndDrop.startDrag is invoked
  }
  
  this.onDragOver = function(aEvent, aFlavour, aDragSession)
  {
    var toolbar = aEvent.target;
    var dropTarget = aEvent.target;
    
    while (!this._isCustomizableToolbar(toolbar))
    {
      dropTarget = toolbar;
      toolbar = toolbar.parentNode;
    }
    
    var previousDragItem = this._dragOverItem;
    
    if (this._isCustomizableToolbar(dropTarget))
      this._dragOverItem = dropTarget;
    else
    {
      var direction = window.getComputedStyle(dropTarget.parentNode, null).direction;
      var dropTargetCenter = (dropTarget.boxObject.x + (dropTarget.boxObject.width / 2));
      var dragAfter = (direction === "ltr" ? aEvent.clientX > dropTargetCenter : aEvent.clientX < dropTargetCenter);
      
      if (dragAfter)
        this._dragOverItem = (dropTarget.nextSibling ? dropTarget.nextSibling : toolbar);
      else
        this._dragOverItem = dropTarget;
    }
    
    if (previousDragItem && previousDragItem !== this._dragOverItem)
      this._setDragActive(previousDragItem, false);
    
    this._setDragActive(this._dragOverItem, true);
    
    aDragSession.canDrop = true;
  }
  
  this.onDrop = function(aEvent, aXferData, aDragSession)
  {
    var wrapper = document.getElementById(this._getWrapperId(aXferData.data));
    
    if (this._dragOverItem && this._dragOverItem !== wrapper)
    {
      var toolbar = this._getCustomizableToolbar(aEvent.target);
      var toolbarItem = wrapper.firstChild;
      
      this._setDragActive(this._dragOverItem, false);
      
      // Check if the toolbar exists
      if (toolbar)
      {
        // Remove the drag item from the old toolbar
        wrapper.parentNode.removeChild(wrapper);
        
        // Insert the drag item in the new toolbar
        if (toolbar !== this._dragOverItem)
          toolbar.insertBefore(wrapper, this._dragOverItem);
        else
          toolbar.appendChild(wrapper);
        
        if (gmanager_Toolbars.isToolbarItem(toolbarItem))
        {
          var account = toolbarItem.account;
          
          if (account)
          {
            var specificPosition = -1;
            var toolbarKids = toolbar.childNodes;
            
            for (var i = 0, n = toolbarKids.length; i < n && specificPosition === -1; i++)
            {
              if (wrapper.id === toolbarKids[i].id)
                specificPosition = i;
            }
            
//            var isLast = (specificPosition === (toolbarKids.length -1));
            
            account.setCharPref("toolbar-toolbar-id", toolbar.id);
            account.setCharPref("toolbar-placement", "specific-position");
            account.setIntPref("toolbar-specific-position", specificPosition);
            
            // Save the account toolbar location
            var manager = Components.classes["@hatterassoftware.com/gmanager/manager;1"].getService(Components.interfaces.gmIManager);
            manager.save();
          }
        }
      }
    }
  }
  
  this.getSupportedFlavours = function()
  {
    var flavours = new FlavourSet();
    flavours.appendFlavour(this.TOOLBAR_FLAVOUR);
    return flavours;
  }
  
  this.init();
}