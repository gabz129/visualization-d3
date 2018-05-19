var countryClass = "flag flag-32 flag-";
var idx_colour = 0;
var countryIsoCode = {
    Argentina: { flag: countryClass + "ar", colour: d3.schemeCategory10[idx_colour++]}, 
    England: { flag: countryClass + "england", colour: d3.schemeCategory10[idx_colour++]}, 
    Portugal: { flag: countryClass + "pt", colour: d3.schemeCategory10[idx_colour++]}, 
    //Hungary: { flag: countryClass + "hu", colour: d3.schemeCategory10[idx_colour++]}, 
    Mexico: { flag: countryClass + "mx", colour: d3.schemeCategory10[idx_colour++]}, 
    Chile: { flag: countryClass + "cl", colour: d3.schemeCategory10[idx_colour++]}, 
    Spain: { flag: countryClass + "es", colour: d3.schemeCategory10[idx_colour++]}, 
    France: { flag: countryClass + "fr", colour: d3.schemeCategory10[idx_colour++]}, 
    Japan: { flag: countryClass + "jp", colour: d3.schemeCategory10[idx_colour++]}, 
    Italy: { flag: countryClass + "it", colour: d3.schemeCategory10[idx_colour++]}, 
    China: { flag: countryClass + "cn", colour: d3.schemeCategory10[idx_colour++]}
}
var rawData = {};
function processData(raw_data, startYear, endYear) {
    if ( !startYear ) startYear = 0;
    if ( !endYear ) endYear = 99999;
    var data = raw_data.filter(function (d) {return d.station_opening >= startYear && d.station_opening <= endYear });
    return d3.nest()
        .key(function(d) {
            return d.city_country;
        })
        .rollup(function(groupByCountry) {
            var groupByLine = d3.nest()
                .key(function(d2) { return d2.line_name; })
                .entries(groupByCountry);
            var lines_meters = 0;if ( !startYear ) startYear = 0;
            if ( !endYear ) endYear = 99999;
            for (let index = 0; index < groupByLine.length; index++) {
                const line = groupByLine[index];
                //console.log(line);
                sortData = d3.entries(line.values)
                // sort by value descending
                .sort(function(a, b) { return d3.descending(a.line_meters_acumulated, b.line_meters_acumulated); })
                // take the first option    
                lines_meters += sortData[sortData.length -1].value.line_meters_acumulated - sortData[0].value.line_meters_acumulated; 
            }
            return lines_meters;
        })
        .entries(data).sort(function (a, b) {return a.value - b.value});
}

var losDatos = [];

var countries = [];
for(var key in countryIsoCode) {
    countries.push(key);
}

function init() {
    d3.json("https://raw.githubusercontent.com/gabz129/visualization-d3/master/data/lines.json").then(function(data) {
        rawData = data;
        renderBarChart();
        renderScatterPlot(countries);
    });
}
