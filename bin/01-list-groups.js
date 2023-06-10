require('dotenv').config();
const GroupmeClient = require('../GroupmeClient');

async function main() {
    const groupmeClient = new GroupmeClient(process.env.GROUPME_API_TOKEN);
    const response = await groupmeClient.getGroups();
    const groups = response.response;
    for (let g of groups) {
        console.log(`Group Id: ${g.id}`);
        console.log(`Group Name: ${g.name}`);
        //console.log(`Group Description: ${g.description}`);
        console.log(`Group Image URL: ${g.image_url}`);
        console.log(`Member Count: ${g.members.length}`);
        console.log();
    }
}

main();
