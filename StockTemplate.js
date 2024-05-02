const stockTemplate = 
`{{#each @root}}
<div class="container-child">
    <h2 data-ticker={{ticker}}>{{ticker}}</h2>
    <table>
        <thead>
        {{#if (eq ticker "USDEUR")}}
            <th>Date</th>
        {{else}}
            <th>$</th>
        {{/if}}
            <th>€</th>
        </thead>
        <tbody>
        {{#each history}}
            <tr class="hidable row_{{dateOutput}}">
            {{#if (eq ../ticker "USDEUR")}}
                <td class="cursor-grab" data-date="{{dateOutput}}" onmouseover="hoverDate(this)">{{formatted_date date}}</td>
                <td><strong>{{toFixed value ${decimalPlacesExchange}}}</strong></td>
            {{else}}
                <td class="{{ifNull value 'null' ''}}">{{toFixed value ${decimalPlacesStock}}}</td>
                <td 
                    class="copyable {{ifNull value 'null' ''}} {{redGreenOrNothing ../history @index 'convertedValue'}}" 
                    data-copyable="{{convertedValue}}" onClick="clickedCell(this)"
                >
                    <strong>{{toFixed convertedValue ${decimalPlacesStock}}}</strong>
                </td>
            {{/if}}
        </tr>
        {{/each}}
      </tbody>
    </table>
    <button class="btn btn-primary" style="width:100%" onClick="copyStock(this)">Copy all</button>
</div>
{{/each}}
`
