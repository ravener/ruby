import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, type Awaitable, type MessageCommand } from '@sapphire/framework';
import { reply } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
    description: 'Ask Ruby something',
    cooldownDelay: 3000,
    aliases: [
        'what',
        'where',
        'when',
        'why',
        'how',
        'who',
        'whom',
        'whose',
        'which',
        'can',
        'could',
        'would',
        'should',
        'do',
        'does',
        'did',
        'is',
        'are',
        'am',
        'was',
        'were',
        'will',
        'may',
        'might'
    ]
})
export class Ask extends Command {
    public async messageRun(message: Message, args: Args, context: MessageCommand.RunContext) {
        await reply(message, JSON.stringify(context, null, 2));   
    }
}