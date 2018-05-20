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

var countries = [];
for(var key in countryIsoCode) {
    countries.push(key);
}

function init() {
    d3.json("https://raw.githubusercontent.com/gabz129/visualization-d3/master/data/lines.json").then(function(data) {
        rawData = data;
        renderBarChart();
        renderScatterPlot(countries);
        renderTimeLine(countries);
    });
}
