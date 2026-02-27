const discord = require('discord.js');
const GroupmeClient = require('./GroupmeClient');
const USERS = require('./USERS.json');

const {
    DISCORD_BOT_TOKEN, GROUPME_API_TOKEN, GROUPME_FALLBACK_BOT_ID,
} = process.env;

const groupmeClient = new GroupmeClient(GROUPME_API_TOKEN);

function getGroupmeBotId(uidd) {
    return USERS.filter(u => u.uidd==uidd)[0]?.botid;
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

function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

function onListenerReady() {
    console.log(`***** Discord listener app logged in as ${discordListener.user.tag}`);
}

async function onMessageCreate(m) {
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
        let contentType = a.contentType || '';
        if (contentType.startsWith('image')) {
            try {
                const groupmeImageUrl = await groupmeClient.downloadAndUploadImage(a.url);
                attachments.push({
                    type: 'image',
                    url: groupmeImageUrl,
                });
            } catch (err) {
                console.log('***** Error downloading or uploading to GroupMe Image Service; adding original image url as text');
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

    let startIndex = 0;
    const MAX_TEXT_PIECE_LENGTH = 1000; // max for GroupMe
    do {
        const endIndex = startIndex + MAX_TEXT_PIECE_LENGTH;
        const piece = text.substring(startIndex, endIndex);
        groupmeClient.sendBotMessage(botid||GROUPME_FALLBACK_BOT_ID, piece, attachments);
        startIndex = endIndex;
        sleep(250);
    } while (startIndex < text.length);
}

async function onMessageReactionAdd(reaction, user) {
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
    let text = `reacted with ${reaction.emoji.name} to ${reactee}'s message:\n"${reaction.message.content}"`;

    const botid = getGroupmeBotId(user.id);
    if (!botid) {
        const reactor = getGroupmeMentionName(user);
        text = `@${reactor} ${text}`;
    }

    const mentionAttachment = getGroupmeMentionAttachment(text);
    const attachments = mentionAttachment ? [mentionAttachment] : [];

    groupmeClient.sendBotMessage(botid||GROUPME_FALLBACK_BOT_ID, text, attachments);
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
discordListener.on(discord.Events.ClientReady, onListenerReady);
discordListener.on(discord.Events.MessageCreate, onMessageCreate);
discordListener.on(discord.Events.MessageReactionAdd, onMessageReactionAdd);
discordListener.login(DISCORD_BOT_TOKEN);
