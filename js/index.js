var countryClass = "flag flag-32 flag-";
var countryIsoCode = {
    Argentina: countryClass + "ar",
    England: countryClass + "england",
    Portugal: countryClass + "pt",
    Hungary: countryClass + "hu",
    Mexico: countryClass + "mx",
    Chile: countryClass + "cl",
    Spain: countryClass + "es",
    France: countryClass + "fr",
    Japan: countryClass + "jp",
    Italy: countryClass + "it",
    China: countryClass + "cn"
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
            var lines_meters = 0;
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

function init() {
    d3.json("https://raw.githubusercontent.com/gabz129/visualization-d3/master/data/lines.json").then(function(data) {
        rawData = data;
        renderBarChart();
    });
}