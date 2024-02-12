# Discord <-> Groupme Sync (DGS)

### Motivation

TODO: add something about my stubborn friend here.

### Pre-requisites

- NodeJS (v20 or higher)

### Getting Started

```sh
git clone git@github.com:emilh91/dgs.git # or via https
cd dgs
npm ci
echo "[]" > USERS.json
cp template.env .env
# fill in .env (see next section)
```

### Environment Variables

You can get Groupme-related tokens from https://dev.groupme.com/bots .  
You can get Discord-related tokens from https://discord.com/developers/applications .  
You will need to add your tokens and secrets to `.env`; this file is git-ignored.  
Do not update `template.env` unless you know what you are doing.

### Generating User Mappings

```sh
node bin/01-list-groups.js
# make note (e.g. copy) the id of the group from the output
node bin/02-generate-user-mappings.js $GROUP_ID
```

### Usage

```sh
npm run d2g
npm run g2d
```

### Scratch

The `scratch` folder is used for testing either GroupMe or Discord things.  
Scripts in that folder are git-ignored.
