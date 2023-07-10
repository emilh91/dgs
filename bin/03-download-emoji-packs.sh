#! /bin/sh

dirName=`dirname $0`
dirName=`realpath $dirName`

for i in {1..20}
do
    echo "Downloading emoji pack $i ..."
    curl -o $dirName/../assets/emoji-pack-$i.png https://powerups.s3.amazonaws.com/emoji/$i/inline.xhdpi.40x40.png
done
