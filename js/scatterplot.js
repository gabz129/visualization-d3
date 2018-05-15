
const parseDate = d3.timeParse("%Y");

const width = 500;
const height = 300;
const margin = 50;
const duration = 250;

function renderScatterPlot(countries, minDate, maxDate) {

  var preData = preprocess(losDatos, countries);
  var processedData = [];

  for (let index = 0; index < preData.length; index++) {
    const item = preData[index];
    var countryData = [];
    var pricePerDate = 0;
    var sortedItem = item.value.sort((a, b) => a.date.key - b.date.key);
    for (let index2 = 0; index2 < item.value.length; index2++) {
      const value = item.value[index2];
      if (value.date.key > minDate && value.date.key < maxDate) {
        pricePerDate += value.price;
        countryData.push({
          "date": parseDate(value.date.key),
          "price": pricePerDate / 1000
        });
      }
    };
    processedData.push({
      "name": item.key,
      "values": countryData
    })
  };
  console.log(processedData);
  var data = processedData;

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
  const xScale = setXScale(minDate, maxDate);
  const yScale = setYScale(data);
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  /* Add SVG */
  var svg = d3.select("#d3-container").append("svg")
    .attr("width", (width + margin) + "px")
    .attr("height", (height + margin) + "px")
    .append('g')
    .attr("transform", `translate(${margin}, ${margin})`);


  /* Add line into SVG */
  var line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.price));

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
        .style("fill", color(i))
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
    .style('stroke', (d, i) => color(i))
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
    .style("fill", (d, i) => color(i))
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
        .text(`${d.price}`)
        .attr("x", d => xScale(d.date) + 5)
        .attr("y", d => yScale(d.price) - 10);
    })
    .on("mouseout", function (d) {
      d3.select(this)
        .style("cursor", "none")
        .transition()
        .duration(duration)
        .selectAll(".text").remove();
    })
    .append("circle")
    .attr("cx", d => xScale(d.date))
    .attr("cy", d => yScale(d.price))
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
    .attr("y", 15)
    .attr("transform", "translate(-10)")
    .attr("fill", "#000")
    .text("Km");

};

function preprocess(losDatos, countries) {
  return d3.nest()
    .key(function (d) {
      return d.city_country;
    })
    .rollup((groupByCountry) => {
      var groupByDate = d3.nest()
        .key((country) => { return country.station_opening; })
        .entries(groupByCountry);
      var lines_meters = 0;
      var datePrice = [];
      for (let index = 0; index < groupByDate.length; index++) {
        const datePeriod = groupByDate[index];
        //sort by value descending
        sortData = d3.entries(datePeriod.values)
          .sort((a, b) => { return d3.descending(a.line_meters_acumulated, b.line_meters_acumulated); })
        // take the first option 
        lines_meters += sortData[sortData.length - 1].value.line_meters_acumulated - sortData[0].value.line_meters_acumulated;
        datePrice.push({ "date": datePeriod, "price": lines_meters });
      }
      return datePrice;
    })
    .entries(losDatos)
    .filter(item => countries.includes(item.key));
}

function setXScale(minDate, maxDate) {
  return d3.scaleTime()
    .domain([parseDate(minDate), parseDate(maxDate)])
    .range([0, width - margin]);
};

function setYScale(data) {
  return d3.scaleLinear()
    .domain([0, d3.max(data[0].values, d => d.price)])
    .range([height - margin, 0]);
}