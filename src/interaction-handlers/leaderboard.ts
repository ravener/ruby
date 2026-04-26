import { createMoneyLeaderboard, createXPLeaderboard } from '#lib/leaderboards';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes, Option, type Awaitable } from '@sapphire/framework';
import type { Interaction, StringSelectMenuInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.SelectMenu
})
export class LeaderboardHandler extends InteractionHandler {
    public async parse(interaction: StringSelectMenuInteraction) {
        if (interaction.customId === 'leaderboard') {
            return this.some(interaction.values[0]);
        }

        return this.none();
    }

    public async run(interaction: StringSelectMenuInteraction, type: string) {
        const lb = type === 'money' ? await createMoneyLeaderboard(interaction.user) : await createXPLeaderboard(interaction.user);
        
        await interaction.message.edit(lb);
    }
}