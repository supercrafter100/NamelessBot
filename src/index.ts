// Imports
import { Client, Intents } from 'discord.js';
import { readFileSync } from 'fs';

import SingleValueCache from './cache/SingleValueCache';
import CommandHandler from './commands/commandHandler/CommandHandler';
import ArgDirCommand from './commands/commandTypes/ArgDir';
import BasicCommand from './commands/commandTypes/Basic';
import HelpCommand from './commands/custom/HelpCommand';
import { OCRConfig } from './constants/types';

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
});

const OCRCache = new SingleValueCache<OCRConfig[]>();

const config = JSON.parse(readFileSync('./config.json', 'utf8'));
const cmdHandler = new CommandHandler(client);

export {
    client,
    config,
    OCRCache,
}

// Register common commands
cmdHandler.load(new ArgDirCommand("support", "Get help with some frequently asked questions"));
cmdHandler.load(new ArgDirCommand("faq", "Get help with some frequently asked questions"));
cmdHandler.load(new BasicCommand("cheese", "Display cheese"));

// Register custom commands
cmdHandler.loadCustom(new HelpCommand());

// OCR
import './listeners/messageListener';

client.on('ready', () => {
    console.log(`${client.user?.username} is ready...`);
    cmdHandler.deploy();
})

client.login(config.token);