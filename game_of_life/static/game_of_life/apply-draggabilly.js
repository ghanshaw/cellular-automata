//*************************************************//
// Create all draggabilly objects
// Draggabilly plugin provide mobile/desktop drag/drop
// functionality and touch/click functionality
//*************************************************//
function applyDraggabilly (simulation){


    //---------------------------------------------------//
    // Implement plugin for console buttons
    // Enables console button functionality
    //---------------------------------------------------//



    var consoleButtons = document.getElementsByClassName('btn-console');
    var $draggieConsoleButtons = [];



    for (var i = 0; i < consoleButtons.length; i++) {

        var $draggieConsoleButton = $(consoleButtons[i]).draggabilly({});
        $draggieConsoleButton.draggabilly('disable');

        // If console button is speed button, add additional event listeners
        if ($draggieConsoleButton.hasClass('btn-speed')) {

            // Add additional static click event to speed buttons
            $draggieConsoleButton.on('staticClick', function(event, pointer) {

                $speedButton = $(event.target);

                // If the speed button is inactive, then
                // remove styling from other buttons and
                // add styling to that button
                if (!$speedButton.hasClass('switched-on')) {

                    $('.btn-speed').removeClass('switched-on');
                    $speedButton.addClass('switched-on');

                }
            })

        }

        $draggieConsoleButtons.push($draggieConsoleButton);
    }


    //---------------------------------------------------//
    // Implement plugin for simulation canvas
    // Enables cell highlighting
    //---------------------------------------------------//

    var $draggieGrid = $('#grid').draggabilly({});
    $draggieGrid.draggabilly('disable');

    // Track cells highlighted by users and prevent duplicates
    $draggieGrid.newCells = [];
    $draggieGrid.setCells = new Set();


    $draggieGrid.on('pointerMove', function(event, pointer) {


        gridEdges = Edges($grid);
        gridX = pointer.pageX - gridEdges.left;
        gridY = pointer.pageY - gridEdges.top;

        console.log(gridX, gridY);

        var rowCol = simulation.getRowCol(gridX, gridY);

        var cellId = parseFloat(rowCol.row + '.' + rowCol.col);
        console.log(cellId);

        if (!$draggieGrid.setCells.has(cellId)) {
            $draggieGrid.newCells.push(rowCol);
            $draggieGrid.setCells.add(cellId);
        }

        simulation.toggleCell(rowCol.row, rowCol.col, true);


    });


    $draggieGrid.on('pointerUp', function(event, pointer) {


        simulation.activateCells($draggieGrid.newCells);
        $draggieGrid.setCells.clear();
        $draggieGrid.newCells = [];

    })

    //---------------------------------------------------//
    // Implement plugin for simulation patterns
    // Enables drag and drop of patterns
    //---------------------------------------------------//

    var patterns = document.getElementsByClassName('pattern-wrapper');
    //var $patterns = $('.pattern-overlay');

    var $draggiePatterns = [];

    for (var i = 0; i < patterns.length; i++) {

        var $draggiePattern = $(patterns[i]).draggabilly();

        $draggiePattern.on('dragStart', function(event, pointer) {

            //var $patternWrapper = $(ev.target.parentElement);

            var $gridOffsetTop = $grid.offset().top

            $('body').animate({
                scrollTop: $gridOffsetTop - 50
            }, 500)



            var draggieData = $draggiePattern.data('draggabilly');
            //console.log(draggieData);

            // Check the pattern is within bounds of board

        })

        $draggiePattern.on('dragMove', function(event, pointer){

            var $pattern = $(event.currentTarget).find('img');
            var $patternWrapper = $(event.currentTarget);

            var gridEdges = Edges($grid);
            var patternEdges = Edges($patternWrapper);

            console.log(event.currentTarget);
            console.log(pointer);
            console.log(patternEdges);
            console.log(gridEdges);


            if (patternEdges.inBounds(gridEdges)) {

                console.log('inBounds');
                $pattern.addClass('in-bounds');
                $patternWrapper.addClass('in-bounds');

            } else {
                $pattern.removeClass('in-bounds');
                $patternWrapper.removeClass('in-bounds');

            }

        })

        $draggiePattern.on('dragEnd', function(event, pointer) {

            var $pattern = $(event.currentTarget).find('img');
            var $patternWrapper = $(event.currentTarget);

            //var patternName
            var patternName = event.target.id.split('-')[1];

            var gridEdges = Edges($grid);
            var patternEdges = Edges($pattern);

            // Compute the x, y within grid
            if (patternEdges.inBounds(gridEdges)) {


                // Remove styling, fade element and return it
                $patternWrapper.fadeOut(500, function() {
                    $pattern.removeClass('in-bounds');
                    $patternWrapper.removeClass('in-bounds').css({ 'left': 0, 'top': 0 }).show();

                });

                // Put element back



                // Compute row and column of pattern in grid
                var y = gridEdges.top - patternEdges.top;
                var x = gridEdges.left - patternEdges.left;

                x = Math.abs(x);
                y = Math.abs(y);

                console.log(patternName);

                simulation.addPattern(x, y, patternName);


                console.log("Panend");
                console.log([x, y]);

                // Compute corresponding x,y within grid matrix
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

                console.log($patternWrapper)

                //$patternWrapper.addClass('slow-transition');

                //$patternWrapper.css('transform', translation);

                $pattern.removeClass('in-bounds');
                $patternWrapper.removeClass('in-bounds');

            }

        })


        $draggiePatterns.push($draggiePattern);

    }


}