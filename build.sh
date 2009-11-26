#!/bin/bash

CHROME=/opt/google/chrome/google-chrome
APP=adb

if [ \! -d build ]; then
  mkdir build
fi

git status
echo " "
echo -n "(build.sh) Continue ? (yes/No): "
read ans
if [ "$ans" != 'yes' ]; then
  echo  "abort"
  exit
fi

git-archive --format=tar --prefix="build/${APP}/" HEAD | tar xvf -

./generate_rules.rb
cp adb.css selectors_generated.js	xpaths_generated.js build/adb/

# $CHROME --pack-extension="build/${APP}" --pack-extension-key="../${APP}.pem"
