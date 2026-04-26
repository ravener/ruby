import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, User } from 'discord.js';
import { Colors } from './utils/constants.js';
import { prisma } from './prisma.js';
import { formatMoney } from './utils/money.js';

const leaderboardMenu = new StringSelectMenuBuilder()
    .setCustomId('leaderboard')
    .setPlaceholder('Select Leaderboard Type')
    .addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('XP Leaderboard')
            .setDescription('See who\'s most active')
            .setValue('xp'),

        new StringSelectMenuOptionBuilder()
            .setLabel('Money Leaderboard')
            .setDescription('See who\'s rich')
            .setValue('money')
    );

export async function createXPLeaderboard(author: User) {
    const users = await prisma.user.findMany({
        orderBy: {
            xp: 'desc'
        }
    });

    const lines = users.slice(0, 10).map((user, index) => `${index + 1}. ❯ <@${user.id}>: ${user.xp.toLocaleString()} XP (Level ${user.level})`);
    const me = users.findIndex(user => user.id === author.id);
    const meBal = users.find(user => user.id === author.id);

    const embed = new EmbedBuilder()
        .setColor(Colors.Primary)
        .setTitle('XP Leaderboard')
        .setDescription(`${lines.join('\n')}\n\n${me === -1 ? '??' : me + 1}. ❯ ${author}: ${meBal?.xp.toLocaleString()} XP (Level ${meBal?.level})`)
        .setFooter({ text: `${users.length} Users` });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(leaderboardMenu);
    return { embeds: [embed], components: [row] };
}

export async function createMoneyLeaderboard(author: User) {
    const users = await prisma.user.findMany({
        orderBy: {
            money: 'desc'
        }
    });

    const lines = users.slice(0, 10).map((user, index) => `${index + 1}. ❯ <@${user.id}>: ${formatMoney(user.money)}`);
    const me = users.findIndex(user => user.id === author.id);
    const meBal = users.find(user => user.id === author.id);

    const embed = new EmbedBuilder()
        .setTitle('Money Leaderboard')
        .setDescription(`${lines.join('\n')}\n\n${me === -1 ? '??' : me + 1}. ❯ ${author}: ${formatMoney(meBal?.money ?? 0)}`)
        .setColor(Colors.Primary)
        .setFooter({ text: `${users.length} Users` });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(leaderboardMenu);
    return { embeds: [embed], components: [row] };
}