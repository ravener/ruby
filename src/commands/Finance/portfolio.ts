import { prisma } from '#lib/prisma';
import { Colors } from '#lib/utils/constants';
import { ASSETS, calculatePercentage, CurrentPrices } from '#lib/utils/invest';
import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import type { ApplicationCommandRegistry } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { chunk } from '@sapphire/utilities';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';

function parseInput(input: string) {
    input = input.trim();

    const isSpend = input.startsWith('$');

    const value = isSpend
        ? parseFloat(input.slice(1))
        : parseFloat(input);

    return { isSpend, value };
}

@ApplyOptions<Subcommand.Options>({
    subcommands: [
        {
            name: 'invest',
            chatInputRun: 'investRun'
        },
        {
            name: 'sell',
            chatInputRun: 'sellRun'
        },
        {
            name: 'view',
            chatInputRun: 'viewRun'
        }
    ],
    runIn: ['GUILD_TEXT']
})
export class Portfolio extends Subcommand {
    public async investRun(interaction: ChatInputCommandInteraction) {
        const asset = interaction.options.getString('asset', true);
        const amount = interaction.options.getString('amount', true);

        const { isSpend, value } = parseInput(amount);
        if (isNaN(value) || value <= 0) {
            await interaction.reply('Please enter a valid amount to invest.');
            return;
        }

        const assetInfo = ASSETS.find(a => a.symbol === asset);
        if (!assetInfo) {
            await interaction.reply('Unknown asset. Please choose a valid stock or cryptocurrency.');
            return;
        }
        
        if (assetInfo.type !== 'crypto') {
            await interaction.reply('Only cryptos are supported for now.');
            return;
        }

        const currentPrice = CurrentPrices.get(asset);
        if (!currentPrice) {
            await interaction.reply('Current price for that asset is unavailable. Please try again later.');
            return;
        }

        const quantity = isSpend ? value / currentPrice : value;
        const cost = quantity * currentPrice;

        const user = await prisma.user.findUnique({
            where: { id: interaction.user.id }
        });

        if (user?.money && user.money < cost) {
            await interaction.reply('You do not have enough balance to make this investment.');
            return;
        }

        const existingInvestment = await prisma.investment.findUnique({
            where: {
                userId_symbol: {
                    userId: interaction.user.id,
                    symbol: asset
                }
            }
        });

        if (existingInvestment) {
            const totalQuantity = existingInvestment.quantity.add(quantity);
            const totalCost = existingInvestment.averagePrice.mul(existingInvestment.quantity).add(cost);
            const newAveragePrice = totalCost.div(totalQuantity);

            await prisma.$transaction([
                prisma.user.update({
                    where: { id: interaction.user.id },
                    data: {
                        money: {
                            decrement: cost
                        }
                    }
                }),
                prisma.investment.update({
                    where: {
                        userId_symbol: {
                            userId: interaction.user.id,
                            symbol: asset
                        }
                    },
                    data: {
                        quantity: totalQuantity,
                        averagePrice: newAveragePrice
                    }
                })
            ]);
        } else {
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: interaction.user.id },
                    data: {
                        money: {
                            decrement: cost
                        }
                    }
                }),
                prisma.investment.create({
                    data: {
                        userId: interaction.user.id,
                        symbol: asset,
                        quantity: quantity,
                        averagePrice: currentPrice
                    }
                })
            ]);
        }

        await interaction.reply(`Successfully invested $${cost.toLocaleString()} in ${assetInfo.name} (${quantity.toLocaleString()} ${assetInfo.type === 'crypto' ? asset : 'shares'})!`);
    }

    public async sellRun(interaction: ChatInputCommandInteraction) {
        const asset = interaction.options.getString('asset', true);
        const amount = interaction.options.getString('amount', true);
        
        const { isSpend, value } = parseInput(amount);
        if (isNaN(value) || value <= 0) {
            await interaction.reply('Please enter a valid amount to sell.');
            return;
        }
        
        const assetInfo = ASSETS.find(a => a.symbol === asset);
        if (!assetInfo) {
            await interaction.reply('Unknown asset. Please choose a valid stock or cryptocurrency.');
            return;
        }
        
        const currentPrice = CurrentPrices.get(asset);
        if (!currentPrice) {
            await interaction.reply('Current price for that asset is unavailable. Please try again later.');
            return;
        }
        
        const quantityToSell = isSpend ? value / currentPrice : value;
        
        const existingInvestment = await prisma.investment.findUnique({
            where: {
                userId_symbol: {
                    userId: interaction.user.id,
                    symbol: asset
                }
            }
        });
        if (!existingInvestment || existingInvestment.quantity.lt(quantityToSell)) {
            await interaction.reply('You do not have enough of that asset to sell.');
            return;
        }
        
        const revenue = quantityToSell * currentPrice;
        
        await prisma.$transaction([
            prisma.user.update({
                where: { id: interaction.user.id },
                data: {
                    money: {
                        increment: revenue
                    }
                }
            }),
            prisma.investment.update({
                where: {
                    userId_symbol: {
                        userId: interaction.user.id,
                        symbol: asset
                    }
                },
                data: {
                    quantity: existingInvestment.quantity.sub(quantityToSell)
                }
            })
        ]);
        
        await interaction.reply(`Successfully sold ${quantityToSell.toLocaleString()} ${assetInfo.type === 'crypto' ? asset : 'shares'} of ${assetInfo.name} for $${revenue.toLocaleString()}!`);
    }

    public async viewRun(interaction: ChatInputCommandInteraction) {
        const investments = await prisma.investment.findMany({
            where: {
                userId: interaction.user.id
            }
        });

        if (investments.length === 0) {
            await interaction.reply('Your portfolio is empty. Use `/portfolio invest` to start investing!');
            return;
        }

        const paginatedMessage = new PaginatedMessage();
        for (const investmentsChunk of chunk(investments, 5)) {
            const page = investmentsChunk.map(investment => {
                const asset = ASSETS.find(a => a.symbol === investment.symbol);
                const currentPrice = CurrentPrices.get(investment.symbol);
                if (!asset ||!currentPrice) return `Unknown Asset **${investment.symbol}**`;
                

                return [
                    `${asset.name} (**${asset.symbol}**) (${calculatePercentage(investment.averagePrice.toNumber(), currentPrice)}%)`,
                    `${investment.quantity} ${asset.type === 'crypto' ? asset.symbol : 'shares'} (**$${(investment.quantity.mul(currentPrice)).toLocaleString()}**)`,
                    `Average Price: $${investment.averagePrice.toLocaleString()}`,
                ]
            });

            const embed = new EmbedBuilder()
                .setColor(Colors.Primary)
                .setTitle('Investment Portfolio')
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(page.join('\n\n'));

            paginatedMessage.addPageEmbed(embed);
        }

        await paginatedMessage.run(interaction);
    }

    registerApplicationCommands(registry: ApplicationCommandRegistry) {
            registry.registerChatInputCommand((builder) => {
                builder
                    .setName('portfolio')
                    .setDescription('Manage your investment portfolio')
                    .addSubcommand((sub) =>
                        sub
                            .setName('invest')
                            .setDescription('Invest in a stock or cryptocurrency')
                            .addStringOption((option) =>
                                option
                                    .setName('asset')
                                    .setDescription('The stock ticker or crypto symbol to invest in')
                                    .setRequired(true)
                                    .addChoices(
                                        { name: 'Bitcoin (BTC)', value: 'BTC' },
                                        { name: 'Ethereum (ETH)', value: 'ETH' },
                                        { name: 'Solana (SOL)', value: 'SOL' },
                                        { name: 'Binance Coin (BNB)', value: 'BNB' },
                                        { name: 'Ripple (XRP)', value: 'XRP' },
                                        { name: 'Litecoin (LTC)', value: 'LTC' },
                                        { name: 'Dogecoin (DOGE)', value: 'DOGE' },
                                        { name: 'Cardano (ADA)', value: 'ADA' },
                                        { name: 'Apple (AAPL)', value: 'AAPL' },
                                        { name: 'Tesla (TSLA)', value: 'TSLA' },
                                        { name: 'Amazon (AMZN)', value: 'AMZN' },
                                        { name: 'SPY (SPY)', value: 'SPY' },
                                        { name: 'QQQ (QQQ)', value: 'QQQ' },
                                        { name: 'Gold (XAU)', value: 'XAU' },
                                        { name: 'Silver (XAG)', value: 'XAG' },
                                        { name: 'Oil (OIL)', value: 'OIL' }
                                    )
                            )
                            .addStringOption((option) =>
                                option
                                    .setName('amount')
                                    .setDescription('The amount of money to invest')
                                    .setRequired(true)
                            )
                    )
                    .addSubcommand((sub) =>
                        sub
                            .setName('sell')
                            .setDescription('Sell an asset from your portfolio')
                            .addStringOption((option) =>
                                option
                                    .setName('asset')
                                    .setDescription('The stock ticker or crypto symbol to sell')
                                    .setRequired(true)
                            )
                            .addStringOption((option) =>
                                option
                                    .setName('amount')
                                    .setDescription('The amount of the asset to sell')
                                    .setRequired(true)
                            )
                    )
                    .addSubcommand((sub) =>
                        sub
                            .setName('view')
                            .setDescription('View your current portfolio')
                    );
            });
    }
}