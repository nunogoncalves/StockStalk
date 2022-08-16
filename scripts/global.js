const decimalPlacesStock = 2
const decimalPlacesExchange = 4
const maxWSJAPITickersPerRequest = 5
var hideNonSelectedDates = false

function load() {

    let dateInput = elementById("date_input")
    dateInput.value = yyyyMMddFormatted(new Date()) // Hammer time yeah!
    dateInput.setAttribute("max", yyyyMMddFormatted(new Date())) // Hammer time yeah!
    dateInput.addEventListener('change', clickedDateBox);

    elementById("stock_template").innerHTML = stockTemplate
    bootstrap.Toast.Default.delay = 1000

    registerTemplateCustomFunctions()
    loadAllTickers()
}

function registerTemplateCustomFunctions() {
    Handlebars.registerHelper('eq', (arg1, arg2) => arg1 === arg2)
    Handlebars.registerHelper('toFixed', (arg1, arg2) => arg1 == null ? "" : arg1.toFixed(arg2))
    Handlebars.registerHelper('formatted_date', (arg1) => new Date(arg1).toLocaleDateString("pt-PT"))
    Handlebars.registerHelper('ifNull', (arg1, val1, val2) => (arg1 == null ? val1 : val2))
}

function loadAllTickers() {

    // WSJ api only allows for a maximum of 5 tickers. We want to include the exchange ticker in the request
    // to have all dates in the response 
    // (exchange returns all days, whereas stocks depend on the market being open)
    let tickersRequests = chunkArray(allTickers, maxWSJAPITickersPerRequest - 1)
    let reqs = tickersRequests.map(requestTickers => loadTickers(requestTickers.concat(exchangeTicker)))

    Promise
        .all(reqs)
        .then(responses => {
            let stocksAndExchanges = responses.flatMap(response => response)
            let exchange = stocksAndExchanges.find(element => element.ticker == "USDEUR")
            stocks = stocksAndExchanges.filter(element => element.ticker != "USDEUR")

            elementById("date_input").setAttribute("min", yyyyMMddFormatted(new Date(exchange.history[0].date))) // Hammer time yeah!

            let source = elementById("stock_template").innerHTML
            let template = Handlebars.compile(source)
            let html = template([exchange].concat(stocks))
            elementById("mainContainer").innerHTML = html
        })
        .catch(error => {
            show(elementById("errorContainer"))
            elementById("errorMessage").innerHTML = error.message
        })
}

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
}

function changedDate(element) {
    clickedDateBox()
}

function clickedDateBox() {
    elementsByClass("highlighted").forEach(tr => removeClass("highlighted", tr))

    let date = new Date(elementById("date_input").value).toLocaleDateString().replaceAll("/", "-")
    let dateClass = `row_${date}`
    elementsByClass(dateClass).forEach(tr => addClass("highlighted", tr))
    changedVisibility()
}

function changedVisibility() {    
    if (elementById("visibility_input").checked == true) {
        elementsByQuery("tr.hidable:not([highlighted])").forEach(tr => hide(tr))
        elementsByQuery("tr.highlighted").forEach(tr => show(tr))
    } else {
        elementsByQuery("tr.hidable").forEach(tr => show(tr))
    }
}

function changedTimePeriod(element) {
    timePeriod = element.value
    loadAllTickers()
}

function goToNextDay() {

    var date = new Date(elementById("date_input").value)
    date.setDate(date.getDate() + 1)
    if(date.getDay() === 6) {
        date.setDate(date.getDate() + 2)
    } else if(date.getDay() === 0) {
        date.setDate(date.getDate() + 1)
    }
    updateHighlighted(date)
}

function goToPreviousDay() {

    var date = new Date(elementById("date_input").value)
    date.setDate(date.getDate() - 1)
    if(date.getDay() === 6) {
        date.setDate(date.getDate() - 1)
    } else if(date.getDay() === 0) {
        date.setDate(date.getDate() - 2)
    }
    updateHighlighted(date)
}

function updateHighlighted(date) {
    elementsByClass("highlighted").forEach(tr => removeClass("highlighted", tr))
    elementById("date_input").value = yyyyMMddFormatted(date)
    clickedDateBox()
}

function clickedCell(td) {
    let toCopy = td.dataset.copyable
    let text = `${toCopy}`.replaceAll(".", ",")
    copy(text)
}

function hoverDate(element) {
    let date = element.dataset.date
    elementsByClass("hovered-date").forEach(element => removeClass("hovered-date", element))
    elementsByClass("row_" + date).forEach(element => addClass("hovered-date", element))
}

function hoverOutDate(element) {
    let date = element.dataset.date
    elementsByClass("hovered-date").forEach(element => removeClass("hovered-date", element))
}

function copySelected() {
    let toCopy = elementsByQuery("tr.highlighted .copyable").map(element => element.dataset.copyable).join('\t\t')
    copy(toCopy.replaceAll(".", ","))
}

function copy(text) {

    navigator.clipboard.writeText(text);

    const toastLiveExample = elementById('liveToast')
    elementsByClass("toast-body")[0].innerHTML = "Copied text " + text + " to the clipboard"
    const toast = new bootstrap.Toast(toastLiveExample)
    toast.show()
}

function copyStock(button) {

    let ticker = button.closest(".container-child").querySelector("h2").dataset.ticker
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