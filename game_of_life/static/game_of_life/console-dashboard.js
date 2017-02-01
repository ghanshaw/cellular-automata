
var consoleDashboard = function() {

    var obj = {};

    obj.initDashboard = initDashboard;
    obj.drawDashboard = drawDashboard;
    //obj.updateChart = updateChart;
    //obj.updateSlider = updateSlider;
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


    // Create path for line chart
    this.chartLine = this.svgChart
        .append("svg:path")
        .attr("class", "chart-line");


    // Create x axis (and format)
    this.xAxis = this.svgChart.append('g')

    var formatxAxis = d3.format('.0f');

    // Create y axis
    this.yAxis = this.svgChart.append("g")


    // Add text label for x axis
    this.xAxisLabel = this.svgChart.append("text")
          .style("text-anchor", "middle")
          .text("Generation");

    // Add text label for the y axis
    this.yAxisLabel = this.svgChart.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 15)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Population")

    // Create (and hide) dot for corner cases
    this.chartPoint = this.svgChart.append('circle')
        .style('display', 'none')
        .attr('r', '4')
        .attr('fill', '#00cc99')
        .data([0, 0])

    /*****************************/
    // Initialize console slider
    /*****************************/

    // Create d3 slider object
    this.consoleSlider = d3.select("#console-slider");

    // Select inner svg
    this.svgSlider = this.consoleSlider.select('svg');



    this.slider = this.svgSlider.append("g")
        .attr("class", "slider")


    this.slider.append("line")
        .attr("class", "track track-outline")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track track-inset")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track track-overlay")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track track-target")

    this.sliderMin = this.slider.append('text')
        .attr('font-size', '15px')
        .attr('x', '-23px')
        .attr('y', '5px')
        .text('0')

    this.sliderMax = this.slider.append('text')
        .attr('font-size', '15px')
        .attr('y', '5px')
        .text('0')


    this.trackOverlay = this.slider.select('.track-overlay');


    this.tooltip = this.consoleSlider.append("div")
        .attr("class", "slider-tooltip")
        .style('top', '0px')
        .style('left', '0px')
        .style('display', 'none');


    var handle = this.slider.insert("circle", '.track-target')
        .attr("class", "handle")
        .attr("r", 9)
        .attr("cx", "0")


    this.handle = handle;

    var sliderHeight = parseInt(this.svgSlider.style('height'));



    /*****************************/
    // Draw dashboard
    /*****************************/

    //this.drawDashboard();
}

var drawDashboard = function() {



    // Gather data from genTimeline
    var data = simulation.genTimeline.slice(0, simulation.maxYear + 1);

    // Data relationships -- links data to svg groups (which may or may not exist already)
    //var svgPoints = this.svgChart.selectAll('g').data(data).enter();
    //svgPoints = this.svgChart.selectAll('g').data(data).exit().remove();

    /*****************************/
    // Update svg dimensions
    /*****************************/

    // Store width and height of svg
    var chartWidth = parseInt(this.svgChart.style('width'));
    var chartHeight = parseInt(this.svgChart.style('height'));

    // Set the dimensions and margins of the graph
    var chartMargin = {top: 30, right: 50, bottom: 60, left: 70},
    chartWidth =  chartWidth - chartMargin.left - chartMargin.right,
    chartHeight = chartHeight - chartMargin.top - chartMargin.bottom;


    /*****************************/
    // Redraw dashboard chart
    /*****************************/

    // xChart is the generation (year) (Reset every year)
    var x_domain_max = simulation.maxYear;
    var xChart = d3.scaleLinear().domain([0, x_domain_max]).range([0, chartWidth]).clamp(true);

    // yChart is the population
    y_domain_max = d3.max(data) * 1.2;
    var yChart = d3.scaleLinear().domain([0,  y_domain_max]).range([chartHeight, 0]);

    var translation = "translate(" + chartMargin.left + ", " + chartMargin.top + ")";


    // Make sure dot is hidden
    this.chartPoint
        .style('display', 'none')

    var tickNum = Math.min(data.length - 1, 4);

    if (data.length == 1) {

        xChart = d3.scaleLinear().domain([0, 1]).range([0, chartWidth]).clamp(true);

        this.chartPoint
            .style('display', 'initial')
            .attr('transform', translation)
            .data(data)
            .attr('cx', function(d, i) {
                console.log(d, i);
                return xChart(i);
            })
            .attr('cy', function(d, i) {
                console.log(d, i)
                return yChart(d);
            })


            // If population is 0
            if (data[0] == 0) {
                yChart = d3.scaleLinear().domain([0,  1]).range([chartHeight, 0]);
            }

    }

    if (data.length == 1) { tickNum = 1 }


    // Add the x Axis
    this.xAxis
        .attr("transform", "translate(" + chartMargin.left + ", " + (chartHeight + chartMargin.top) + ")")
        .call(d3.axisBottom(xChart).ticks(tickNum).tickFormat(d3.format(".0f")));


    // Add the y Axis
     this.yAxis
        .attr("transform", "translate(" + chartMargin.left + ", " + chartMargin.top + ")")
        .call(d3.axisLeft(yChart).ticks(tickNum).tickFormat(d3.format(".0f")));


    // Redraw labels
    this.xAxisLabel
         .attr("transform",
                "translate(" + (chartWidth/2 + chartMargin.left) + " ," +
                               (chartHeight + chartMargin.top + 40) + ")")

    this.yAxisLabel
         .attr("x",0 - (chartHeight / 2) - chartMargin.top)


    // Create line function/object using data
    var line = d3.line()
        .x(function(d, i) {
            return xChart(i)
        })
        .y(function(d, i) {
            return yChart(d);
        })


    // Update chart line path
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

        // Acquire width and height of svg
        var sliderWidth = parseInt(this.svgSlider.style('width'));
        var sliderHeight = parseInt(this.svgSlider.style('height'));

        var sliderMargin = { right: 50, left: 50 };
        sliderWidth = sliderWidth - sliderMargin.left - sliderMargin.right;


        // x scale of slider
        var xSlider = d3.scaleLinear().domain([0, 1]).range([0, sliderWidth]);

        // Move slider to appropriate location
        this.slider
            .attr("transform", "translate(" + sliderMargin.left + "," + sliderHeight / 2 + ")");


        this.sliderMax
            .attr('x', sliderWidth + 15 );

        // Update slider width
        this.slider.selectAll('.track')
             .attr("x1", xSlider.range()[0])
             .attr("x2", xSlider.range()[1])



        var trackOverlay = this.trackOverlay;
        var tooltip = this.tooltip;
        var handle = this.handle;

        var trackTarget = this.slider.select('.track-target');

        // Expand target slightly
        trackTarget
            .attr('x1', xSlider.range()[0] - 10)
            .attr('x2', xSlider.range()[1] + 10)

        trackTarget
                 .call(d3.drag()
            .on("start", function() {
                this.xPosOld = handle.attr('cx');

            })
            .on("start drag", function() {
            console.log(d3.event.x);

                this.dragYear = drag(d3.event.x);
                //console.log(dragYear, xPosOld);
            })
            .on("end", function() {
                dragEnd(this.dragYear, this.xPosOld);
            }));


        // Rewrite max generation
        this.sliderMax.text(simulation.maxYear)

        // Redefine x scale of slider
        //this.xSlider = this.xChart;

        var xPos = (simulation.year/simulation.maxYear) * sliderWidth;

        if (simulation.maxYear == 0) {
            this.sliderMax.text(1);
            xPos = 0;
        }


        this.consoleSlider.select('.handle').attr('cx', xPos);
        this.consoleSlider.select('.track-overlay').attr('x2', xPos);



        drag = function (xPos) {

        // Pause simulation if it's running
        if (simulation.isRunning) {
            simulation.isPaused = true;
        }

        var dragYear = 0;

        xPos = Math.max(xPos, 0);
        xPos = Math.min(xPos, sliderWidth)


        // Move handle
        handle.attr("cx", xPos);

        // Recolor track overlay
        trackOverlay.attr("x2", xPos);

        // Compute year from handle position
        dragYear = Math.round((xPos/sliderWidth) * simulation.maxYear);
        //Math.floor(dragYear);
        //console.log(dragYear);

        // Show/edit tooltip
        tooltip
            .text(dragYear)
            .style('left', (xPos + 25) + 'px')
            .style('top', (sliderHeight/2 - 15)+ 'px')
            .style('display', 'block');


        return dragYear;

    }

        dragEnd = function(dragYear, xPosOld) {

        // Unpause simulation
        simulation.isPause = false;

        // Hide tooltip
        tooltip.style('display', 'none');

        //var dragYear = dragDetails.dragYear;


        // If chosen year is less than year active currently
        if (dragYear <= simulation.maxYear && dragYear >= 0 && dragYear != simulation.year) {

            // Choose generation based on dragged year
            simulation.chooseGeneration(dragYear);
        }
        // Put handle back
        else {
            //var xPosOld = this.xPosOld
            handle.attr('cx', xPosOld);
            trackOverlay.attr('x2', xPosOld);

        }

    }

}
