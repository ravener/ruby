import { cachePrices } from '#lib/utils/invest';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({ once: true })
export class ClientReady extends Listener {
    public async run() {
        await cachePrices(true);
        setInterval(() => cachePrices(), 30 * 60 * 1000); // Cache prices every 30 minutes
    }
}