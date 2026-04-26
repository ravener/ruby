import { prisma } from '#lib/prisma';
import { formatMoney } from '#lib/utils/money';
import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { reply } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';

const COOLDOWN = 16 * 60 * 60 * 1000; // 16 hours

@ApplyOptions<Command.Options>({
    runIn: ['GUILD_TEXT'],
    description: 'Claim your daily allowance'
})
export class DailyCommand extends Command {
    public async messageRun(message: Message, args: Args) {
        const user = await prisma.user.findUnique({
            where: { id: message.author.id }
        });

        if (user && Date.now() < user.lastDaily + COOLDOWN) {
            const next = user.lastDaily + COOLDOWN;
            const unix = Math.floor(next / 1000);
            
            await reply(message, `You've already claimed your daily today, come back <t:${unix}:R>`);
            return;
        }

        await prisma.user.upsert({
            where: { id: message.author.id },
            create: {
                id: message.author.id,
                lastDaily: Date.now(),
                money: 100
            },
            update: {
                lastDaily: Date.now(),
                money: { increment: 100 }
            }
        });

        await reply(message, `You've claimed your daily ${formatMoney(100)}, don't spend it all in one place!`);
    }
}