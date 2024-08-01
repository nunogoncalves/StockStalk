const exchangeTicker = "CURRENCY/US/XTUP/USDEUR"

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
