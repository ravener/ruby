import { prisma } from '#lib/prisma';
import { formatMoney } from '#lib/utils/money';
import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, type Awaitable, type MessageCommand } from '@sapphire/framework';
import { reply } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
    description: 'Check your balance',
    aliases: ['bal', 'money', 'wallet']
})
export class BalanceCommand extends Command {
    public async messageRun(message: Message, args: Args) {
        const user = await prisma.user.findUnique({ where: { id: message.author.id } });
        await reply(message, `Your current balance is: ${formatMoney(user?.money ?? 0)}`);
    }
}