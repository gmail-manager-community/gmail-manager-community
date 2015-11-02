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

FILES="chrome.manifest chrome components defaults install.rdf license.txt"

echo "Cleaning"
rm -f $PACKAGE

echo "Packaging using version $VERSION"
echo "Packaging XPI $PACKAGE"
$ZIP $ZIPARGS $PACKAGE $FILES > ../xpipackage.out
