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

    $("#stock_template").html(stockTemplate)
    bootstrap.Toast.Default.delay = 1000

    Handlebars.registerHelper('eq', function () {
        const args = Array.prototype.slice.call(arguments, 0, -1);
        return args.every(function (expression) {
            return args[0] === expression;
        });
    });

    Handlebars.registerHelper('toFixed', function(arg1, arg2) {
        return arg1 == null ? "" : arg1.toFixed(arg2)
    });

    Handlebars.registerHelper('formatted_date', function(arg1) {
        return new Date(arg1).toLocaleDateString("pt-PT")
    });

    Handlebars.registerHelper('ifNull', function(arg1, val1, val2) {
        return (arg1 == null ? val1 : val2)
    });

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

            $("#date_input").attr("min", new Date(exchange.history[0].date).toLocaleDateString("en-CA")) // Hammer time yeah!

            let source = $("#stock_template").html()
            let template = Handlebars.compile(source)
            let html = template([exchange].concat(stocks))
            $("#mainContainer").html(html)
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