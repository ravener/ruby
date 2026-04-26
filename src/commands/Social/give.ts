import { prisma } from '#lib/prisma';
import { formatMoney } from '#lib/utils/money';
import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { reply } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
    runIn: ['GUILD_TEXT'],
    description: 'Give some one money'
})
export class GiveCommand extends Command {
    public async messageRun(message: Message, args: Args) {
        const user = await args.pick('user');
        const amount = Math.floor(await args.pick('number'));

        const giver = await prisma.user.findUnique({
            where: { id: message.author.id }
        });

        if (!giver || giver.money < amount) {
            await reply(message, `You don't have ${formatMoney(amount)} to give! You only have ${formatMoney(giver?.money ?? 0)}`);
            return;
        }

        await prisma.$transaction([
            prisma.user.update({
                where: { id: message.author.id },
                data: {
                    money: {
                        decrement: amount
                    }
                }
            }),

            prisma.user.upsert({
                where: { id: user.id },
                create: {
                    id: user.id,
                    money: amount
                },
                update: {
                    money: {
                        increment: amount
                    }
                }
            })
        ]);

        await reply(message, `You gave ${formatMoney(amount)} to ${user}`);
    }
}