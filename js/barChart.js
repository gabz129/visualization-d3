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

function renderBarChart(startYear, endYear) {
    data = processData(rawData, startYear, endYear);

    var canvas = d3.select("#d3-container");
    canvas.selectAll("*").remove();

    var svg = canvas.append("svg").attr("width", 250).attr("height", 500).attr("id", "svg_p");
    var margin = {top: 20, right: 20, bottom: 30, left: 80};
    var width = 250 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;
  
    var tooltip = d3.select("body").append("div").attr("class", "toolTip");
    
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleBand().range([height, 0]);

    var g = svg.append("g")
            .attr("id", "barChart_p")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain([0, d3.max(data, function(d) { return d.value; })]);
    y.domain(data.map(function(d) { return d.key; })).padding(0.1);


    g.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

    var bar = g.selectAll(".bar");
    
    bar.data(data)
        .enter().append("g")
        .on("mousemove", function(d){
            tooltip
            .style("left", d3.event.pageX - 20 + "px")
            .style("top", d3.event.pageY - 40 + "px")
            .style("display", "inline-block")
            .html((d.key) + "<br>" + (d.value) + " mts" );
        })
        .on("mouseout", function(d){ tooltip.style("display", "none");})
        .attr("class", "barContainer").append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("y", function(d) { return y(d.key); })
        .attr("width", function(d) { return x(d.value); });
        
    d3.selectAll(".barContainer").data(data).append("text")
    .attr("y", function (d, i) { 
        return d3.select(this).node().previousElementSibling.getBBox().y + 26;
    })
    .text(function(d){
        return d.key;
    });

    var chkAndFlagsContainer = d3.selectAll(".y.axis").selectAll("g")
        .data(data)
        .append("g")
        .attr("transform", "translate(-60,-18)")
        .append("foreignObject")
        .attr("width","48px")
        .attr("height","48px")
        .append("xhtml:body")
        .attr("style", "background-color: transparent;");

    chkAndFlagsContainer.append("input")
        .attr('style', 'vertical-align: super;')
        .attr('type','checkbox')
        .attr('class','chk_barChart_country')
        .attr("checked", true)
        .on("change", function (d) {
            var countries = d3.selectAll('.chk_barChart_country')
                .nodes()
                .filter(function (e) { return d3.select(e).property('checked') })
                .map(e => d3.select(e).datum().key);
            renderTimeLine(countries);
            renderScatterPlot(countries, startYear, endYear);
        });

    chkAndFlagsContainer
        .append("image")
        .attr("class", function(d) { return countryIsoCode[d.key]});

}
