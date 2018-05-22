function initializeData(data, countries) {
  var orderedValues = [];
  var parseDate = d3.timeParse("%Y");
  data = data.filter(function (d) { return countries.includes(d.city_country); })
  // data = rawData;

  // Ordenamos por anio la cantidad de metros
  d3.nest()
    .key(function (d) {
      return d.line_id;
    })
    .rollup(function (groupByLine) {
      var sortedAsc = d3.entries(groupByLine)
        .sort(function (a, b) { return d3.ascending(a.value.line_meters_acumulated, b.value.line_meters_acumulated) })
      // Si el acumulado de metros esta al reves los invierto y guardo
      if (sortedAsc[0].value.station_opening > sortedAsc[sortedAsc.length - 1].value.station_opening) {
        var other = sortedAsc.length - 1;
        for (let index = 0; index < (sortedAsc.length / 2); index++) {
          var temp = sortedAsc[index].value.station_meters;
          sortedAsc[index].value.station_meters = sortedAsc[other].value.station_meters;
          sortedAsc[other].value.station_meters = temp;
          other--;
        }
      }
      orderedValues = orderedValues.concat(sortedAsc);
    })
    .entries(data);

  // Obtenemos el total de metros por anio
  var arrayAnios = d3.nest()
    .key(function (d) {
      return d.value.station_opening;
    })
    .rollup(function (groupByYear) {
      var groupByLine = d3.nest()
        .key(function (d2) { return d2.value.line_id; })
        .entries(groupByYear);

      var lines_meters = 0;

      for (let index = 0; index < groupByLine.length; index++) {
        const line = groupByLine[index];

        sortData = d3.entries(line.values)
          .sort(function (a, b) { return d3.ascending(a.value.value.station_meters, b.value.value.station_meters); })

        lines_meters += sortData[sortData.length - 1].value.value.station_meters - sortData[0].value.value.station_meters;
      }

      return lines_meters;
    })
    .entries(orderedValues)
    .map(function (group) {
      return {
        "date": group.key,
        "meters": group.value
      }
    });

  // Filtramos y ordenamos por anio
  var temp = arrayAnios
    .filter(function (d) { return d.date !== 'undefined'; })
    .filter(function (d) { return d.date !== '0'; })
    .filter(function (d) { return d.date <= '2018'; })
    .sort(function (a, b) { return d3.ascending(+a.date, +b.date); })

  var arrayFinal = [];
  if ( temp.length > 0 ) {
    arrayFinal = arrayFinal.concat(temp[0]);

    var index = 1;
    var final = temp[temp.length - 1].date - temp[0].date;
    while (index < final) {
      var dateNum = +arrayFinal[index - 1].date;
      var newDate = dateNum + 1;
      var pos = temp.map(function (e) { return +e.date; }).indexOf(newDate);
      var object = {
        date: 0,
        meters: 0
      };

      object.date = newDate.toString();
      if (pos == -1) {
        object.meters = arrayFinal[index - 1].meters;
      } else {
        object.meters = arrayFinal[index - 1].meters + temp[pos].meters;
      }
      arrayFinal = arrayFinal.concat(object);
      index++;
    }

    // Convertimos el anio a fecha
    arrayFinal.forEach(function (d, i) {
      d.date = parseDate(d.date);
    });
  }
  

  // ready(arrayFinal);
  return arrayFinal
}

var dateLinesSelected = [new Date(1900, 0, 1), new Date(1990, 0, 1)];

function renderTimeLine(countries) {

  const data = initializeData(rawData, countries);

  var currentExtent = [0, 0];

  // Clean
  d3.select("#d3-timelineChart-container").selectAll("*").remove();

  var svg = d3.select("#d3-timelineChart-container");

  var width = 700;
  var height2 = 50;
  const marginX = 50;

  var x2 = d3.scaleTime()
    .domain([new Date(1840,1,1), new Date(2018, 1, 1)])
    .range([marginX, width]);
  var y2 = d3.scaleLinear().range([height2, 0]);

  var xAxis2 = d3.axisBottom(x2);

  var line2 = d3.line()
    .x(function (d) { return x2(d.date); })
    .y(function (d) { return y2(d.meters); });

  var context = svg.append("g");

  var leftHandle = marginX,
    rightHandle = width

  var brush = d3.brushX()
    .extent([[leftHandle, 0], [rightHandle, height2]])
    .on("brush start", updateCurrentExtent)
    .on("brush end", brushed);

  y2.domain([0, d3.max(data, function (d) { return d.meters; })]);

  context.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line2);

  context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2);

  context.append("g")
    .attr("class", "brush")
    .on("click", brushed)
    .call(brush)
    .call(brush.move, dateLinesSelected.map(x2));


  function updateCurrentExtent() {
    currentExtent = d3.brushSelection(this);
    callRenderBarChart(x2, currentExtent)
  }

  function brushed() {
    callRenderBarChart(x2, currentExtent);
  }
}

function callRenderBarChart(x2, currentExtent) {
  // x2(new Date(2001, 0, 1))
  var beginBox = d3.select(".selection").node().getBBox().x;
  var endBox = d3.select(".selection").node().getBBox().width;
  var tl_startYear = x2.invert(beginBox).getFullYear(),
  tl_endYear = x2.invert(beginBox + endBox).getFullYear();
  console.log(`event: ${d3.event.type}, startYear: ${tl_startYear}, endYear: ${tl_endYear}`)
  
  dateLinesSelected = [new Date(tl_startYear, 1, 1), new Date(tl_endYear, 1, 1)];

  renderBarChart(tl_startYear, tl_endYear, false);
}