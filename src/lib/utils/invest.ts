
export const CurrentPrices = new Map<string, number>();

/**
 * Batch requests cryptos current price from CoinGecko
 * @param id CoinGecko IDs e.g bitcoin, ethereum
 */
export async function fetchCryptoPrices(...id: string[]) {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id.join(',')}&vs_currencies=usd`);

    if (!response.ok) {
        throw new Error(`Failed to fetch crypto price: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as Record<string, { usd: number }>;
    return data;
}

export interface Asset {
    name: string;
    symbol: string;
    type: 'crypto' | 'stock' | 'commodity';
    coingeckoId?: string;
}

export const ASSETS: Asset[] = [
    {
        name: 'Bitcoin',
        symbol: 'BTC',
        type: 'crypto',
        coingeckoId: 'bitcoin'
    },
    {
        name: 'Ethereum',
        symbol: 'ETH',
        type: 'crypto',
        coingeckoId: 'ethereum'
    },
    {
        name: 'Solana',
        symbol: 'SOL',
        type: 'crypto',
        coingeckoId: 'solana'
    },
    {
        name: 'Binance Coin',
        symbol: 'BNB',
        type: 'crypto',
        coingeckoId: 'binancecoin'
    },
    {
        name: 'Ripple',
        symbol: 'XRP',
        type: 'crypto',
        coingeckoId: 'ripple'
    },
    {
        name: 'Litecoin',
        symbol: 'LTC',
        type: 'crypto',
        coingeckoId: 'litecoin'
    },
    {
        name: 'Dogecoin',
        symbol: 'DOGE',
        type: 'crypto',
        coingeckoId: 'dogecoin'
    },
    {
        name: 'Cardano',
        symbol: 'ADA',
        type: 'crypto',
        coingeckoId: 'cardano'
    },
    {
        name: 'Apple',
        symbol: 'AAPL',
        type: 'stock'
    },
    {
        name: 'Tesla',
        symbol: 'TSLA',
        type: 'stock'
    },
    {
        name: 'Amazon',
        symbol: 'AMZN',
        type: 'stock'
    },
    {
        name: 'SPY',
        symbol: 'SPY',
        type: 'stock'
    },
    {
        name: 'QQQ',
        symbol: 'QQQ',
        type: 'stock'
    },
    {
        name: 'Gold',
        symbol: 'XAU',
        type: 'commodity'
    },
    {
        name: 'Silver',
        symbol: 'XAG',
        type: 'commodity'
    },
    {
        name: 'Oil',
        symbol: 'OIL',
        type: 'commodity'
    }
];

export async function cachePrices() {
    const cryptos = ASSETS.filter(asset => asset.type === 'crypto');
    const prices = await fetchCryptoPrices(...cryptos.map(asset => asset.coingeckoId!));

    for (const [key, value] of Object.entries(prices)) {
        const symbol = cryptos.find(asset => asset.coingeckoId === key)?.symbol;
        if (symbol) {
            CurrentPrices.set(symbol, value.usd);
        }
    }
}

export function calculatePercentage(averagePrice: number, currentPrice: number) {
    const raw = (currentPrice - averagePrice) / averagePrice * 100;
    return Math.round(raw * 100) / 100; // Round to 2 decimal places
}