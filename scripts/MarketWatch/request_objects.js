// https://www.wsj.com/market-data/quotes/index/SPX/advanced-chart
// https://stackoverflow.com/questions/57919492/scraping-extract-data-from-charts
const wsj_APIURL = "https://api-secure.wsj.net/api/michelangelo/timeseries/history"
const wsj_token = "cecc4267a0194af89ca343805a3e57af"

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
        "IncludeMockTick":true, // Removing this one, won't show the closing value for the current day :shrug:
        "Series": series,
        "Step": "P1D",
        "TimeFrame": timePeriod,
    }
}

const wsjHeaders = { 
    'Dylan2010.EntitlementToken': wsj_token
}