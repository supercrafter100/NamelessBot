import { config } from "../../index";
import { Client, Collection, Message } from "discord.js";
import ArgDirCommand from "../commandTypes/ArgDir";

type Command = ArgDirCommand;

class CommandHandler {

    public commands: Collection<string, Command> = new Collection();
    
    constructor(client: Client) {
        client.on("messageCreate", (message: Message) => {
            if (!message.guild) return;
            if (message.author.bot) return;
            if (!message.content.startsWith(config.prefix)) return;
            
            const args = message.content.substring(config.prefix.length).split(/ +/g);
            const cmd = args.shift()!.toLowerCase();

            if (!cmd) return;
            if (!this.commands.has(cmd)) return;

            const command = this.commands.get(cmd)!;
            command.execute(message, args);
        });
    }

    public load(command: Command) {
        this.commands.set(command.name, command);
    }

    public loadCustom(command: any) {
        this.commands.set(command.name, command);
    }
}

export default CommandHandler;