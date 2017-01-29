//*************************************************//
// Function to apply Slideout menu
//*************************************************//
function applySlideoutMenu() {

    // Create Slideout Element
    var slideout = new Slideout({
        'panel': document.getElementById('panel'),
        'menu': document.getElementById('menu'),
        'padding': 256,
        'tolerance': 70
    });

    // Toggle slideout button
    document.querySelector('.toggle-button').addEventListener('click', function() {
        slideout.toggle();
        $(this).toggleClass('is-active');
    });

}


//*************************************************//
// Class to track edges of a DOM element
//*************************************************//
var Edges = function(element) {
    var $element = $(element);

    var top = $element.offset().top;
    var left = $element.offset().left;
    var right = left + $element.width();
    var bottom = top + $element.height();

    var edges = {
        top: top,
        left: left,
        right: right,
        bottom: bottom
    }

    // inBound method evaluates whether element a is within the bounds of element b
    // ex: a.inBound(edgesB) returns true if a is within b
    edges.inBounds = function(outer) {

        return top > outer.top && left > outer.left && right < outer.right && bottom < outer.bottom;

    }

    return edges;
}



/*************************************************/
// Wait for DOM to load, initiate all functions
/*************************************************/
$(document).ready(function() {


    //-------------------------------//
    // Global Variables
    //-------------------------------//
    $grid = $('#grid');


    // Create menu
    applySlideoutMenu();

     // Create chart object
     dashboard = consoleDashboard();
     dashboard.initDashboard();

    // Create simulation object
    simulation = Simulation();

    // Start simulation
    simulation.startSimulation();


    // Enable drag/drop, various clicking features
    // Attach events to simulation buttons
     applyDraggabilly(simulation);






})