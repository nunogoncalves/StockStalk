const exchangeTicker = "CURRENCY/US/XTUP/USDEUR"
const allTickers = [
    "STOCK/US/XNYS/FTCH",
    "FUND/NL/XAMS/VUSA",
    "STOCK/US/XNAS/AAPL",
    "STOCK/US/XNYS/SHOP",
    "STOCK/US/XNAS/MSFT",
    "STOCK/US/XNYS/DIS",
    "STOCK/US/XNAS/ABNB",
    "STOCK/US/XNAS/AMZN",
    "STOCK/US/XNAS/TSLA"
]

const timePeriods = ["P1M", "P3M", "P3M", "P1Y", "P3Y"] 
var timePeriod = "P1M"

function requestFor(tickers) {

    let series = marketWatchSeries(tickers)
    let query = marketWatchQuery(series, timePeriod)

    let jsonText = JSON.stringify(query)

    return new Request(
        `${wsj_APIURL}?json=${jsonText}&ckey=cecc4267a0`, 
        { headers: new Headers(wsjHeaders) }
    );
}
