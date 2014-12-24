// FirstPersonSleighRideScene.js - Happy Holidays 2014 main sleigh ride scene
// Author: Ayodeji Oshinnaiye
// Dependent upon:
//  -ContourGenerator.js
//  -DynamicHeightMap.js
//  -HeightMapVoxelRenderer.js
//  -RgbColor.js
//  -TextScroller.js

function firstPersonSleighRideScene() {
	this.constHeightMapWidth = 280;
	this.constHeightMapDepth = 900;
	var constMaxHeightMapHeight = 50;
	var constNumHeightMapContours = 3;
	
	var constTreeImageCanvasWidth = 200;
	var constTreeImageCanvasHeight = 400;

	this.constBaseScreenSpaceCoordY = 400;
	
	// Maximum width value for the height map (does not change the acutal
	// width of the height map - will affect how the heightmap is expanded
	// when rendered).
	this.constBaseHeightMapSpaceWidth = 14000;
	
	// Maximum depth value for the height map (does not change the actual
	// depth of the height map - will affect how the heightmap is expanded
	// when rendered).
	this.constBaseHeightMapSpaceDepth = 550;
	
	this.constBaseObserverDistanceZ = 10;
	
	this.constBaseHeightMapHeight = -450;
	
	var constMinColorIntensity = 0.8;
	var constMaxColorIntensity = 0.95;
	
	this.heightMapRenderer = new heightMapVoxelRenderer(this.constBaseHeightMapSpaceWidth, this.constBaseHeightMapSpaceDepth, this.constBaseHeightMapHeight,
		this.constBaseObserverDistanceZ, this.constBaseScreenSpaceCoordY,
		new rgbColor(constMinColorIntensity, constMinColorIntensity, constMinColorIntensity),
		new rgbColor(constMaxColorIntensity, constMaxColorIntensity, constMaxColorIntensity));
	this.terrainHeightMap = new dynamicHeightMap(this.constHeightMapWidth, this.constHeightMapDepth, constMaxHeightMapHeight, constNumHeightMapContours);

	// Allocate space for tree coordinates (trees will randomly be placed at the left and
	// right borders of the scene).
	this.allocateTreeBorderStorage(this.constHeightMapDepth);
	
	this.currentStartingTreeBorderRow = 0;
	
	this.messageScroller = new textScroller(Constants.scrollerFontSizePx, Constants.scrollerFont, Constants.scrollerFontStyle);
	this.messageScroller.setSourceString(Constants.messageText);
	
	// Position at which the scroller should be displayed.
	this.constScrollerOffsetFromBottom = 100;
	this.scrollerCoordX = 0;
	this.scrollerCoordY = Constants.defaultCanvasHeight - this.constScrollerOffsetFromBottom;
	
	this.scrollerBackgroundColor = new rgbColor(
		Constants.scrollerBackgroundUnitIntensity,
		Constants.scrollerBackgroundUnitIntensity,
		Constants.scrollerBackgroundUnitIntensity,		
		Constants.scrollerBackgroundUnitAlpha);
	
	this.backBufferCanvas = document.createElement("canvas");
	this.backBufferCanvas.width = Constants.defaultCanvasWidth;
	this.backBufferCanvas.height = Constants.defaultCanvasHeight;
	this.backBufferCanvasContext = this.backBufferCanvas.getContext("2d");

	this.treeImageCanvas = document.createElement("canvas");
	this.treeImageCanvas.width = constTreeImageCanvasWidth;
	this.treeImageCanvas.height = constTreeImageCanvasHeight;
	this.treeImageCanvasContext = this.treeImageCanvas.getContext("2d");
	
	// Height map generation states - the height map is generated as separate
	// halves, enabling the height map to be re-generated during scene
	// excecution - one half of the height map is rendered for several frames,
	// until it is time to render the second half of the height map, at which
	// point it is re-generated. These constants indicate the height map
	// regeneration state.
	this.constMapGenStateWaitGenSecondHalf = 0;
	this.constMapGenStateWaitGenFirstHalf = 1;
	
	// Variable that tracks the height map regeneration state.
	this.currentMapGenState = this.constMapGenStateWaitGenSecondHalf;
		
	// Scroller states - lead-in in is the delay before any of the scroller is displayed,
	// fade in is the period where the background fades-in in, and the text display
	// phase indicates the phase where the scroller is actually operating.
	this.constScrollerStateLeadIn = 0;
	this.constScrollerStateFadeIn = 1;
	this.constScrollerStateDisplayText = 2;
	
	// Stores the current scroller state
	this.currentScrollerState = this.constScrollerStateLeadIn;
	
	// Tracks the time in the present scroller state.
	this.currentScrollerStateTime = 0;
	
	// Scroller lead-in time (milliseconds)
	this.constScrollerStateLeadInTime = 3000;
	
	// Scroller fade-in time (milliseconds)
	this.constScrollerStateFadeInTime = 2000;
	
	
	// Will hold the total execution time of the scene (summation of time quanta provided
	// to the scene execution object) - used for scene timing.
	this.totalExecutionTimeMs = 0.0;
}

/**
 * Initializes/allocates storage for the bordering rows of trees
 *  that are displayed in the downhill scene
 * @param treeRowCount {number} The number of rows of trees to be allocated
 */
firstPersonSleighRideScene.prototype.allocateTreeBorderStorage = function(treeRowCount) {
	this.treeBorderStorage = new Array();
	
	// Each row is an array that can hold the horizontal coordinates
	// of one or more trees on a single row (ideally, a maximum of
	// two should be used).
	for(var initLoop = 0; initLoop < treeRowCount; initLoop++) {
		this.treeBorderStorage.push(new Array());
	}
}

/**
 * Produces randomized coordinates along the x-axis for the trees
 *  that are to be displayed in the downhill scene (rows must first
 *  be allocated with firstPersonSleighRideScene.allocateTreeBorderStorage
 * @param startRow {number} The first row for which coordinates are to
 *                          be generated
 * @param rowCount {number} The total number of rows for which coordinates
 *                          will be generated
 * @see firstPersonSleighRideScene.allocateTreeBorderStorage
 */
firstPersonSleighRideScene.prototype.generateTreeCoordinates = function(startRow, rowCount) {
	// Probability that a tree will be created in any given position.
	var constTreeCreationProbability = 0.05;
	
	// Ideal left and right side coordinates for the trees.
	var constLeftCoordinate = 8200;
	var constRightCoordinate = 5500;
	
	// Variance to be applied to the coordinates in order to
	// make the arrangement of the trees appear slightly more random.
	var coordinateVariance = 500;
	
	if (validateVar(startRow) && (startRow >= 0) && validateVar(rowCount) && (rowCount > 0)) {
		for (rowLoop = 0; rowLoop < rowCount; rowLoop++) {
			currentRowIndex = (startRow + rowLoop) % this.treeBorderStorage.length;

			// Use the pre-determined probability to create a tree on either the left side, the
			// right side, or both.
			this.treeBorderStorage[currentRowIndex] = new Array();
			if (Math.random() <= constTreeCreationProbability) {
				this.treeBorderStorage[currentRowIndex].push(constLeftCoordinate + (coordinateVariance * Math.random()));
			}
			
			if (Math.random() <= constTreeCreationProbability) {
				this.treeBorderStorage[currentRowIndex].push(constRightCoordinate + (coordinateVariance * Math.random()));
			}
		}
	}
}

/**
 * Standard scene method - performs a one-time initialization of
 *  scene resources
 */
firstPersonSleighRideScene.prototype.initialize = function() {
	clearContext(this.backBufferCanvasContext, "RGBA(0, 0, 0, 255)");
	// Draw the downhill scene background, which will persist, as the image data
	// from the background will be used to "erase" the rendered heightmap
	// portion of the scene when the heightmap is to be re-rendered.
	this.backBufferCanvasContext.save();
	var backgroundImage = globalResources.getDownHillSceneImage();
	if (validateVar(backgroundImage)) {
		this.backBufferCanvasContext.drawImage(backgroundImage, 0, 0, 
			this.backBufferCanvas.width, this.backBufferCanvas.height);		
	}
	this.backBufferCanvasContext.restore();
	
	// Draw the draw image, which will be used to adorn the border
	// of the scene with trees.
	this.treeImageCanvasContext.save();
	clearContext(this.treeImageCanvasContext, "RGBA(0, 0, 0, 0)");
	var treeImage = globalResources.getTreeImage();
	if (validateVar(treeImage)) {
		this.treeImageCanvasContext.drawImage(treeImage, 0, 0,
			this.treeImageCanvas.width, this.treeImageCanvas.height);
	}
	this.treeImageCanvasContext.restore();
	
	this.terrainHeightMap.generateHeightMap(0.0, 1.0);
	this.generateTreeCoordinates(0, this.treeBorderStorage.length);
}

/**
 * Renders the text scroller output to a specified canvas context
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {CanvasRenderingContext2D} The output canvas context
 *                                                       to which the text scroller
 *                                                       will be rendered
 */
firstPersonSleighRideScene.prototype.renderScrollerSection = function(timeQuantum, targetCanvasContext) {
	if (validateVar(targetCanvasContext) && (this.currentScrollerState !== this.constScrollerStateLeadIn)) {
	
		// Draw a background strip in order to enhance scroller readability.
		targetCanvasContext.save();
		targetCanvasContext.fillStyle = this.scrollerBackgroundColor.getRgbaIntValueAsStandardString();
		
		// Set the alpha for the scroller background (the alpha is variable as the scroller background
		// fades-in).
		targetCanvasContext.globalAlpha = (this.currentScrollerState === this.constScrollerStateFadeIn) ?
			Constants.scrollerBackgroundUnitAlpha * (this.currentScrollerStateTime / this.constScrollerStateFadeInTime) :
			Constants.scrollerBackgroundUnitAlpha;
		targetCanvasContext.fillRect(this.scrollerCoordX, this.scrollerCoordY,
			targetCanvasContext.canvas.width, this.messageScroller.getTextAreaHeight());
		targetCanvasContext.restore();
		
		// Display the scroller text.
		if (this.currentScrollerState === this.constScrollerStateDisplayText) {
			this.messageScroller.renderScroller(targetCanvasContext, this.scrollerCoordX, this.scrollerCoordY);
			this.messageScroller.advanceScroller();
		}
	}
	
	this.updateScrollerState(timeQuantum);
}

/**
 * Updates the display state of the scroller, depending upon the
 *  amount of total time that has elapsed in the scene execution
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
firstPersonSleighRideScene.prototype.updateScrollerState = function(timeQuantum) {
	this.currentScrollerStateTime += timeQuantum;

	if ((this.currentScrollerState === this.constScrollerStateLeadIn) &&
		(this.currentScrollerStateTime >= this.constScrollerStateLeadInTime)) {
		
		// Lead-in time has been completed - advance the scroller to the
		// fade-in phase.
		this.currentScrollerState = this.constScrollerStateFadeIn;
		this.currentScrollerStateTime = 0;
	}
	else if ((this.currentScrollerState === this.constScrollerStateFadeIn) &&
		(this.currentScrollerStateTime >= this.constScrollerStateFadeInTime)) {
	
		// The scroller fade-in phase has been completed - display the scroller
		// text.
		this.currentScrollerState = this.constScrollerStateDisplayText;
		this.currentScrollerStateTime = 0;	
	}
}

/**
 * Renders a single "row" of trees (along the x-coordinate) - these
 *  trees will border the downhill scene (prototype matches the
 *  callback for dynamicHeightMap.processHeightMap, as this routine
 *  is invoked by firstPersonSleighRideScene.processHeightMapRow)
 * @param currentHeightMapRow {Array} Array of numerical height map values
 * @param currentRowIndex {number} Processing index of the row (not the actual height map row value)
 * @param totalHeightMapRows {number} Total number of rows that are being processed
 * @param maxAmplitude {number} Maximum amplitude permitted within the height map
 * @param processorData {Object} Data to be provided to the processor object
 *                               (the tree row renderer uses a canvas context for rendering)
 * @see firstPersonSleighRideScene.processHeightMapRow
 */
firstPersonSleighRideScene.prototype.renderTreeBorderSingleRow = function(currentHeightMapRow, currentRowIndex, totalHeightMapRows, maxAmplitude, processorData) {
	var actualTreeRow = (this.currentStartingTreeBorderRow + currentRowIndex) % this.treeBorderStorage.length;
	
	if (this.treeBorderStorage[actualTreeRow].length > 0) {	
		var outputDepthFraction = currentRowIndex / (totalHeightMapRows - 1);
		var mapSpaceCoordZ = outputDepthFraction * this.constBaseHeightMapSpaceDepth;
		var baseTreeHeight = this.constBaseHeightMapHeight;
		
		var distanceScalingFactor = (this.constBaseObserverDistanceZ /
				(this.constBaseObserverDistanceZ + mapSpaceCoordZ));			
		
		for (var treePositionLoop = 0; treePositionLoop < this.treeBorderStorage[actualTreeRow].length; treePositionLoop++) {
			var mapSpaceCoordX = this.treeBorderStorage[actualTreeRow][treePositionLoop];

			// Convert from map space to screen space; also convert/invertt map space Y-coordinates
			// (increasing Y value as coordinates progress upwards) to screen space coordinates
			// (decreasing Y value as coordines progress upwards).
			var screenSpaceCoordX = mapSpaceCoordX * distanceScalingFactor;
			var screenSpaceCoordY = this.constBaseScreenSpaceCoordY - (baseTreeHeight * distanceScalingFactor);		
			
			var rowCenteringOffset = (processorData.canvas.width - (distanceScalingFactor * this.constBaseHeightMapSpaceWidth)) / 2.0;
			screenSpaceCoordX += rowCenteringOffset;
			
			var treeRenderedWidth = this.treeImageCanvas.width * distanceScalingFactor;
			var treeRenderedHeight = this.treeImageCanvas.height * distanceScalingFactor;
				
			processorData.drawImage(this.treeImageCanvas, screenSpaceCoordX - treeRenderedWidth / 2.0,
				(screenSpaceCoordY - treeRenderedHeight), treeRenderedWidth, treeRenderedHeight);
		}
	}		
}

/**
 * Regenerates non-visible/non-rendered regions of the height map
 *  and tree position storage - at any given point, at least half
 *  of the height map should not be displayed if the rendered row
 *  count and total height map depth has properly been configured,
 *  permitting half of the height map to be regenerated without
 *  affecting the portion being immediately displayed
 * @param startingRow {number} First row in the set of rows currently
 *                             being processed/displayed
 * @param rowCount {number} Number of rows being processed/displayed
 *                          (data will be regenerated based on what data
 *                          is not being displayed)
 */
firstPersonSleighRideScene.prototype.manageMapRegionRegen = function(startingRow, rowCount) {	
	if (validateVar(startingRow) && validateVar(rowCount)) {
		var firstHalfStart = 0;
		var secondHalfStart = this.constHeightMapDepth / 2.0;
		
		var trueEndingRow = ((startingRow + rowCount) % this.constHeightMapDepth);

		if ((this.treeBorderStorage.length > 0) && (this.constHeightMapDepth > 0)) {	
			if ((this.currentMapGenState == this.constMapGenStateWaitGenSecondHalf) &&
				(trueEndingRow >= secondHalfStart)) {
				
				// Update the second half of the height map and tree display coordinates (the first half
				// has just finished being displayed).
				this.terrainHeightMap.generateHeightMap(secondHalfStart / (this.constHeightMapDepth - 1),
					1.0);
				this.generateTreeCoordinates(this.currentStartingTreeBorderRow + (this.treeBorderStorage.length / 2),
					this.treeBorderStorage.length / 2);

				this.currentMapGenState = this.constMapGenStateWaitGenFirstHalf;
			}
			else if ((this.currentMapGenState == this.constMapGenStateWaitGenFirstHalf) &&
				(trueEndingRow < secondHalfStart)){
		
				// Update the first half of the height map and tree display coordinates (the second half
				// has just finished being displayed).		
				this.terrainHeightMap.generateHeightMap(0.0,
					(secondHalfStart - 1) / (this.constHeightMapDepth - 1));
				this.generateTreeCoordinates(this.currentStartingTreeBorderRow + (this.treeBorderStorage.length / 2),
					this.treeBorderStorage.length / 2);			
					
				this.currentMapGenState = this.constMapGenStateWaitGenSecondHalf;
			}
		}
	}
}

/**
 * Renders a single "row" of the height map, in addition to a single
 *  row of trees. Invokes the appropriate methods within the height map
 *  renderer and the tree row renderer that have the proper prototype to
 *  match that required by the dynamicHeightMap.processHeightMap (callback for
 *  dynamicHeightMap.processHeightMap)
 * @param currentHeightMapRow {Array} Array of numerical height map values
 * @param currentRowIndex {number} Processing index of the row (not the actual height map row value)
 * @param totalHeightMapRows {number} Total number of rows that are being processed
 * @param maxAmplitude {number} Maximum amplitude permitted within the height map
 * @param processorData {Object} Data to be provided to the processor object
 *                               (canvas context)
 * @see dynamicHeightMap.processHeightMap
 */
firstPersonSleighRideScene.prototype.processHeightMapRow = function(currentHeightMapRow, currentRowIndex, totalHeightMapRows, maxAmplitude, processorData) {
	// Render the trees that may border a particular rendered height map row...
	this.renderTreeBorderSingleRow(currentHeightMapRow, currentRowIndex, totalHeightMapRows, maxAmplitude, processorData);
	// ...Render the height map row.
	this.heightMapRenderer.processHeightMapRow(currentHeightMapRow, currentRowIndex, totalHeightMapRows, maxAmplitude, processorData);
}

/**
 * Executes a time-parameterized single scene animation step
 * @param timeQuantum Time delta with respect to the previously-executed
 *                    animation step (milliseconds)
 * @param targetCanvasContext {CanvasRenderingContext2D} Context onto which
 *                            the scene data will be drawn
 */
firstPersonSleighRideScene.prototype.executeStep = function(timeQuantum, targetCanvasContext) {
	this.totalExecutionTimeMs += timeQuantum;

	// Amount of time required to advance one row within the height map (milliseconds).
	var constTimeMsPerRow = 20.0;
	
	// Number of rows within the height map to be processed (rendered)
	var constNumRowToProcess = 90;
	
	targetCanvasContext.drawImage(this.backBufferCanvas, 0, 0);
	var currentStartingRow = Math.round(this.totalExecutionTimeMs / constTimeMsPerRow);
	this.currentStartingTreeBorderRow = currentStartingRow;
	this.terrainHeightMap.processHeightMap(currentStartingRow, constNumRowToProcess, this, targetCanvasContext);
	
	this.renderScrollerSection(timeQuantum, targetCanvasContext);
	
	this.manageMapRegionRegen(currentStartingRow, constNumRowToProcess);
}