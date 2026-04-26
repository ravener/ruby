import { bold } from 'discord.js';

export function formatMoney(amount: number) {
    // if negative, put the - sign before the $
    const format = amount < 0 ? `-$${Math.abs(amount).toLocaleString()}` : `$${amount.toLocaleString()}`;
    return bold(format);
}