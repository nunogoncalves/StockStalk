const stockTemplate = 
`{{#each @root}}
<div class="container-child">
    <h1 data-ticker={{ticker}}>{{ticker}}</h1>
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
                <td><strong>{{toFixed value 4}}</strong></td>
            {{else}}
                <td class="{{ifNull value 'null' ''}}">{{toFixed value 4}}</td>
                <td class="copyable {{ifNull value 'null' ''}}" data-copyable="{{convertedValue}}" onClick="clickedCell(this)"><strong>{{toFixed convertedValue 4}}</strong></td>
            {{/if}}
        </tr>
        {{/each}}
      </tbody>
    </table>
    <button class="btn btn-primary" style="width:100%" onClick="copyStock(this)">Copy all</button>
</div>
{{/each}}
`
