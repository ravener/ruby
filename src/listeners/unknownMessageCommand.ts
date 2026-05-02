import { ask } from '#lib/utils/ai';
import { Listener, type UnknownMessageCommandPayload } from '@sapphire/framework';

export class UnknownCommand extends Listener {
    public async run(payload: UnknownMessageCommandPayload) {
        // only apply to natural language regex prefix
        if (payload.commandPrefix === '!') return;
        // Use entire message as prompt since the prefix is natural
        const prompt = payload.message.content;
        await ask(payload.message, prompt);
    }
}