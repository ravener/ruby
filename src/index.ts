import 'dotenv/config';

import { SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';

const client = new SapphireClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    loadMessageCommandListeners: true,
    defaultPrefix: '!',
    regexPrefix: /^(?:(?:(?:hey|yo|ok|hi|hello),? )?ruby,? )/,
    allowedMentions: {
        parse: ['users']
    }
});

await client.login(process.env.TOKEN);