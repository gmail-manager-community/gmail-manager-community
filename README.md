# Gmail Manager-community #

Installable from: https://addons.mozilla.org/en-US/firefox/addon/gmail-manager-community/

This extension is a fork of [Gmail Manager NG](https://addons.mozilla.org/en-US/firefox/addon/gmail-manager-ng/) by Erik Nedwidek, itself forked from [Gmail Manager](https://addons.mozilla.org/en-US/firefox/addon/gmail-manager/) by Todd Long.
Development of those extensions appears to have stopped in February 2012 and March 2011.

**Gmail Manager-community** is available under the same licenses and is intended to be a community developed extension.


## Developers ##

To build XPI package, you need few tools available from your PATH:
- **sed**
- **zip**
- **make** (optional)

Run `./make.sh`, or `make` (if **make** is installed).

New XPI is created in `dist` directory.

Packaging process writes logs to `xpipackage.out` file.

*(Tested in Unix and MinGW environments)*

### Debug ###

Firefox [Add-on Debugger](https://developer.mozilla.org/en-US/Add-ons/Add-on_Debugger) is only available for *restartless and SDK-based add-ons*.
So, to debug **Gmail Manager-community**, please use *[Browser Toolbox](https://developer.mozilla.org/en-US/docs/Tools/Browser_Toolbox) and use its Debugger tool*.
