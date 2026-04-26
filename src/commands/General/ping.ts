import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { reply } from '@sapphire/plugin-editable-commands';

@ApplyOptions<Command.Options>({
    description: 'Pong! Check if bot is alive'
})
export class PingCommand extends Command {
    public async messageRun(message: Message) {
        const msg = await reply(message, 'Ping?');
        const took = msg.createdTimestamp - message.createdTimestamp;
        await reply(message, `Pong! That took **${took} ms**`);
    }   
}