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

function renderBarChart(startYear, endYear) {
    data = processData(rawData, startYear, endYear);

    var canvas = d3.select("#d3-container");
    canvas.selectAll("*").remove();

    var svg = canvas.append("svg").attr("width", 250).attr("height", 500);
    var margin = {top: 20, right: 20, bottom: 30, left: 80};
    var width = 250 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;
  
    var tooltip = d3.select("body").append("div").attr("class", "toolTip");
    
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleBand().range([height, 0]);

    var g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain([0, d3.max(data, function(d) { return d.value; })]);
    y.domain(data.map(function(d) { return d.key; })).padding(0.1);


        g.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")");
            // .call(d3.axisBottom(x)
            //     // Agrega lineas verticales
            //     .ticks(0)
            //     //.tickFormat(function(d) { return parseInt(d / 1000); }).tickSizeInner(0)
            // );

        
        g.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y));

        g.selectAll(".bar")
            .data(data)
        .enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("y", function(d) { return y(d.key); })
            .attr("width", function(d) { return x(d.value); })
            .on("mousemove", function(d){
                tooltip
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY - 70 + "px")
                .style("display", "inline-block")
                .html((d.key) + "<br>" + (d.value) + "mts" );
            })
            .on("mouseout", function(d){ tooltip.style("display", "none");});
}
