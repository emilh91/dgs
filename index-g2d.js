const discord = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser')
const USERS = require('./USERS.json');

const {
    PORT, EMOJI_URL, DISCORD_WEBHOOK_URL
} = process.env;

function getEmojiUrl(pack, index) {
    let url = EMOJI_URL;
    url = url.replace('%PACK%', pack.toString());
    url = url.replace('%INDEX%', index.toString());
    return url;
}

const webhookClient = new discord.WebhookClient({
    url: DISCORD_WEBHOOK_URL,
});

const groupmeApp = express();
groupmeApp.use(bodyParser.json());
groupmeApp.use(express.static('assets'))
groupmeApp.post('/g2d', async (req, res) => {
    const m = req.body;
    if (m.sender_type === 'bot') {
        console.log('***** Received bot message from GroupMe; it will NOT be forwarded to Discord');
        res.end();
        return;
    }

    console.log('***** Received message from GroupMe:', JSON.stringify(m,null,4));
    
    let text = m.text;
    const embeds = [];

    for (let a of m.attachments) {
        if (a.type === 'image') {
            //text += ' ' + a.url;
            const imageEmbed = new discord.EmbedBuilder().setImage(a.url);
            embeds.push(imageEmbed);
        }
        else if (a.type === 'emoji') {
            const ph = a.placeholder;
            for (let cm of a.charmap) {
                text = text.replace(ph, ''); // previously :capital_abcd:
                const emojiEmbed = new discord.EmbedBuilder().setImage( getEmojiUrl(...cm) );
                embeds.push(emojiEmbed);
            }
        }
        else if (a.type === 'mentions') {
            for (let i in a.user_ids) {
                const uidg = a.user_ids[i];
                const [start, len] = a.loci[i];
                const needle = m.text.substring(start, start+len);
                const uidd = USERS.filter(u => u.uidg===uidg)[0].uidd;
                text = text.replace(needle, `<@${uidd}>`);
            }
        }
    }

    try {
        await webhookClient.send({
            content: text,
            username: `${m.name} (from GroupMe)`,
            avatarURL: m.avatar_url,
            embeds,
        });
    } catch (err) {
        if (err instanceof discord.DiscordAPIError) {
            console.log(JSON.stringify(err.rawError));
        }
    }
    
    res.end();
});
groupmeApp.post('/g2d-noop-*', (req, res) => res.end());
groupmeApp.listen(PORT, () => {
    console.log(`***** GroupMe listener app listening on port ${PORT}`);
});
