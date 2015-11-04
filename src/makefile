# Makefile to package gmail-manager-community.
# Erik Nedwidek
#

ZIP = zip
ZIPARGS = -r
VERSION = `sed -ne '/em:version/{s/.*<em:version>\(.*\)<\/em:version>.*/\1/p;q;}' install.rdf`
DISTDIR = ../dist
PACKAGE = $(DISTDIR)/gmail_manager_community-$(VERSION).xpi

FILES = chrome components defaults chrome.manifest install.rdf license.txt

all: clean package

clean:
	@echo "Cleaning"
	rm -f $(PACKAGE)

package:
	@echo "Packaging using version $(VERSION)"
	@echo "Packaging XPI $(PACKAGE)"
	$(ZIP) $(ZIPARGS) $(PACKAGE) $(FILES) > ../xpipackage.out
