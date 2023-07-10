require('dotenv').config();
const fs = require('fs/promises');
const GroupmeClient = require('../GroupmeClient');

async function main(groupId) {
    const USERS = [];

    const groupmeClient = new GroupmeClient(process.env.GROUPME_API_TOKEN);
    const response = await groupmeClient.getGroups();
    const groups = response.response;
    for (let g of groups) {
        if (g.id !== groupId) continue;

        for (let m of g.members) {
            const mapping = {
                uidd: '', // discord user id
                uidg: m.user_id, // groupme user id
                botid: '', // groupme bot id for this user in discord (optional)
                name: m.nickname,
                mentiong: true, // whether to @-mention this user in groupme messages
            };
            USERS.push(mapping);
        }
    }

    await fs.writeFile('USERS.json', JSON.stringify(USERS,null,4));
}

const gid = process.argv[2];
if (!gid) {
    console.error('ERROR: GROUP_ID not specified');
    console.error(`USAGE: node bin/${__filename.split('/').reverse()[0]} GROUP_ID`);
    return;
}

main(gid);
