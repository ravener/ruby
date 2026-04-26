import { prisma } from '#lib/prisma';
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

const timeouts = new Set();

export class MessageListener extends Listener {
    public async run(message: Message) {
        if (!message.inGuild()) return;
        if (message.author.bot || message.system || message.webhookId) return;

        await this.handleXP(message);
    }

    private async handleXP(message: Message) {
        if (!message.channel.isSendable()) return;
        if (timeouts.has(message.author.id)) return;

        const xp = Math.floor(Math.random() * 5) + 1;
        
        const user = await prisma.user.upsert({
            where: { id: message.author.id },
            create: {
                id: message.author.id,
                xp
            },
            update: {
                xp: {
                    increment: xp
                }
            }
        });

        const level = Math.floor(0.1 * Math.sqrt(user.xp));
        if (level > user.level) {
            await prisma.user.update({
                where: { id: user.id },
                data: { level }
            });

            await message.channel.send(`Congratulations! ${message.author} you leveled up to **Level ${level}**`);
        }

        timeouts.add(message.author.id);
        setTimeout(() => timeouts.delete(message.author.id), 5000);
    }
}