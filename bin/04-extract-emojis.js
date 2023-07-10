#! /usr/bin/env node

const sharp = require('sharp');

const S = 40; // emoji height (and width)

async function extractEmojisInPack(pack) {
    const packPath = `${__dirname}/../assets/emoji-pack-${pack}.png`;

    const rect = { width: S, height: S, left: 0, top: 0 };
    while (true) {
        const index = rect.top / S;
        //const outPath = `${__dirname}/../assets/emoji-${pack}-${index}.png`;
        const outPath = `/var/www/html/groupme/emoji-${pack}-${index}.png`;
        console.log(`Extracting image from pack ${pack} at index ${index} (top=${rect.top})`);

        try {
            await sharp(packPath).extract(rect).toFile(outPath);
        } catch (err) {
            console.log('Stopping extraction from this pack since we probably reached the end.')
            break;
        }
        
        rect.top += S;
    }
}

async function extractAllEmojis() {
    for (let i=1; i<=20; i++) {
        console.log();
        await extractEmojisInPack(i);
    }
}

extractAllEmojis();
