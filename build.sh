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

git archive --format=tar --prefix="build/${APP}/" HEAD | tar xvf -

./generate_rules.rb
cp adb.css selectors_generated.js	xpaths_generated.js build/adb/

rm build/adb/.gitignore
rm build/adb/build.sh
rm build/adb/easylist.txt
rm build/adb/generate_rules.rb
rm build/adb/myfilter.txt
rm build/adb/test_generate_rules.rb

echo $CHROME --pack-extension="build/${APP}" --pack-extension-key="../${APP}.pem"
