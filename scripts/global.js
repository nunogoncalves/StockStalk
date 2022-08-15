var hideNonSelectedDates = false

function loadTickers(tickers) {

    return fetch(requestFor(tickers)) 
        .then(response => response.json())
        .then(jsonResponse => { 

            let dates = jsonResponse.TimeInfo.Ticks
            
            let exchangeRaw = jsonResponse.Series.find(serie => serie.Ticker == "USDEUR")
            let exchange = new Exchange(exchangeRaw, dates)

            let stocks = jsonResponse.Series
                .filter(serie => serie.Ticker != "USDEUR")
                .map(serie => new StockHistory(serie, dates, exchange))

            return [exchange].concat(stocks)
        })
        .catch(err => { 
            print(err)
        });
}

function load() {

    $("#date_input").val(new Date().toLocaleDateString("en-CA")) // Hammer time yeah!
    $("#date_input").attr("max", new Date().toLocaleDateString("en-CA")) // Hammer time yeah!
    $("#date_input").change(clickedDateBox($("#date-picker")))

    bootstrap.Toast.Default.delay = 1000
    loadAllTickers()
}

function loadAllTickers() {

    let tickersRequests = chunkArray(allTickers, 5)
    let reqs = tickersRequests.map(requestTickers => loadTickers(requestTickers))

    Promise
        .all(reqs)
        .then(responses => {
            let stocksAndExchanges = responses.flatMap(response => response)
            let exchange = stocksAndExchanges.find(element => element.ticker == "USDEUR")
            stocks = stocksAndExchanges.filter(element => element.ticker != "USDEUR")

            let tableData = { 
                headers: ['Date', '€'], 
                body: exchange.history.map(day => {
                    return {
                        row: { date: day.dateOutput },
                        one: { classes: [], displayValue: day.dateOutput }, 
                        two: { classes: [], displayValue: day.value.toFixed(4) } 
                    }                    
                })
            }

            $("#date_input").attr("min", new Date(exchange.history[0].date).toLocaleDateString("en-CA")) // Hammer time yeah!

            let exchangeHTML = `
                <div class="container-child">
                    <h1>${exchange.ticker}</h1>
                    ${buildTableHTML(tableData)}
                </div>
            `

            let stocksHTML = stocks.map(stock => {

                let tableData = { 
                    headers: ['$', '€'], 
                    body: stock.history.map(day => {
                        let dollarClasses = day.value == null ? "null" : ""
                        let valueClasses = day.value == null ? "null" : "copyable"

                        return {
                            row: { date: day.dateOutput },
                            one: { 
                                classes: dollarClasses, 
                                displayValue: day.value?.toFixed(4) ?? '' 
                            }, 
                            two: { 
                                classes: valueClasses, 
                                copyableValue: day.convertedValue,
                                displayValue: day.convertedValue?.toFixed(4) ?? ''
                            } 
                        }                    
                    })
                }

                return `
                    <div class="container-child">
                    <h1 data-ticker=${stock.ticker}>${stock.ticker}</h1>
                    ${buildTableHTML(tableData)}
                    </div>`
            }).join('')

            let html = exchangeHTML + stocksHTML
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

function goToNextDay() {
    $(".highlighted").each((i, tr) => $(tr).removeClass("highlighted"))

    var date = new Date($("#date_input").val())
    date.setDate(date.getDate() + 1)

    $("#date_input").val(new Date(date).toLocaleDateString("en-CA"))
    clickedDateBox()
}

function goToPreviousDay() {
    $(".highlighted").each((i, tr) => $(tr).removeClass("highlighted"))

    var date = new Date($("#date_input").val())
    date.setDate(date.getDate() - 1)

    $("#date_input").val(new Date(date).toLocaleDateString("en-CA"))
    clickedDateBox()
}

function clickedCell(td) {
    let toCopy = $(td).data("copyable")
    let text = `${toCopy}`.replaceAll(".", ",")
    copy(text)
}

function copySelected() {
    let toCopy = $.map($("tr.highlighted .copyable"), (element) => $(element).data("copyable")).join('\t\t')
    copy(toCopy.replaceAll(".", ","))
}

function copy(text) {

    navigator.clipboard.writeText(text);

    const toastLiveExample = document.getElementById('liveToast')
    $(".toast-body").text("Copied text " + text + " to the clipboard")
    const toast = new bootstrap.Toast(toastLiveExample)
    toast.show()
}

function copyStock(button) {
    let ticker = $($(button).closest(".container-child").find("h1")[0]).data("ticker")
    let stock = stocks.find(stock => stock.ticker == ticker)

    var d__ = new Date(stock.history[0].date).getDate()
    let text = stock.history.map(day => { 

        var string = "" 
        let date = new Date(day.date)
        if (date.getDate() > d__ + 1) {
            string += "--\t \n--\t \n" 
        }
        d__ = date.getDate()

        string += "" + day.dateOutput + "\t" + `${day.convertedValue}`.replaceAll(".", ",")
        return string 
    }).join("\n")
    copy(text)
}

function buildTableHTML(tableData) {
    let headers = tableData.headers.map(h => `<th>${h}</th>`).join('')
    
    let bodyRows = tableData.body.map(b => {
        return `<tr class="highlighted hidable row_${b.row.date}">
            <td class="${b.one.classes}">${b.one.displayValue}</td>
            <td class="${b.two.classes}" 
                data-copyable="${b.two.copyableValue ?? ""}"
                onClick="clickedCell(this)"
                ><strong>${b.two.displayValue}</strong></td>
        </tr>\n`
    }).join('')

    return `
    <table>
      <thead>
        <tr>${headers}</tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
    <button class="btn btn-primary" style="width:100%" onClick="copyStock(this)">Copy all</button>
    `
}