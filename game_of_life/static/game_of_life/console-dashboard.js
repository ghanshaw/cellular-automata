
var consoleDashboard = function() {

    var obj = {};

    obj.initDashboard = initDashboard;
    obj.drawDashboard = drawDashboard;
    obj.updateChart = updateChart;
    obj.updateSlider = updateSlider;
    obj.svgChart = '';
    obj.svgArea = '';

    obj.svgWidth = 0;
    obj.svgHeight = 0;
    //obj.simulation = simulation;

    //obj.outputUpdate = outputUpdate;

    return obj;

}



var initDashboard = function() {


    /*****************************/
    // Initialize console chart
    /*****************************/

    // Create d3 chart object
    var consoleChart = d3.select('#console-chart')

    // Select inner svg
    this.svgChart = consoleChart.select('svg');

    // Store width and height of svg
    this.svgWidth = parseInt(this.svgChart.style('width'));
    this.svgHeight = parseInt(this.svgChart.style('height'));

    // Set the dimensions and margins of the graph
    this.margin = {top: 30, right: 50, bottom: 60, left: 70},
    this.svgWidth =  this.svgWidth - this.margin.left - this.margin.right,
    this.svgHeight = this.svgHeight - this.margin.top - this.margin.bottom;

    // Create path for line chart
    this.chartLine = this.svgChart
        .append("svg:path")
        .attr("class", "chart-line");

    // Create x axis (and format)
    this.xAxis = this.svgChart.append('g')
        .attr("transform", "translate(" + this.margin.left + ", " + (this.svgHeight + this.margin.top) + ")")
    var formatxAxis = d3.format('.0f');

    // Create y axis
    this.yAxis = this.svgChart.append("g")
      .attr("transform", "translate(" + this.margin.left + ", " + this.margin.top + ")")

    // Add text label for x axis
    this.xAxisLabel = this.svgChart.append("text")
          .attr("transform",
                "translate(" + (this.svgWidth/2 + this.margin.left) + " ," +
                               (this.svgHeight + this.margin.top + 40) + ")")
          .style("text-anchor", "middle")
          .text("Generation");

    // Add text label for the y axis
    this.yAxisLabel = this.svgChart.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 15)
          .attr("x",0 - (this.svgHeight / 2) - this.margin.top)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Population")


    /*****************************/
    // Initialize console slider
    /*****************************/

    // Create d3 slider object
    this.consoleSlider = d3.select("#console-slider");

    // Select inner svg
    this.svgSlider = this.consoleSlider.select('svg');

    // Acquire width and height of svg
    sliderWidth = parseInt(this.svgSlider.style('width'));
    sliderHeight = parseInt(this.svgSlider.style('height'));

    var margin = { right: 50, left: 50 };
    sliderWidth = sliderWidth - margin.left - margin.right;
    this.sliderWidth = sliderWidth;

    // xChart of slider
    this.xSlider = d3.scaleLinear().domain([0, 0]).range([0, sliderWidth]).clamp(true);


    this.slider = this.svgSlider.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + sliderHeight / 2 + ")");

    this.slider.append("line")
        .attr("class", "track")
        .attr("x1", this.xSlider.range()[0])
        .attr("x2", this.xSlider.range()[1])
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")

    this.sliderMin = this.slider.append('text')
        .attr('font-size', '15px')
        .attr('x', '-23px')
        .attr('y', '5px')
        .text('0')

    this.sliderMax = this.slider.append('text')
        .attr('font-size', '15px')
        .attr('x', sliderWidth + 15 )
        .attr('y', '5px')
        .text('0')


    var trackOverlay = this.slider.select('.track-overlay');

    var tooltip = this.consoleSlider.append("div")
        .attr("class", "slider-tooltip")
        .style('top', '0px')
        .style('left', '0px')
        .style('display', 'none');



    var handle = this.slider.append("circle")
        .attr("class", "handle")
        .attr("r", 9)
        .call(d3.drag()
            .on("start drag", function() {
                this.dragYear = dragStart(d3.event.x);
            })
            .on("end", function() {
                dragEnd(this.dragYear);
            }));

    this.handle = handle;


    dragEnd = function(dragYear) {

        // Unpause simulation
        simulation.isPause = false;

        // Hide tooltip
        tooltip.style('display', 'none');


        // If chosen year is less than year active currently
        if (dragYear <= simulation.maxYear && dragYear >= 0 && dragYear != simulation.year) {

            // Choose generation based on dragged year
            simulation.chooseGeneration(dragYear);
        }

    }



    dragStart = function (xPos) {

        // Pause simulation if it's running
        if (simulation.isRunning) {
            simulation.isPaused = true;
        }


        if (xPos >= 0 && xPos <= sliderWidth) {

            // Move handle
            handle.attr("cx", xPos);

            // Recolor track overlay
            trackOverlay.attr("x2", xPos);

            // Compute year from handle position
            this.dragYear = Math.round((xPos/sliderWidth) * simulation.maxYear);
            //Math.floor(dragYear);
            //console.log(dragYear);

            // Show/edit tooltip
            tooltip
                .text(dragYear)
                .style('left', (xPos + 25) + 'px')
                .style('top', (sliderHeight/2 - 15)+ 'px')
                .style('display', 'block');

        }

        return this.dragYear;

    }

}

var drawDashboard = function() {



    // Gather data from genTimeline
    var data = simulation.genTimeline.slice(0, simulation.maxYear + 1);

    // Data relationships -- links data to svg groups (which may or may not exist already)
    //var svgPoints = this.svgChart.selectAll('g').data(data).enter();
    //svgPoints = this.svgChart.selectAll('g').data(data).exit().remove();



    if (data.length == 0) {}

   else if (data.length == 1) {}

   else {

    /*****************************/
    // Redraw dashboard chart
    /*****************************/

    // xChart is the generation (year) (Reset every year)
    var x_domain_max = simulation.maxYear;
    var xChart = d3.scaleLinear().domain([0, x_domain_max]).range([0, this.svgWidth]).clamp(true);


    // yChart is the population
    y_domain_max = d3.max(data) * 1.2;
    var yChart = d3.scaleLinear().domain([0,  y_domain_max]).range([this.svgHeight, 0]);


    // Add the x Axis
    this.xAxis
        .call(d3.axisBottom(xChart).tickFormat(d3.format(".0f")));


    // Add the y Axis
     this.yAxis
        .call(d3.axisLeft(yChart));


    // Create line function/object using data
    var line = d3.line()
        .x(function(d, i) {
            return xChart(i)
        })
        .y(function(d, i) {
            return yChart(d);
        })


    // Update chart line path
    var translation = "translate(" + this.margin.left + ", " + this.margin.top + ")";

    this.chartLine.datum(data)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', "#00cc99")
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('transform', translation)


    /*****************************/
    // Redraw dashboard slider
    /*****************************/

        // Rewrite max generation
        this.sliderMax.text(simulation.maxYear)

        // Redefine x scale of slider
        this.xSlider = this.xChart;

        var xPos = (simulation.year/simulation.maxYear) * this.sliderWidth;
        this.consoleSlider.select('.handle').attr('cx', xPos);
        this.consoleSlider.select('.track-overlay').attr('x2', xPos);


    }

}

var updateSlider = function() {




}

var updateChart = function() {





}

    // Perform data join, bind incoming data to svg elements (which don't yet exist)
    //var svgPoints = d3Chart.selectAll('svg').data(data).enter()
    //var svgPoints = d3Chart.selectAll('svg');


        // Create and style the svg points
//    var svgCircle = svgPoints.append('circle')
//        .attr('r', '1')
//        .attr('fill', '#00cc99')
//        .attr('cx', function(d, i) {
//            console.log(d, i);
//            return xChart(i);
//            })
//        .attr('cy', function(d, i) {
//            console.log(d, i);
//            return yChart(d);
//            })

//    this.svgArea
//        .datum(data)
//        .attr('d', line)
//        .attr('stroke', "#00cc99")
//        .attr("fill", "none")
//        .attr('stroke-width', 2)
//        .attr('stroke-linecap', 'round')
//        .attr('stroke-linejoin', 'round')

//    var area = d3.area()
//        .x(function(d, i) {
//            return xChart(i)
//        })
//        .y1(function(d, i) {
//            return yChart(d);
//        })
//        .y0(yChart(0));


//    this.slider.insert("g", ".track-overlay")
//        .attr("class", "ticks")
//        .attr("transform", "translate(0," + 18 + ")")
//        .attr("width", width);
//      .selectAll("text")
//      .data(x.ticks(10))
//      .enter().append("text")
//        .attr("x", x)
//        .attr("text-anchor", "middle")
//        .text(function(d) { return d + "°"; });