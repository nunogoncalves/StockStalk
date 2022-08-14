const usdInEurTicker = "CURRENCY/US/XTUP/USDEUR"
const allTickers = [
    "STOCK/US/XNYS/FTCH",
    "FUND/NL/XAMS/VUSA",
    "STOCK/US/XNAS/AAPL",
    "STOCK/US/XNYS/SHOP",
    "STOCK/US/XNAS/MSFT",
    "STOCK/US/XNYS/DIS",
    "STOCK/US/XNAS/ABNB",
    "STOCK/US/XNAS/AMZN",
]

var timePeriod = "P1M"

var hideNonSelectedDates = false

function loadTickers(tickers) {
    let series = tickers.map(ticker => {
        return {
            "DataTypes": ["Last"],
            "Dialect": "Charting",
            "Key": ticker,
            "Kind": "Ticker",
            "SeriesId": "s1"
        }
    })
    let json = {
        "EntitlementToken": "cecc4267a0194af89ca343805a3e57af",
        "IncludeOfficialClose": true,
        "Series": series,
        "Step": "P1D",
        "TimeFrame": timePeriod,
        "WantPriorClose": true
    }
    let jsonText = JSON.stringify(json)

    var request = new Request(
        `https://api-secure.wsj.net/api/michelangelo/timeseries/history?json=${jsonText}&ckey=cecc4267a0`, 
        { 
            method: 'GET', 
            headers: new Headers({ 
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
            }) 
        });

    return fetch(request) 
    .then((response) => response.json())
    .then(jsonResponse => { 

        let dates = jsonResponse.TimeInfo.Ticks

        return jsonResponse.Series.map(serie => {
            let dataPoints = serie.DataPoints.flatMap(num => num)
            let values = zip(dates, dataPoints).map(item => ({ date: item[0], value: item[1] }))
            return { ticker: serie.Ticker, values: values }
        })
    }) 
    .catch(err => { 
        print(err)
    });
}

function loadAllTickers() {

    $("#date_input").val(new Date().toLocaleDateString("en-CA")) // Hammer time yeah!
    $("#date_input").attr("max", new Date().toLocaleDateString("en-CA")) // Hammer time yeah!
    $("#date_input").change(clickedDateBox($("#date-picker")))
    
    let tickers = [usdInEurTicker].concat(allTickers)
    let tickersRequests = chunkArray(tickers, 5)
    let reqs = tickersRequests.map(requestTickers => loadTickers(requestTickers))

    Promise
    .all(reqs)
    .then(responses => {
        let tickerValues = responses.flatMap(response => response)                
        let usdToEur = tickerValues.find(element => element.ticker == "USDEUR")
        let tickers = tickerValues.filter(element => element.ticker != "USDEUR")

        let euroAt = (date => usdToEur.values.find(element => element.date == date) )

        var tableData = { headers: ['Date', '€'], body: []}

        tableData.body = usdToEur.values.map((stockAtDate, index) => {
            let date = new Date(stockAtDate.date).toLocaleDateString("pt-PT").replaceAll("/", "-")

            return {
                row: { date: date },
                one: { classes: [], displayValue: date }, 
                two: { classes: [], displayValue: stockAtDate.value.toFixed(4) } 
            }
        })
        
        $("#date_input").attr("min", new Date(usdToEur.values[0].date).toLocaleDateString("en-CA")) // Hammer time yeah!

        let currency = `
            <div class="container-child">
                <h1>${usdToEur.ticker}</h1>
                ${buildTableHTML(tableData)}
            </div>
        `

        let stocks = tickers.map(ticker => {

            tableData = { headers: ['$', '€'], body: []}

            tableData.body = ticker.values.map(value => {
                let date = new Date(value.date).toLocaleDateString("pt-PT").replaceAll("/", "-")
                let stockValue = value.value ?? 0
                let inEuro = stockValue * ((ticker.ticker == "VUSA") ? 1 : euroAt(value.date).value)

                let dollarClasses = value.value == null ? "null" : ""
                let valueClasses = value.value == null ? "null" : "copyable"
                
                return { 
                    row: { date: date },
                    one: { 
                        classes: dollarClasses,
                        displayValue: stockValue.toFixed(4) 
                    }, 
                    two: { 
                        displayValue: inEuro.toFixed(4),
                        copyableValue: inEuro,
                        classes: valueClasses,
                        null: value.value == 0
                    }
                }
            })

            return `
                <div class="container-child">
                <h1>${ticker.ticker}</h1>
                ${buildTableHTML(tableData)}
                </div>`
        }).join('')

        let html = currency + stocks
        $("#mainContainer").html(html)
        clickedDateBox()
    })
}

function changedDate(element) {
    clickedDateBox()
}

function clickedDateBox() {
    $(".highlighted").each((i, tr) => $(tr).removeClass("highlighted"))

    let date = new Date($("#date_input").val()).toLocaleDateString().replaceAll("/", "-")
    let dateClass = `row_${date}`
     $(`.${dateClass}`).each((i, tr) => $(tr).addClass("highlighted"))
     changedVisibility()
}

function changedVisibility() {    
    if ($("#visibility_input").is(":checked")) {

        $("tr.hidable").not(".highlighted").hide()
        $("tr.highlighted").show()
    } else {
        $("tr.hidable").show()
    }
}

function changedTimePeriod(element) {
    timePeriod = $(element).val()
    loadAllTickers()
}

function clickedCell(td) {
    let toCopy = `${$(td).data("copyable")}`
    let text = toCopy.replaceAll(".", ",")
    navigator.clipboard.writeText(text);
    $("#copied-text-p").text("Copied text " + text)
}

function buildTableHTML(tableData) {
    let headers = tableData.headers.map(h => `<th>${h}</th>`).join('')
    
    let bodyRows = tableData.body.map(b => {
        return `<tr class="highlighted hidable row_${b.row.date}">
            <td class="${b.one.classes}">${b.one.displayValue}</td>
            <td class="${b.two.classes}" 
                data-copyable="${b.two.copyableValue ?? ""}"
                onClick="clickedCell(this)"
                >${b.two.displayValue}</td>
        </tr>\n`
    }).join('')

    return `
    <table>
      <thead>
        <tr>${headers}</tr>
      </thead>
      <tbody>
        ${bodyRows}
    </table>
    `
}