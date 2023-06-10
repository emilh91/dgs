const axios = require('axios');

const DEFAULT_BOT_NAME = "New Bot";
const DEFAULT_BOT_AVATAR_URL = "https://em-content.zobj.net/thumbs/160/apple/354/robot_1f916.png";

module.exports = class GroupmeClient {
    #apiToken;

    constructor(apiToken) {
        this.#apiToken = apiToken;
    }

    async makeBot(groupId, name, avatarURL, callbackURL, dmNotification=true, active=true) {
        const response = await axios({
            method: 'post',
            url: `https://api.groupme.com/v3/bots?token=${this.#apiToken}`,
            data: {
                bot: {
                    group_id: groupId,
                    name: name || DEFAULT_BOT_NAME,
                    avatar_url: avatarURL || DEFAULT_BOT_AVATAR_URL,
                    callback_url: callbackURL,
                    dm_notification: dmNotification,
                    active,
                }
            }
        });
        return response.data;
    }

    async downloadAndUploadImage(url) {
        const downloadResponse = await axios({
            method: 'get',
            url,
            responseType: 'arraybuffer',
        });
        const uploadResponse = await axios({
            method: 'post',
            url: 'https://image.groupme.com/pictures',
            headers: {
                'X-Access-Token': this.#apiToken,
                'Content-Type': downloadResponse.headers.get('Content-Type'),
            },
            data: downloadResponse.data,
        });
        return uploadResponse.data.payload.url; // or .picture_url
    }

    async getGroups() {
        const response = await axios({
            method: 'get',
            url: `https://api.groupme.com/v3/groups?token=${this.#apiToken}`,
        });
        return response.data;
    }

    async sendBotMessage(botId, text, attachments=[]) {
        const response = await axios({
            method: 'post',
            url: `https://api.groupme.com/v3/bots/post?token=${this.#apiToken}`,
            data: {
                bot_id: botId,
                text,
                attachments,
            },
        });
        return response.data;
    }
}
