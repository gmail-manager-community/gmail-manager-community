#!/bin/sh
# Script to package gmail-manager-community.
#

VERSION=`sed -ne '/em:version/{s/.*<em:version>\(.*\)<\/em:version>.*/\1/p;q;}' install.rdf`
PACKAGE=dist/gmail_manager_community-$VERSION.xpi
FILES="chrome components defaults chrome.manifest install.rdf license.txt"

echo "Cleaning"
rm -f $PACKAGE

echo "Packaging using version $VERSION"
echo "Packaging XPI to $PACKAGE"
zip -r $PACKAGE $FILES > xpipackage.out
