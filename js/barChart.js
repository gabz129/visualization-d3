function processData(raw_data, startYear, endYear) {
    if (!startYear) startYear = 1900;
    if (!endYear) endYear = 1989;
    var data = raw_data.filter(function (d) {return d.station_opening >= startYear && d.station_opening <= endYear })
    .filter(item => item.station_meters >= 0);
    return d3.nest()
        .key(function(d) {
            return d.city_country;
        })
        .rollup(function(groupByCountry) {
            return d3.sum(groupByCountry, e => e.station_meters);
        })
        .entries(data);
}
var countrySelection = [];
var bc_max_year, bc_min_year;
function renderBarChart(startYear, endYear, timeLineUpdate) {
    bc_max_year = endYear, bc_min_year = startYear;
    data = processData(rawData, startYear, endYear);
    
    countries.forEach( country => { 
        if ( data.filter(e => e.key == country).length == 0 )
            data.push({key: country, value: 0 });
    });

    data = data.sort(function (a, b) {return a.value - b.value})

    if ( !isMultilinePlot && (timeLineUpdate == undefined || timeLineUpdate) )
        countrySelection = data.map(e => e.key);

    var svg = d3.select("#d3-bartChart-container");
    svg.selectAll("*").remove();
    
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
        .attr("id", "radioButtonChk")
        .call(d3.axisLeft(y));

    var bar = g.selectAll(".bar");
    
    bar.data(data)
        .enter().append("g")
        .on("mousemove", function(d){
            tooltip
            .style("left", d3.event.pageX - 20 + "px")
            .style("top", d3.event.pageY - 40 + "px")
            .style("display", "inline-block")
            .html((d.key) + "<br>" + (parseFloat(d.value/1000).toFixed(0)) + " km" );
        })
        .on("mouseout", function(d){ tooltip.style("display", "none");})
        .attr("class", "barContainer").append("rect")
        .attr("class", "bar")
        .attr("style", (e, i) => "fill:" + (e.value == 0 ? "transparent" : countryIsoCode[e.key].colour))
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("y", function(d) { return y(d.key); })
        .attr("width", function(d) { return x(d.value == 0 ? 1 : d.value); });
        
    d3.selectAll(".barContainer").data(data).append("text")
    .attr("y", function (d, i) { 
        return d3.select(this).node().previousElementSibling.getBBox().y + d3.select(this).node().previousElementSibling.getBBox().height/2;
    })
    .text(function(d){
        return d.key;
    });

    //Multiline chart settings
    var selectionType = "checkbox";
    if (isMultilinePlot) {
        selectionType = "radio";
    }

    var chkAndFlagsContainer = d3.selectAll("#radioButtonChk").selectAll("g")
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
        .attr('type', selectionType)
        .attr('name', 'countrySelector')
        .attr('class','chk_barChart_country')
        .on("change", function (d) {updateSelectedCountries(startYear, endYear, true)});
    
    chkAndFlagsContainer
        .append("image")
        .attr("class", function (d) { return countryIsoCode[d.key].flag });

    if (isMultilinePlot && countrySelection.length > 1 ) {
        countrySelection = ['Argentina']
    }
    d3.selectAll('.chk_barChart_country').nodes()
        .forEach(e => {
            element = d3.select(e);
            element.property('checked', countrySelection.includes(element.datum().key));
        });
    updateSelectedCountries(startYear, endYear);
}

function updateSelectedCountries(startYear, endYear, timeLineUpdate) {
    countrySelection = d3.selectAll('.chk_barChart_country')
        .nodes()
        .filter(function (e) { return d3.select(e).property('checked') })
        .map(e => d3.select(e).datum().key);
    if ( isMultilinePlot ) {
        renderScatterPlot_pbi(countrySelection[0], startYear, endYear);
    } else {
        renderScatterPlot(countrySelection, startYear, endYear);
        renderBoxplot(countrySelection, startYear, endYear);
        if (timeLineUpdate) {
            renderTimeLine(countrySelection, false);
        }
    }
    d3.selectAll('.chk_barChart_country').nodes()
    .forEach(e => {
        element = d3.select(e);
        element.property('checked', countrySelection.includes(element.datum().key));
    });
}

var isMultilinePlot = false;
$('a[data-toggle="pill"]').on('shown.bs.tab', function (e) {
    activeTabTarget = $(e.target).attr("href") // activated tab
    isMultilinePlot = activeTabTarget === "#pills-contact";
    renderBarChart(bc_min_year, bc_max_year, true);
  });