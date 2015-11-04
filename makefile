# Makefile to package gmail-manager-community.
#

VERSION = `sed -ne '/em:version/{s/.*<em:version>\(.*\)<\/em:version>.*/\1/p;q;}' install.rdf`
PACKAGE = dist/gmail_manager_community-$(VERSION).xpi
FILES = components content defaults locale skin chrome.manifest install.rdf license.txt

all: clean package

clean:
	@echo "Cleaning"
	@rm -f $(PACKAGE)

package:
	@echo "Packaging using version $(VERSION)"
	@echo "Packaging XPI to $(PACKAGE)"
	@zip -r $(PACKAGE) $(FILES) > xpipackage.out
