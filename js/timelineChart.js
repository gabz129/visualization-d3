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

  arrayFinal = arrayFinal.concat(temp[0]);

  var index = 1;
  while (index < temp.length) {
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
      object.meters = arrayFinal[index - 1].meters + temp[index].meters;
    }
    arrayFinal = arrayFinal.concat(object);
    index++;
  }

  // Convertimos el anio a fecha
  arrayFinal.forEach(function (d, i) {
    d.date = parseDate(d.date);
  });

  // ready(arrayFinal);
  return arrayFinal
}

function renderTimeLine(countries) {

  const data = initializeData(rawData, countries);

  // Clean
  d3.select("#d3-timelineChart-container").selectAll("*").remove();

  var svg = d3.select("#d3-timelineChart-container");
  // var svg = d3.select("svg"),
  // margin = { top: 30, right: 20, bottom: 150, left: 40 },
  // var margin2 = { top: 320, right: 20, bottom: 30, left: 40 };
  // width = +svg.attr("width") - margin.left - margin.right,
  // height = +svg.attr("height") - margin.top - margin.bottom,
  // var height2 = +svg.attr("height") - margin2.top - margin2.bottom;
  var width = 700;
  var height2 = 50;
  const marginX = 50;

  // var x = d3.scaleTime().range([0, width]);
  // var x2 = d3.scaleTime().range([0, width]);
  var x2 = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([marginX, width]);
  // var y = d3.scaleLinear().range([height, 0]);
  var y2 = d3.scaleLinear().range([height2, 0]);

  // var xAxis = d3.axisBottom(x);
  var xAxis2 = d3.axisBottom(x2);
  // var yAxis = d3.axisLeft(y);

  // var line = d3.line()
  //   .x(function (d) { return x(d.date); })
  //   .y(function (d) { return y(d.meters); });

  var line2 = d3.line()
    .x(function (d) { return x2(d.date); })
    .y(function (d) { return y2(d.meters); });

  // svg.append("defs").append("clipPath")
  //   .attr("id", "clip")
  //   .append("rect")
  //   .attr("width", width)
  //   .attr("height", height);

  // var focus = svg.append("g")
  //   .attr("class", "focus")
  //   .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg.append("g");
  // .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  var leftHandle = marginX,
    rightHandle = width

  var currentExtent = [0, 0]

  var brush = d3.brushX()
    .extent([[leftHandle, 0], [rightHandle, height2]])
    .on("brush start", updateCurrentExtent)
    .on("brush end", brushed);

  // var zoom = d3.zoom()
  //   .scaleExtent([1, Infinity])
  //   .translateExtent([[0, 0], [width, height]])
  //   .extent([[0, 0], [width, height]])
  // .on("zoom", zoomed);

  // x.domain(d3.extent(data, function (d) { return d.date; }));
  // y.domain([0, d3.max(data, function (d) { return d.meters; })]);
  x2.domain(d3.extent(data, function (d) { return d.date; }));
  y2.domain([0, d3.max(data, function (d) { return d.meters; })]);

  // focus.append("path")
  //   .datum(data)
  //   .attr("class", "line")
  //   .attr("d", line);

  // focus.append("g")
  //   .attr("class", "axis axis--x")
  //   .attr("transform", "translate(0," + height + ")")
  //   .call(xAxis);

  // focus.append("g")
  //   .attr("class", "axis axis--y")
  //   .call(yAxis);

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
    // .call(brush.move, [new Date(1880, 0, 1), new Date(1900, 0, 1)].map(x));
    .call(brush.move, [new Date(1880, 0, 1), new Date(1900, 0, 1)].map(x2));

  // svg.append("rect")
  //   .attr("class", "zoom")
  //   .attr("width", width)
  //   .attr("height", height)
  //   .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  //.call(zoom);

  function updateCurrentExtent() {
    currentExtent = d3.brushSelection(this);
  }


  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection;

    //console.log(x(new Date(2001,0,1))); // 1 year in terms of x

    var p = currentExtent,
      xYear = x2(new Date(2001, 0, 1)),
      left,
      right;

    if (d3.event.selection && s[1] - s[0] >= xYear) {
      if (p[0] == s[0] && p[1] < s[1]) { // case where right handle is extended
        if (s[1] >= width) {
          left = width - xYear
          right = width
          s = [left, right];
        }
        else {
          left = s[1] - xYear / 2
          right = s[1] + xYear / 2
          s = [left, right];
        }
      }
      else if (p[1] == s[1] && p[0] > s[0]) { // case where left handle is extended
        if (s[0] <= 0) {
          s = [0, xYear];
        }
        else {
          s = [s[0] - xYear / 2, s[0] + xYear / 2]
        }
      }
    }

    if (!d3.event.selection) { // if no selection took place and the brush was just clicked
      var mouse = d3.mouse(this)[0];
      if (mouse < xYear / 2) {
        s = [0, xYear];
      } else if (mouse + xYear / 2 > width) {
        s = [width - xYear, width];
      }
      else {
        s = [d3.mouse(this)[0] - xYear / 2, d3.mouse(this)[0] + xYear / 2];
      }
    }
    console.log(s)
    // x.domain(s.map(x2.invert, x2));
    // focus.select(".line").attr("d", line);
    // focus.select(".axis--x").call(xAxis);
    // svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
    //   .scale(width / (s[1] - s[0]))
    //   .translate(-s[0], 0));
  }

  // function zoomed() {
  //   if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
  //   var t = d3.event.transform;
  //   x.domain(t.rescaleX(x2).domain());
  //   focus.select(".line").attr("d", line);
  //   focus.select(".axis--x").call(xAxis);
  //   context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  // }

}