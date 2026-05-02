import { ask } from '#lib/utils/ai';
import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, type MessageCommand } from '@sapphire/framework';
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
        let prompt = await args.rest('string');

        // Allow using aliases to ask questions
        if (context.commandName !== 'ask') {
            prompt = `${context.commandName} ${prompt}`;
        }

        // Allow regex prefix to be part of the prompt
        if (context.commandPrefix !== '!') {
            prompt = `${context.commandPrefix} ${prompt}`;
        }

        await ask(message, prompt);   
    }
}