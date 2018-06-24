const THOUSANDS = Math.pow(10, 1);

function renderScatterPlot_pbi(country, minDate, maxDate) {
  if (!minDate) minDate = 1840;
  if (!maxDate) maxDate = 2018;

  var filteredData = pbiRawData.filter(item => country == item.city_country )
  .filter(item => item.year >= minDate && item.year <= maxDate);

  var data = filteredData.map( e => { return {year: parseDate(e.year), pbi: e.pbi/THOUSANDS, meters: e.meters }} );

  var svg = d3.select("#d3-multilineChart-2-container");
  svg.selectAll("*").remove();

  var margin = {top: 20, right: 40, bottom: 30, left: 50},
    width = 750 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  svg = svg
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // set the ranges
  var x = d3.scaleTime().range([0, width]);
  var y0 = d3.scaleLinear().range([height, 0]);
  var y1 = d3.scaleLinear().range([height, 0]);

  // define the 1st line
  var valueline = d3.line()
    .x(function(d) { return x(d.year); })
    .y(function(d) { return y0(d.meters); });

  // define the 2nd line
  var valueline2 = d3.line()
    .x(function(d) { return x(d.year); })
    .y(function(d) { return y1(d.pbi); });

  /* Si no se usa borrar */
  var extentMeters = d3.extent(data.map( e => e.meters ));
  var extentPbi = d3.extent(data.map( e => e.pbi ));
  var extentPbi = d3.extent(data.map( e => e.pbi ));
  /* Si no se usa borrar */

  // Scale the range of the data
  x.domain(d3.extent(data.map( e => e.year)));
  y0.domain([0, d3.max(data, function(d) {return Math.max(d.meters);})]);
  y1.domain([0, d3.max(data, function(d) {return Math.max(d.pbi); })]);

  // Add the valueline path.
  svg.append("path")
      .data([data])
      .attr("class", "line_multi")
      .attr("d", valueline);
  console.log(data);
  // Add the valueline2 path.
  svg.append("path")
      .data([data])
      .attr("class", "line_multi")
      .style("stroke", "red")
      .attr("d", valueline2);

  // Add the X Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // Add the Y0 Axis
  svg.append("g")
      .attr("class", "axisSteelBlue")
      .call(d3.axisLeft(y0))
      .append('text')
      .attr("y", 0)
      .attr("transform", "translate(-5,-5)")
      .attr("fill", "#000").text("Km");

  // Add the Y1 Axis
  svg.append("g")
      .attr("class", "axisRed")
      .attr("transform", "translate( " + width + ", 0 )")
      .call(d3.axisRight(y1))
      .append('text')
      .attr("y", 0)
      .attr("transform", "translate(-5,-5)")
      .attr("fill", "#000").text("GDP");

};