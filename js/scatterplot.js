
const parseDate = d3.timeParse("%Y");

const width = 700;
const height = 400;
const margin = 50;
const duration = 250;

function preprocess(data, countries, minDate, maxDate) {
  const filteredData = data.filter(item => countries.includes(item.city_country))
    .filter(item => item.station_opening >= minDate && item.station_opening <= maxDate)
    .filter(item => item.station_meters >= 0);

  //Sum meters per year 
  const preData = d3.nest()
    .key(d => { return d.city_country; })
    .rollup((groupByCountry) => {
      const groupByYear = d3.nest()
        .key(year => year.station_opening)
        .rollup(groupPorAno => {
          return d3.sum(groupPorAno, e => e.station_meters);
        })
        .entries(groupByCountry);
      var yearMeter = [];
      return groupByYear.map(item => {
        return {
          "year": item.key,
          "meter": item.value
        };
      })
    })
    .entries(filteredData);

  //Fit for better understanding
  var processedData = [];
  for (let index = 0; index < preData.length; index++) {
    const item = preData[index];

    yearsToProcess = d3.entries(item.value)
      .sort((a, b) => { return d3.ascending(a.value.year, b.value.year); })
      .map(obj => obj.value);
    processedValues = [];
    var total = 0
    for (let year = 0; year < yearsToProcess.length; year++) {
      const yearMeter = yearsToProcess[year];
      total += yearMeter.meter;
      processedValues.push({ "year": parseDate(yearMeter.year), "meter": +parseFloat(total / 1000).toFixed(0) })
    }
    processedData.push({
      "name": item.key,
      "values": processedValues
    })
  };
  return processedData;
}

function renderScatterPlot(countries, minDate, maxDate) {
  if (!minDate) minDate = 1900;
  if (!maxDate) maxDate = 2018;

  const data = preprocess(rawData, countries, minDate, maxDate);

  var lineOpacity = "0.25";
  var lineOpacityHover = "0.85";
  var otherLinesOpacityHover = "0.1";
  var lineStroke = "1.5px";
  var lineStrokeHover = "2.5px";

  var circleOpacity = '0.85';
  var circleOpacityOnLineHover = "0.25"
  var circleRadius = 3;
  var circleRadiusHover = 6;

  //Set Axis and line colors
  const xScale = d3.scaleTime()
    .domain([parseDate(minDate), parseDate(maxDate)])
    .range([0, width - margin]);
  var maxYAxis = Math.max(...data.map(item => { return Math.max(...item.values.map(it => it.meter)) }));
  const yScale = d3.scaleLinear()
    .domain([0, maxYAxis])
    .range([height - margin, 0]);
  // const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Clean
  d3.select("#d3-multilinealChart-container").selectAll("*").remove();
  /* Add SVG */
  var svg = d3.select("#d3-multilinealChart-container")
    .attr("width", (width + margin) + "px")
    .attr("height", (height + margin) + "px")
    .append('g')
    .attr("transform", `translate(${margin}, ${margin / 2})`);


  /* Add line into SVG */
  var line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.meter));

  let lines = svg.append('g')
    .attr('class', 'lines');

  lines.selectAll('.line-group')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'line-group')
    .on("mouseover", function (d, i) {
      svg.append("text")
        .attr("class", "title-text")
        .style("fill", countryIsoCode[d.name].colour)
        .text(d.name)
        .attr("text-anchor", "middle")
        .attr("x", (width - margin) / 2)
        .attr("y", 5);
    })
    .on("mouseout", function (d) {
      svg.select(".title-text").remove();
    })
    .append('path')
    .attr('class', 'line')
    .attr('d', d => line(d.values))
    .style('stroke', (d, i) => countryIsoCode[d.name].colour)
    .style('opacity', lineOpacity)
    .on("mouseover", function (d) {
      d3.selectAll('.line')
        .style('opacity', otherLinesOpacityHover);
      d3.selectAll('.circle')
        .style('opacity', circleOpacityOnLineHover);
      d3.select(this)
        .style('opacity', lineOpacityHover)
        .style("stroke-width", lineStrokeHover)
        .style("cursor", "pointer");
    })
    .on("mouseout", function (d) {
      d3.selectAll(".line")
        .style('opacity', lineOpacity);
      d3.selectAll('.circle')
        .style('opacity', circleOpacity);
      d3.select(this)
        .style("stroke-width", lineStroke)
        .style("cursor", "none");
    });


  /* Add circles in the line */
  lines.selectAll("circle-group")
    .data(data)
    .enter()
    .append("g")
    .style("fill", (d, i) => countryIsoCode[d.name].colour)
    .selectAll("circle")
    .data(d => d.values)
    .enter()
    .append("g")
    .attr("class", "circle")
    .on("mouseover", function (d) {
      d3.select(this)
        .style("cursor", "pointer")
        .append("text")
        .attr("class", "text")
        .text(`${d.meter}`)
        .attr("x", d => xScale(d.year) + 5)
        .attr("y", d => yScale(d.meter) - 10);
    })
    .on("mouseout", function (d) {
      d3.select(this)
        .style("cursor", "none")
        .transition()
        .duration(duration)
        .selectAll(".text").remove();
    })
    .append("circle")
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.meter))
    .attr("r", circleRadius)
    .style('opacity', circleOpacity)
    .on("mouseover", function (d) {
      d3.select(this)
        .transition()
        .duration(duration)
        .attr("r", circleRadiusHover);
    })
    .on("mouseout", function (d) {
      d3.select(this)
        .transition()
        .duration(duration)
        .attr("r", circleRadius);
    });


  /* Add Axis into SVG */
  var xAxis = d3.axisBottom(xScale).ticks(10);
  var yAxis = d3.axisLeft(yScale).ticks(10);

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height - margin})`)
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append('text')
    .attr("y", 0)
    .attr("transform", "translate(-15)")
    .attr("fill", "#000")
    .text("Km");

};