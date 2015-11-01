#!/bin/sh
# Script to package gmail-manager-community.
# Erik Nedwidek
# Alexis THOMAS
#

ZIP=zip
ZIPARGS=-r
VERSION=`sed -ne '/em:version/{s/.*<em:version>\(.*\)<\/em:version>.*/\1/p;q;}' install.rdf`
DISTDIR=../dist
PACKAGE=$DISTDIR/gmail_manager_community-$VERSION.xpi
CHROMEPACKAGE=gmanager.jar

FILES="chrome/$CHROMEPACKAGE chrome.manifest components defaults install.rdf license.txt"
CHROMEFILES="content locale skin"

echo "Packaging using version $VERSION"
echo "Package chrome jar"
cd chrome && $ZIP $ZIPARGS $CHROMEPACKAGE $CHROMEFILES > ../../chromepackage.out
echo "Packaging XPI $PACKAGE"
cd .. && $ZIP $ZIPARGS $PACKAGE $FILES > ../xpipackage.out
