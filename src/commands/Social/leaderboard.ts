import { createMoneyLeaderboard, createXPLeaderboard } from '#lib/leaderboards';
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, Command, type Awaitable, type ChatInputCommand } from '@sapphire/framework';
import { reply } from '@sapphire/plugin-editable-commands';
import type { ChatInputCommandInteraction, Message } from 'discord.js';

@ApplyOptions<Command.Options>({
    description: 'View server leaderboard',
    aliases: ['lb', 'top']
})
export class LeaderboardCommand extends Command {
    public async messageRun(message: Message, args: Args) {
        const type = await args.pick('string').catch(() => 'xp');
        const lb = type === 'money' ? await createMoneyLeaderboard(message.author) : await createXPLeaderboard(message.author);

        await reply(message, lb);
    }

    public async chatInputRun(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getString('type');
        const lb = type === 'money' ? await createMoneyLeaderboard(interaction.user) : await createXPLeaderboard(interaction.user);

        await interaction.reply(lb);
    }

    public registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(builder => builder
            .setName('leaderboard')
            .setDescription('View leaderboard')
            .addStringOption(option => option
                .setName('type')
                .setDescription('Type of leaderboard to show')
                .addChoices({ name: 'Money', value: 'money' }, { name: 'XP', value: 'xp' })
                .setRequired(false)
            )
        );
    }
}