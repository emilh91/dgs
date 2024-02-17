# Discord <-> Groupme Sync (DGS)

### Motivation

One friend group I had (with my Day 1's) used GroupMe for group communication since 2013.  
We decided it was time to move on to Discord for its better features and more frequent updates.  
After all, it has been 10 years and GroupMe felt stagnant.  
However, one friend ([ialbert94](https://github.com/ialbert94)) was stubborn and preferred GroupMe for whatever reason.  
As a compromise, I decided to write this little connector to synchronize messages between the two services.  
This way, those who want to use GroupMe can do so; and those who want to use Discord can do so as well.  
There isn't complete feature parity, but it does the job adequately enough.  
And it was a nice little weekend project!  

### Pre-requisites

- NodeJS (v20 or higher)

### Getting Started

```sh
git clone git@github.com:emilh91/dgs.git # or via https
cd dgs
npm ci
echo "[]" > USERS.json
cp env.template .env
# fill in .env (see next section)
```

### Environment Variables

You can get Groupme-related tokens from https://dev.groupme.com/bots .  
You can get Discord-related tokens from https://discord.com/developers/applications .  
You will need to add your tokens and secrets to `.env`; this file is git-ignored.  
Do not update `.env.template` unless you know what you are doing.

### Generating User Mappings

```sh
node --env-file=.env bin/01-list-groups.js
# make note (e.g. copy) the id of the group from the output
node --env-file=.env bin/02-generate-user-mappings.js $GROUP_ID
```

### Usage

```sh
npm run d2g
npm run g2d
```

### Scratch

The `scratch` folder is used for testing either GroupMe or Discord things.  
Scripts in that folder are git-ignored.
