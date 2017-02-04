/*************************************************/
// Wait for DOM to load, initiate all functions
/*************************************************/
$(document).ready(function() {

     // Create dashboard object
     var dashboard = consoleDashboard();
     dashboard.initDashboard();

    // Create simulation object
    var simulation = Simulation(dashboard);
    simulation.initSimulation();

});