const DEFAULT_BOT_NAME = "New Bot";
const DEFAULT_BOT_AVATAR_URL = "https://em-content.zobj.net/thumbs/160/apple/354/robot_1f916.png";

module.exports = class GroupmeClient {
    #apiToken;

    constructor(apiToken) {
        this.#apiToken = apiToken;
    }

    async makeBot(groupId, name, avatarURL, callbackURL, dmNotification=true, active=true) {
        const url = `https://api.groupme.com/v3/bots?token=${this.#apiToken}`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                bot: {
                    group_id: groupId,
                    name: name || DEFAULT_BOT_NAME,
                    avatar_url: avatarURL || DEFAULT_BOT_AVATAR_URL,
                    callback_url: callbackURL,
                    dm_notification: dmNotification,
                    active,
                },
            }),
        });
        return response.json();
    }

    async downloadAndUploadImage(url) {
        const downloadResponse = await fetch(url);
        const blob = await downloadResponse.blob();

        const uploadResponse = await fetch('https://image.groupme.com/pictures', {
            method: 'POST',
            headers: {
                'X-Access-Token': this.#apiToken,
                'Content-Type': downloadResponse.headers.get('Content-Type'),
            },
            body: blob,
        });
        const uploadResponseData = await uploadResponse.json();
        return uploadResponseData.payload.url; // or .picture_url
    }

    async getGroups() {
        const url = `https://api.groupme.com/v3/groups?token=${this.#apiToken}`;
        const response = await fetch(url);
        return response.json();
    }

    async sendBotMessage(botId, text, attachments=[]) {
        const url = `https://api.groupme.com/v3/bots/post?token=${this.#apiToken}`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                bot_id: botId,
                text,
                attachments,
            }),
        });
        return response.json();
    }
}
