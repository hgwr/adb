#!/bin/bash

CHROME=/opt/google/chrome/google-chrome
APP=adb

if [ \! -d build ]; then
  mkdir build
fi

git-archive --format=tar --prefix="build/${APP}/" HEAD | tar xvf -
# $CHROME --pack-extension="build/${APP}" --pack-extension-key="../${APP}.pem"
