import YahooFinance from 'yahoo-finance2';

const yahoo = new YahooFinance();

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
    yahooSymbol?: string;
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
        type: 'stock',
        yahooSymbol: 'AAPL'
    },
    {
        name: 'Tesla',
        symbol: 'TSLA',
        type: 'stock',
        yahooSymbol: 'TSLA'
    },
    {
        name: 'Amazon',
        symbol: 'AMZN',
        type: 'stock',
        yahooSymbol: 'AMZN'
    },
    {
        name: 'Cloudflare',
        symbol: 'NET',
        type: 'stock',
        yahooSymbol: 'NET'
    },
    {
        name: 'Dell',
        symbol: 'DELL',
        type: 'stock',
        yahooSymbol: 'DELL'
    },
    {
        name: 'Microsoft',
        symbol: 'MSFT',
        type: 'stock',
        yahooSymbol: 'MSFT'
    },
    {
        name: 'NVIDIA',
        symbol: 'NVDA',
        type: 'stock',
        yahooSymbol: 'NVDA'
    },
    {
        name: 'Meta',
        symbol: 'META',
        type: 'stock',
        yahooSymbol: 'META'
    },
    {
        name: 'Google',
        symbol: 'GOOGL',
        type: 'stock',
        yahooSymbol: 'GOOGL'
    },
    {
        name: 'Netflix',
        symbol: 'NFLX',
        type: 'stock',
        yahooSymbol: 'NFLX'
    },
    {
        name: 'Intel',
        symbol: 'INTC',
        type: 'stock',
        yahooSymbol: 'INTC'
    },
    {
        name: 'AMD',
        symbol: 'AMD',
        type: 'stock',
        yahooSymbol: 'AMD'
    },
    {
        name: 'Micron Technology',
        symbol: 'MU',
        type: 'stock',
        yahooSymbol: 'MU'
    },
    {
        name: 'Strategy',
        symbol: 'MSTR',
        type: 'stock',
        yahooSymbol: 'MSTR'
    },
    {
        name: 'SPY',
        symbol: 'SPY',
        type: 'stock',
        yahooSymbol: 'SPY'
    },
    {
        name: 'Vanguard Total Stock Market ETF',
        symbol: 'VTI',
        type: 'stock',
        yahooSymbol: 'VTI'
    },
    {
        name: 'Vanguard Total World Stock ETF',
        symbol: 'VT',
        type: 'stock',
        yahooSymbol: 'VT'
    },
    {
        name: 'Vanguard Total International Stock ETF',
        symbol: 'VXUS',
        type: 'stock',
        yahooSymbol: 'VXUS'
    },
    {
        name: 'Vanguard S&P 500 ETF',
        symbol: 'VOO',
        type: 'stock',
        yahooSymbol: 'VOO'
    },
    {
        name: 'QQQ',
        symbol: 'QQQ',
        type: 'stock',
        yahooSymbol: 'QQQ'
    },
    {
        name: 'Gold',
        symbol: 'XAU',
        type: 'commodity',
        yahooSymbol: 'GC=F'
    },
    {
        name: 'Silver',
        symbol: 'XAG',
        type: 'commodity',
        yahooSymbol: 'SI=F'
    },
    {
        name: 'Oil',
        symbol: 'OIL',
        type: 'commodity',
        yahooSymbol: 'CL=F'
    }
];

function isWeekendInNewYork(date = new Date()) {
    const nyDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const day = nyDate.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

export async function cachePrices(firstRun = false) {
    const cryptos = ASSETS.filter(asset => asset.type === 'crypto');
    const prices = await fetchCryptoPrices(...cryptos.map(asset => asset.coingeckoId!));

    for (const [key, value] of Object.entries(prices)) {
        const symbol = cryptos.find(asset => asset.coingeckoId === key)?.symbol;
        if (symbol) {
            CurrentPrices.set(symbol, value.usd);
        }
    }

    if (!firstRun && isWeekendInNewYork()) return;
    const stocks = ASSETS.filter(asset => asset.type === 'stock' || asset.type === 'commodity');
    const quotes = await yahoo.quote(stocks.map(asset => asset.yahooSymbol!), { fields: ['regularMarketPrice'] });
    for (const quote of quotes) {
        const symbol = stocks.find(asset => asset.yahooSymbol === quote.symbol)?.symbol;
        if (symbol) {
            CurrentPrices.set(symbol, quote.regularMarketPrice);
        }
    }
}

export function calculatePercentage(averagePrice: number, currentPrice: number) {
    const raw = (currentPrice - averagePrice) / averagePrice * 100;
    return Math.round(raw * 100) / 100; // Round to 2 decimal places
}