function marketWatchSeries(tickers) {
    return tickers.map(ticker => ({
        "DataTypes": ["Last"],
        "Dialect": "Charting",
        "Key": ticker,
        "Kind": "Ticker",
        "SeriesId": "s1"
    }))
}

function marketWatchQuery(series, timePeriod) {
    return {
        "EntitlementToken": "cecc4267a0194af89ca343805a3e57af",
        "IncludeOfficialClose": true,
        "Series": series,
        "Step": "P1D",
        "TimeFrame": timePeriod,
        "WantPriorClose": true
    }
}

const marketWatchAPIURL = "https://api-secure.wsj.net/api/michelangelo/timeseries/history"

const marketWatchHeaders = { 
    'Host': 'api-secure.wsj.net',
    'Origin': 'https://www.marketwatch.com',
    'Connection': 'keep-alive',
    'Dylan2010.EntitlementToken': 'cecc4267a0194af89ca343805a3e57af',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15',
    'Accept-Language': 'en-GB,en;q=0.9',
    'Referer': 'https://www.marketwatch.com/',
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json; charset=utf-8',
}