
var populationChart = function() {

    var obj = {};

    obj.initChart = initChart;
    obj.drawChart = drawChart;
    obj.svgChart = '';
    obj.svgArea = '';

    obj.svgWidth = 0;
    obj.svgHeight = 0;
    //obj.simulation = simulation;

    obj.outputUpdate = outputUpdate;

    return obj;

}



var initChart = function() {


    // Create d3 chart object
    var d3Chart = d3.select('#d3-chart')

    // Perform data join, bind incoming data to svg elements (which don't yet exist)
    //var svgPoints = d3Chart.selectAll('svg').data(data).enter()
    //var svgPoints = d3Chart.selectAll('svg');

    this.svgChart = d3Chart.select('#svg-chart');

    this.svgWidth = parseInt(this.svgChart.style('width'));
    this.svgHeight = parseInt(this.svgChart.style('height'));

    this.svgArea = this.svgChart.append('svg:path');

    this.chartLine = this.svgChart.append("svg:path");

    // set the dimensions and margins of the graph
    this.margin = {top: 30, right: 50, bottom: 60, left: 70},
    this.svgWidth =  this.svgWidth - this.margin.left - this.margin.right,
    this.svgHeight = this.svgHeight - this.margin.top - this.margin.bottom;

    this.yAxis = this.svgChart.append("g")
      .attr("transform", "translate(" + this.margin.left + ", " + this.margin.top + ")")

    this.xAxis = this.svgChart.append('g')
        .attr("transform", "translate(" + this.margin.left + ", " + (this.svgHeight + this.margin.top) + ")")


    var formatxAxis = d3.format('.0f');

    // Text label for the y axis
    this.xAxisLabel = this.svgChart.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 15)
          .attr("x",0 - (this.svgHeight / 2) - this.margin.top)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Population")

    // Text label for x axis
    this.yAxisLabel = this.svgChart.append("text")
          .attr("transform",
                "translate(" + (this.svgWidth/2 + this.margin.left) + " ," +
                               (this.svgHeight + this.margin.top + 40) + ")")
          .style("text-anchor", "middle")
          .text("Generation");


    /*****************************/
    // Initialize console slider
    /*****************************/


var consoleSlider = d3.select("#console-slider");
    var margin = { right: 50, left: 50 };
    var width = +popSlider.attr("width") - margin.left - margin.right;
    var height = +popSlider.attr("height");



    this.slider = popSlider.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + height / 2 + ")");

    this.slider.append("line")
        .attr("class", "track")
        .attr("x1", this.xRange.range()[0])
        .attr("x2", this.xRange.range()[1])
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            //.on("start.interrupt", function() { slider.interrupt(); })
            .on("start drag", function() { slide(d3.event.x); }));



    this.slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
      .selectAll("text")
      .data(x.ticks(10))
      .enter().append("text")
        .attr("x", x)
        .attr("text-anchor", "middle")
        .text(function(d) { return d + "°"; });

    this.handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);


    function slide(xPos) {
      handle.attr("cx", xScale(xPos));
    }


}

var drawChart = function() {


    var data = simulation.genTimeline;

    // Data relationships -- links data to svg groups (which may or may not exist already)
    var svgPoints = this.svgChart.selectAll('g').data(data).enter();
    svgPoints = this.svgChart.selectAll('g').data(data).exit().remove();



    if (data.length == 0) {}

   else if (data.length == 1) {}

   else {

    var x_domain_max = simulation.year;
    var x_range_max = this.svgWidth;

    // xScale is the generation (year)
    var xScale = d3.scaleLinear().domain([0, simulation.year]).range([0, this.svgWidth]);

    y_domain_max = '';

    // yScale is the population
    var yScale = d3.scaleLinear().domain([0,  d3.max(data) * 1.2]).range([this.svgHeight, 0]);

    this.svgChart
        .attr('width', this.svgWidth)
        .attr('height', this.svgHeight)
        //.attr('transform', 'translate(' + this.margin.top + ', ' + this.margin.left + ')');

    // Add the x Axis
    this.xAxis
        .call(d3.axisBottom(xScale).tickFormat(d3.format(".0f")));




      // text label for the x axis


    var translation = "translate(" + this.margin.left + ", " + this.margin.top + ")";

    // Add the y Axis

     this.yAxis.call(d3.axisLeft(yScale));



    // Create and style the svg points
    var svgCircle = svgPoints.append('circle')
        .attr('r', '1')
        .attr('fill', '#00cc99')
        .attr('cx', function(d, i) {
            console.log(d, i);
            return xScale(i);
            })
        .attr('cy', function(d, i) {
            console.log(d, i);
            return yScale(d);
            })

    var line = d3.line()
        .x(function(d, i) {
            return xScale(i)
        })
        .y(function(d, i) {
            return yScale(d);
        })

    var area = d3.area()
        .x(function(d, i) {
            return xScale(i)
        })
        .y1(function(d, i) {
            return yScale(d);
        })
        .y0(yScale(0));



    this.chartLine.datum(data)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', "#00cc99")
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('transform', translation)

//    this.svgArea
//        .datum(data)
//        .attr('d', line)
//        .attr('stroke', "#00cc99")
//        .attr("fill", "none")
//        .attr('stroke-width', 2)
//        .attr('stroke-linecap', 'round')
//        .attr('stroke-linejoin', 'round')

    }


}

