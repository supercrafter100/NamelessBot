// Imports
import { Client, Intents } from 'discord.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import CloneGitRepository from './util/CloneGitRepository';

import CommandHandler from './commands/commandHandler/commandHandler';
import updateDataCommand from './commands/custom/updateDataCommand';
import HelpCommand from './commands/custom/helpCommand';
import ArgDirCommand from './commands/commandTypes/ArgDir';
import BasicCommand from './commands/commandTypes/Basic';

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
});

const config = JSON.parse(readFileSync('./config.json', 'utf8'));
const cmdHandler = new CommandHandler(client);

export {
    client,
    config,
}

// Register common commands

cmdHandler.load(new ArgDirCommand("support", "Get help with some frequently asked questions"));
cmdHandler.load(new ArgDirCommand("faq", "Get help with some frequently asked questions"));
cmdHandler.load(new BasicCommand("cheese", "Display cheese"));

// Register custom commands
cmdHandler.loadCustom(new HelpCommand());
cmdHandler.loadCustom(new updateDataCommand());

// Clone from the github repository to ensure we have the latest files
CloneGitRepository(`${config.organizationName}/${config.repositoryName}`, config.branch, join(__dirname, '../../../data'));

// OCR
import './listeners/messageListener';

client.on('ready', () => {
    console.log(`${client.user?.username} is ready...`);

    // Status
    client.user?.setActivity({ name: '>help | namelessmc.com', type: 'PLAYING' });
    setInterval(() => client.user?.setActivity({ name: '/support | namelessmc.com', type: 'PLAYING' }), 60*1000*60)
});

client.login(config.token);