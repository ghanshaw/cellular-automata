//*************************************************//
// Create all draggabilly objects
// Draggabilly plugin provide mobile/desktop drag/drop
// functionality and touch/click functionality
//*************************************************//
function applyDraggabilly (simulation) {


    //---------------------------------------------------//
    // Implement plugin for simulation canvas
    // Enables cell highlighting
    //---------------------------------------------------//

    var $draggieGrid = $('#grid').draggabilly({});
    $draggieGrid.draggabilly('disable');

    // Track cells highlighted by users and prevent duplicates
    $draggieGrid.newCells = [];
    $draggieGrid.setCells = new Set();


    $draggieGrid.on('pointerDown', function(event, pointer) {

        // Flag to indicate if simulation is paused
        //$draggieGrid.simPaused = false;

        if (simulation.isRunning) {
            simulation.isPaused = true;
            simulation.isAltering = true;
        }


        $draggieGrid.setCells.clear();
        $draggieGrid.newCells = [];


        gridEdges = Edges($grid);
        gridX = pointer.pageX - gridEdges.left;
        gridY = pointer.pageY - gridEdges.top;


        var rowCol = simulation.getRowCol(gridX, gridY);

        var inBounds = rowCol.row >= 0 && rowCol.row < simulation.gridRows && rowCol.col >= 0 && rowCol.col < simulation.gridCols;

        if (!inBounds) { return; }

        var cellId = rowCol.row + '.' + rowCol.col;

        if (!$draggieGrid.setCells.has(cellId)) {
            var cell = [rowCol.row, rowCol.col]
            $draggieGrid.newCells.push(cell);
            $draggieGrid.setCells.add(cellId);
        }

        simulation.toggleCell(rowCol.row, rowCol.col, true);


    })


    $draggieGrid.on('pointerMove', function(event, pointer) {


        gridEdges = Edges($grid);
        gridX = pointer.pageX - gridEdges.left;
        gridY = pointer.pageY - gridEdges.top;

        console.log(gridX, gridY);

        var rowCol = simulation.getRowCol(gridX, gridY);

        var inBounds = rowCol.row >= 0 && rowCol.row < simulation.gridRows && rowCol.col >= 0 && rowCol.col < simulation.gridCols;

        if (inBounds) {

            var cellId = rowCol.row + '.' + rowCol.col;
            console.log(cellId);

            if (!$draggieGrid.setCells.has(cellId)) {
                var cell = [rowCol.row, rowCol.col]
                $draggieGrid.newCells.push(cell);
                $draggieGrid.setCells.add(cellId);
            }

        }



        simulation.toggleCell(rowCol.row, rowCol.col, true);


    });


    $draggieGrid.on('pointerUp', function(event, pointer) {

        simulation.isAltering = false;

        // Send cell update to server
        simulation.activateCells($draggieGrid.newCells);

    })

    //---------------------------------------------------//
    // Implement plugin for simulation patterns
    // Enables drag and drop of patterns
    //---------------------------------------------------//

    var patterns = document.getElementsByClassName('pattern-wrapper');
    //var $patterns = $('.pattern-overlay');

    var $draggiePatterns = [];

    for (var i = 0; i < patterns.length; i++) {

        var $draggiePattern = $(patterns[i]).draggabilly({
            //grid: [simulation.cellWidth, simulation.cellHeight]
        });


        $draggiePattern.on('dragStart', function(event, pointer) {

            //var $patternWrapper = $(ev.target.parentElement);

            var $gridOffsetTop = $grid.offset().top

            $('body').animate({
                scrollTop: $gridOffsetTop - 50
            }, 500)


            var draggieData = $draggiePattern.data('draggabilly');

            //$draggiePattern.simPaused = false;
            //this.isPaused = true;

        })

        $draggiePattern.on('dragMove', function(event, pointer){

            var $pattern = $(event.currentTarget).find('img');
            var $dropBox = $(event.currentTarget).find('.drop-box');
            var $patternWrapper = $(event.currentTarget);

            var gridEdges = Edges($grid);
            var patternEdges = Edges($patternWrapper);
            var dropBoxEdges = Edges($dropBox);

//            console.log(event.currentTarget);
//            console.log(pointer);
//            console.log(patternEdges);
//            console.log(gridEdges);


            if (dropBoxEdges.inBounds(gridEdges)) {

                // If simulation is running and not paused, puase it
                if (simulation.isRunning && !simulation.isPaused) {

                    simulation.isPaused = true;
                    simulation.isAltering = true;

                    // Stop simulation
                    //simulation.stopSimulation();

                    // Indicate that simulation is paused
                    //$draggiePattern.simPaused = true;

                }


                // Style pattern
                console.log('inBounds');
                $pattern.addClass('in-bounds');
                $patternWrapper.addClass('in-bounds');

            } else {



                // If simulation is running and is paused, unpause it
                if (simulation.isRunning && simulation.isPaused) {

                    simulation.isPaused = false;
                    simulation.isAltering = false;

                }

                // Style pattern
                $pattern.removeClass('in-bounds');
                $patternWrapper.removeClass('in-bounds');

            }

        })

        $draggiePattern.on('dragEnd', function(event, pointer) {

            var $pattern = $(event.currentTarget).find('img');
            var $dropBox = $(event.currentTarget).find('.drop-box');
            var $patternWrapper = $(event.currentTarget);

            //var patternName
            var patternName = event.target.id.split('-')[1];

            var gridEdges = Edges($grid);
            var patternEdges = Edges($pattern);
            var dropBoxEdges = Edges($dropBox);

            // If you drop in bounds and simulation isn't frozen
            if (dropBoxEdges.inBounds(gridEdges) && !simulation.isFrozen) {


                // Remove styling, fade element and return it
                $patternWrapper.fadeOut(500, function() {
                    $pattern.removeClass('in-bounds');
                    $patternWrapper.removeClass('in-bounds').css({ 'left': 0, 'top': 0 }).show();

                });

                // Compute row and column of pattern in grid
                var y = gridEdges.top - dropBoxEdges.top;
                var x = gridEdges.left - dropBoxEdges.left;

                x = Math.abs(x);
                y = Math.abs(y);

                simulation.isAltering = false;
                simulation.addPattern(x, y, patternName);

                // If simulation is running and is paused, unpause it and resume
                if (simulation.isRunning && simulation.isPaused) {



                    // Indicate that simulation is not paused
                    //$draggiePattern.simPaused = false;

                    // Resume simulation
                    //simulation.runSimulation();

                }

            }
            // If pan ends and pattern is not within bounds
            else {

                //var $gridOffsetTop = $grid.offset().top
                console.log('not in bounds');


                $patternWrapper.animate({

                    left: 0,
                    top: 0,

                }, 500);

                var translation = 'translate(0px, 0px)';

                //console.log($patternWrapper)

                //$patternWrapper.addClass('slow-transition');

                //$patternWrapper.css('transform', translation);

                $pattern.removeClass('in-bounds');
                $patternWrapper.removeClass('in-bounds');

            }

        })


        $draggiePatterns.push($draggiePattern);

    }


}