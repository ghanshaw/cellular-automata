//*************************************************//
// Class to manage dashboard of simulation
//*************************************************//
var consoleDashboard = function() {

    // Dashboard object
    var obj = {};

    // Instance methods
    obj.initDashboard = initDashboard;
    obj.drawDashboard = drawDashboard;

    obj.svgChart = '';
    obj.svgArea = '';

    obj.svgWidth = 0;
    obj.svgHeight = 0;

    return obj;

};


//*************************************************//
// Initialize simulation dashboard
//*************************************************//
var initDashboard = function() {


    /*****************************/
    // Initialize console chart
    /*****************************/

    // Create d3 chart object
    var consoleChart = d3.select('#console-chart');

    // Select inner svg
    this.svgChart = consoleChart.select('svg');

    // Create path for line chart
    this.chartLine = this.svgChart
        .append("svg:path")
        .attr("class", "chart-line");

    // Create x axis
    this.xAxis = this.svgChart.append('g');

    // Create y axis
    this.yAxis = this.svgChart.append("g");

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
          .text("Population");

    // Create (and hide) dot for corner cases
    this.chartPoint = this.svgChart.append('circle')
        .style('display', 'none')
        .attr('r', '4')
        .attr('fill', '#00cc99')
        .data([0, 0]);

    /*****************************/
    // Initialize console slider
    /*****************************/

    // Create d3 slider object
    this.consoleSlider = d3.select("#console-slider");

    // Select inner svg
    this.svgSlider = this.consoleSlider.select('svg');
    
    // Create group to hold slider
    this.slider = this.svgSlider.append("g")
        .attr("class", "slider");

    // Create different lines to display slider
    this.slider.append("line")
        .attr("class", "track track-outline")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track track-inset")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track track-overlay")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track track-target");

    // Create min and max values of slider
    this.sliderMin = this.slider.append('text')
        .attr('font-size', '15px')
        .attr('x', '-23px')
        .attr('y', '5px')
        .text('0');
    
    this.sliderMax = this.slider.append('text')
        .attr('font-size', '15px')
        .attr('y', '5px')
        .text('0');

    // Create tooltip depicting selected generation
    this.tooltip = this.consoleSlider.append("div")
        .attr("class", "slider-tooltip")
        .style('top', '0px')
        .style('left', '0px')
        .style('display', 'none');

    // Create slider handle
    var handle = this.slider.insert("circle", '.track-target')
        .attr("class", "handle")
        .attr("r", 9)
        .attr("cx", "0");

    // Store slider handle and track overlay as instance variables
    this.handle = handle;
    this.trackOverlay = this.slider.select('.track-overlay');
    
};


//*************************************************//
// Draw simulation dashboard
//*************************************************//
var drawDashboard = function(sim) {


    // Gather data from genTimeline
    var data = sim.genTimeline.slice(0, sim.maxYearReached + 1);


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
    var x_domain_max = sim.maxYearReached;
    var xChart = d3.scaleLinear().domain([0, x_domain_max]).range([0, chartWidth]).clamp(true);

    // yChart is the population
    y_domain_max = d3.max(data) * 1.2;
    var yChart = d3.scaleLinear().domain([0,  y_domain_max]).range([chartHeight, 0]);
    
    // Compute translation factor
    var translation = "translate(" + chartMargin.left + ", " + chartMargin.top + ")";

    // Make sure dot is hidden
    this.chartPoint
        .style('display', 'none')

    // Compute number of ticks to show (maxmimum 4)
    var tickNum = Math.min(data.length - 1, 4);

    // Special changes at year 0
    if (data.length == 1) {
        
        // Redefine x scale of chart
        xChart = d3.scaleLinear().domain([0, 1]).range([0, chartWidth]).clamp(true);
        
        // Make sure at least 1 tick shows
        tickNum = 1;

        // Add point to chart (instead of line)
        this.chartPoint
            .style('display', 'initial')
            .attr('transform', translation)
            .data(data)
            .attr('cx', function(d, i) {
                return xChart(i);
            })
            .attr('cy', function(d, i) {
                return yChart(d);
            });


            // If population is 0, redefine y scale
            if (data[0] == 0) {
                yChart = d3.scaleLinear().domain([0,  1]).range([chartHeight, 0]);
            }

    }


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
                               (chartHeight + chartMargin.top + 40) + ")");

    this.yAxisLabel
         .attr("x",0 - (chartHeight / 2) - chartMargin.top);


    // Create line function/object using data
    var line = d3.line()
        .x(function(d, i) {
            return xChart(i)
        })
        .y(function(d, i) {
            return yChart(d);
        });


    // Update chart line path
    this.chartLine.datum(data)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', "#00cc99")
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('transform', translation);


    /*****************************/
    // Redraw dashboard slider
    /*****************************/

    // Acquire width and height of svg
    var sliderWidth = parseInt(this.svgSlider.style('width'));
    var sliderHeight = parseInt(this.svgSlider.style('height'));

    // Define margins of slider
    var sliderMargin = { right: 50, left: 50 };
    sliderWidth = sliderWidth - sliderMargin.left - sliderMargin.right;

    // Define x scale of slider
    var xSlider = d3.scaleLinear().domain([0, 1]).range([0, sliderWidth]);

    // Move slider to appropriate location
    this.slider
        .attr("transform", "translate(" + sliderMargin.left + "," + sliderHeight / 2 + ")");

    // Place generation limit of timeline slider
    this.sliderMax
        .attr('x', sliderWidth + 15 );

    // Update slider width
    this.slider.selectAll('.track')
         .attr("x1", xSlider.range()[0])
         .attr("x2", xSlider.range()[1]);

    // Acquire important variables, store as local variables
    var trackOverlay = this.trackOverlay;
    var tooltip = this.tooltip;
    var handle = this.handle;

    // Create track target (clickable area)
    var trackTarget = this.slider.select('.track-target');

    // Expand target slightly
    trackTarget
        .attr('x1', xSlider.range()[0] - 10)
        .attr('x2', xSlider.range()[1] + 10);

    // Implement drag functionality of timeline
    trackTarget
             .call(d3.drag()
        .on("start", function() {
            this.xPosOld = handle.attr('cx');
        })
        .on("start drag", function() {
            this.dragYear = drag(d3.event.x);
        })
        .on("end", function() {
            dragEnd(this.dragYear, this.xPosOld);
        }));

    // Rewrite max generation
    this.sliderMax.text(sim.maxYearReached);

    // Compute position of handle within slider
    var xPos = (sim.year/sim.maxYearReached) * sliderWidth;

    if (sim.maxYearReached == 0) {
        this.sliderMax.text(1);
        xPos = 0;
    }

    /*****************************/
    // Drag start and drag end methods
    /*****************************/
        
    drag = function (xPos) {

        // Pause simulation if it's running
        if (sim.isRunning) {
            sim.isPaused = true;
        }

        // Define variable for year user drags to
        var dragYear = 0;

        // Clamp position of pointer to edges of slider
        xPos = Math.max(xPos, 0);
        xPos = Math.min(xPos, sliderWidth)

        // Move handle
        handle.attr("cx", xPos);

        // Recolor track overlay
        trackOverlay.attr("x2", xPos);

        // Compute year from handle position
        dragYear = Math.round((xPos/sliderWidth) * sim.maxYearReached);

        // Show/edit tooltip
        tooltip
            .text(dragYear)
            .style('left', (xPos + 25) + 'px')
            .style('top', (sliderHeight/2 - 15)+ 'px')
            .style('display', 'block');

        return dragYear;

    };

    dragEnd = function(dragYear, xPosOld) {

        // Unpause simulation
        sim.isPause = false;

        // Hide tooltip
        tooltip.style('display', 'none');

        // If chosen year is less than year active currently
        if (dragYear <= sim.maxYearReached && dragYear >= 0 && dragYear != sim.year) {
            // Choose generation based on dragged year
            sim.chooseGeneration(dragYear);
        }
        // Put handle back
        else {
            handle.attr('cx', xPosOld);
            trackOverlay.attr('x2', xPosOld);

        }

    };

};
