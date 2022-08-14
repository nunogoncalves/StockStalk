class StockHistory {

    constructor(serie, dates, exchange) {
        this.name = serie.CommonName
        this.ticker = serie.Ticker
        
        let values = serie.DataPoints.flatMap(num => num)

        this.history = dates.map((date, index) => {
            let exchangeValue = serie.FormatHints.UnitSymbol == "€" ? 1 : exchange.valueFor(date)
            return {
                date: date,
                dateOutput: new Date(date).toLocaleDateString("pt-PT").replaceAll("/", "-"),
                value: values[index],
                convertedValue: values[index] * exchangeValue
            }
        })
    }
}

class Exchange {

    constructor(serie, dates) {
        this.name = serie.CommonName
        this.ticker = serie.Ticker
        this.history = zip(dates, serie.DataPoints.flatMap(num => num))
            .map(day => {
                return {
                    date: day[0], 
                    dateOutput: new Date(day[0]).toLocaleDateString("pt-PT").replaceAll("/", "-"),
                    value: day[1]
                }
            })
    }

    valueFor(date) {
        return this.history.find(day => day.date == date).value
    }
}