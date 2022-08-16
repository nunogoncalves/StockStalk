const decimalPlacesStock = 2
const decimalPlacesExchange = 4
const maxWSJAPITickersPerRequest = 5
var hideNonSelectedDates = false

function load() {

    $("#date_input").val(yyyyMMddFormatted(new Date())) // Hammer time yeah!
    $("#date_input").attr("max", yyyyMMddFormatted(new Date())) // Hammer time yeah!
    $("#date_input").change(clickedDateBox($("#date-picker")))

    $("#stock_template").html(stockTemplate)
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

            $("#date_input").attr("min", yyyyMMddFormatted(new Date(exchange.history[0].date))) // Hammer time yeah!

            let source = $("#stock_template").html()
            let template = Handlebars.compile(source)
            let html = template([exchange].concat(stocks))
            $("#mainContainer").html(html)
        })
        .catch(error => {
            $("#errorContainer").show()
            $("#errorMessage").text(error.message)
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

    var date = new Date($("#date_input").val())
    date.setDate(date.getDate() + 1)
    if(date.getDay() === 6) {
        date.setDate(date.getDate() + 2)
    } else if(date.getDay() === 0) {
        date.setDate(date.getDate() + 1)
    }
    updateHighlighted(date)
}

function goToPreviousDay() {

    var date = new Date($("#date_input").val())
    date.setDate(date.getDate() - 1)
    if(date.getDay() === 6) {
        date.setDate(date.getDate() - 1)
    } else if(date.getDay() === 0) {
        date.setDate(date.getDate() - 2)
    }
    updateHighlighted(date)
}

function updateHighlighted(date) {
    $(".highlighted").each((i, tr) => $(tr).removeClass("highlighted"))
    $("#date_input").val(yyyyMMddFormatted(date))
    clickedDateBox()
}

function clickedCell(td) {
    let toCopy = $(td).data("copyable")
    let text = `${toCopy}`.replaceAll(".", ",")
    copy(text)
}

function hoverDate(element) {
    let date = $(element).data("date")
    $.each($(".hovered-date"), (i, element) => $(element).removeClass("hovered-date"))
    $.each($(".row_" + date), (i, element) => $(element).addClass("hovered-date"))
}

function hoverOutDate(element) {
    let date = $(element).data("date")
    $.each($(".hovered-date"), (i, element) => $(element).removeClass("hovered-date"))
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