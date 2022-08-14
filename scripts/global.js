var hideNonSelectedDates = false

function loadTickers(tickers) {

    return fetch(requestFor(tickers)) 
        .then(response => response.json())
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
                    let inEuro = stockValue * ((ticker.ticker == "VUSA") ? 1 : euroAt(value.date)?.value ?? "")

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