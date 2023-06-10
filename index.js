require('dotenv').config();
const discord = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser')
const GroupmeClient = require('./GroupmeClient');
const USERS = require('./USERS.json');

const {
    PORT, EMOJI_URL,
    DISCORD_WEBHOOK_URL, DISCORD_BOT_TOKEN,
    GROUPME_API_TOKEN, GROUPME_FALLBACK_BOT_ID,
} = process.env;

const groupmeClient = new GroupmeClient(GROUPME_API_TOKEN);

function getGroupmeMentionAttachment(text) {
    const mentionAttachment = {
        type: 'mentions',
        loci: [],
        user_ids: [],
    };
    const mentionRegex = /(@[^' ]*)/g;
    const matches = text.match(mentionRegex) || [];
    let lastIndexOf = -1;
    for (let match of matches) {
        lastIndexOf = text.indexOf(match, lastIndexOf+1);
        const name = match.substring(1); // `match`, but without the leading '@'
        const mu = USERS.filter(u => u.name.toLowerCase()===name.toLowerCase())[0];

        if (mu && mu.mentiong) {
            mentionAttachment.loci.push([lastIndexOf, match.length]);
            mentionAttachment.user_ids.push(mu.uidg);
        }
    }
    return mentionAttachment.user_ids.length===0 ? null : mentionAttachment;
}

function getGroupmeMentionName(discordUser) {
    let mu = null;
    if (discordUser.bot) {
        const username = discordUser.username.replace(' (from GroupMe)', '');
        mu = USERS.filter(u => u.name.toLowerCase()===username.toLowerCase())[0];
    } else {
        mu = USERS.filter(u => u.uidd===discordUser.id)[0];
    }
    return mu ? mu.name : discordUser.username;
}

function getGroupmeBotId(uidd) {
    return USERS.filter(u => u.uidd==uidd)[0]?.botid;
}

function getEmojiUrl(pack, index) {
    let url = EMOJI_URL;
    url = url.replace('%PACK%', pack.toString());
    url = url.replace('%INDEX%', index.toString());
    return url;
}

const discordListener = new discord.Client({
    intents: [
        discord.GatewayIntentBits.Guilds,
        discord.GatewayIntentBits.GuildMessages,
        discord.GatewayIntentBits.MessageContent,
        discord.GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        discord.Partials.Message,
        discord.Partials.Channel,
        discord.Partials.Reaction,
    ],
});
discordListener.on('ready', () => {
    console.log(`***** Discord listener app logged in as ${discordListener.user.tag}`);
});
discordListener.on(discord.Events.MessageCreate, async (m) => {
    if (m.author.bot) {
        console.log('***** Received bot message from Discord; it will NOT be forwarded to GroupMe');
        return;
    }

    console.log('***** Received message from Discord:', m);

    let text = m.content;
    const attachments = [];

    for (let [_, user] of m.mentions.users) {
        const replacer = `<@${user.id}>`;
        const regex = new RegExp(replacer);

        const mentionName = getGroupmeMentionName(user);
        text = text.replace(regex, '@'+mentionName);
    }

    const mentionAttachment = getGroupmeMentionAttachment(text);
    if (mentionAttachment) {
        attachments.push(mentionAttachment);
    }

    for (let [_, s] of m.stickers) {
        text += `sent sticker "${s.name}"`
    }

    for (let [_, a] of m.attachments) {
        if (a.contentType.startsWith('image')) {
            try {
                const groupmeImageUrl = await groupmeClient.downloadAndUploadImage(a.url);
                attachments.push({
                    type: 'image',
                    url: groupmeImageUrl,
                });
            } catch (err) {
                console.log('***** Error downloading or uploading to Groupme Image Service; adding original image url as text');
                console.log(err);
                text += ' ' + a.url;
            }
        }
    }

    if (!text && attachments.length===0) {
        console.log('***** Empty messages cannot be sent to GroupMe');
        return;
    }

    const botid = getGroupmeBotId(m.author.id);
    if (!botid) {
        text = `${m.author.username} posted: ${text}`;
    }

    groupmeClient.sendBotMessage(botid||GROUPME_FALLBACK_BOT_ID, text, attachments);
});
discordListener.on(discord.Events.MessageReactionAdd, async (reaction, user) => {
    if (reaction.partial) {
        console.log(`***** Partial reaction payload requires fetch...`);

        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return;
        }
    }

    const reactee = getGroupmeMentionName(reaction.message.author);
    let text = `reacted with ${reaction.emoji.name} to @${reactee}'s message:\n"${reaction.message.content}"`;

    const botid = getGroupmeBotId(user.id);
    if (!botid) {
        const reactor = getGroupmeMentionName(user);
        text = `@${reactor} ${text}`;
    }

    const mentionAttachment = getGroupmeMentionAttachment(text);
    const attachments = mentionAttachment ? [mentionAttachment] : [];

    groupmeClient.sendBotMessage(botid||GROUPME_FALLBACK_BOT_ID, text, attachments);
});
discordListener.login(DISCORD_BOT_TOKEN);

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
