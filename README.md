**Gmail Manager-community** is installable from:
https://addons.mozilla.org/en-US/firefox/addon/gmail-manager-community/

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
