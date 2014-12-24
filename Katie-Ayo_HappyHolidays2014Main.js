// Katie-Ayo_HappyHolidays2014Main.js - Happy Holidays 2014 demo entry point
// Author: Ayodeji Oshinnaiye
// Dependent upon:
//  -Utility.js
//  -RgbColor.js
//  -InternalCosntants.js
//  -ContourGenerator.js
//  -DynamicHeightMap.js
//  -HeightMapVoxelRenderer.js
//  -SceneExecution.js
//  -TextScroller.js
//  -FirstPersonSleighRideScene.js

/**
 * Object that contains resources that will be
 *  accessible to all areas of the demo
 */
function globalResources() {
}

/**
 * Loads a "down-hill scene" image, executing the provided
 *  function upon completion of the loading process
 * @param completionFunction {function} Function to be executed when
 *                           loading of the background image has been
 *                           completed
 */
globalResources.loadDownHillSceneImage = function(completionFunction) {
	if (validateVar(completionFunction) && (typeof completionFunction == "function")) {
		// Attempt to load the downhill scene image, invoking the specified
		// competion function upon success.
		this.downHillSceneImage = new Image()
		this.downHillSceneImage.onload = completionFunction;
		this.downHillSceneImage.src = Constants.firstPersonSleighRideSceneBackgroundImageFileSpec;
	}
}

/**
 * Loads a tree image, executing the provided
 *  function upon completion of the loading process
 * @param completionFunction {function} Function to be executed when
 *                           loading of the image has been completed
 */
globalResources.loadTreeImage = function(completionFunction) {
	if (validateVar(completionFunction) && (typeof completionFunction == "function")) {
		// Attempt to load the tree image, invoking the specified completion
		// function upon success.
		this.treeImage = new Image();
		this.treeImage.onload = completionFunction;
		this.treeImage.src = Constants.coniferousTreeImageFileSpec;
	}
}

/**
 * Returns the downhill scene background image
 * @return {Image} The downhill scene background image (the
 *                 image must be loaded beforehand)
 * @see globalResources.loadDownHillSceneImage
 */
globalResources.getDownHillSceneImage = function () {
	return this.downHillSceneImage;
}

/**
 * Returns the tree image
 * @return {Image} The tree image (the image must be loaded beforehand)
 * @see globalResources.loadTreeImage
 */
globalResources.getTreeImage = function() {
	return this.treeImage;
}

/**
 * Sets the "main" canvas context used for drawing data to the
 *  browser window
 * @param mainCanvasContext {CanvasRenderingContext2D} The canvas context the
 *                          will be retrieved for drawing data to the browser
 *                          window
 */
globalResources.setMainCanvasContext = function(mainCanvasContext) {
	this.mainCanvasContext = mainCanvasContext;
}

/**
 * Retrieves the "main" canvas context used for drawing data
 *  to the browser window
 * @return {CanvasRenderingContext2D} The canvas context used for
 *         drawing data to the browser window
 */
globalResources.getMainCanvasContext = function() {
	return typeof this.mainCanvasContext !== "undefined" ?
		this.mainCanvasContext : null;
}


/**
 * Initializes any required DOM resources
 *  (creates objects, etc.)
 * @param completionFunction {function} Function to be invoked after the
 *                                      DOM resource initialization has
 *                                      been completed.
 * @param functionParam Completion function parameter
 */
function initDomResources(completionFunction, functionParam) {
	// Create the main canvas on which output
	// will be displayed..
	mainDiv = document.createElement("div");
	
	// Center the div within the window (the height centering will
	// not be retained if the window size has been altered).
	mainDiv.setAttribute("style", "text-align:center; margin-top: " +
		Math.round((window.innerHeight - Constants.defaultCanvasHeight) / 2.0) + "px");
	
	// Add the DIV to the DOM.
	document.body.appendChild(mainDiv);		
	var mainCanvas = document.createElement("canvas");

    if (validateVar(mainCanvas) && (typeof mainCanvas.getContext === 'function')) {
		mainCanvas.width = Constants.defaultCanvasWidth;
		mainCanvas.height = Constants.defaultCanvasHeight;
	
        // Store the two-dimensional context that is
        // required to write data to the canvas.
        mainCanvasContext = mainCanvas.getContext('2d');
    
		if (validateVar(mainCanvasContext)) {
			// Add the canvas object to the DOM (within the DIV).
			mainDiv.appendChild(mainCanvas);
			
			globalResources.setMainCanvasContext(mainCanvasContext);
			
			// This section of initialization code comprises an initialization
			// chain, where the tree image loading completion function invokes
			// the backdrop scene loading, which has a completion function that
			// ultimately invokes the start of the demo.
			
			function loadDownHillSceneCompletionFunction() {			
				// This code will be executed upon successful loading
				// of all image resources.
				completionFunction(functionParam);
			}			
						
			function loadTreeImageCompletionFunction() {			
				// Load the downhill scene image, and execute the demo once the
				// image loading process has been completed.
				globalResources.loadDownHillSceneImage(loadDownHillSceneCompletionFunction);	
			}

			// Load the tree image - upon success, the background image will
			// be loaded...
			globalResources.loadTreeImage(loadTreeImageCompletionFunction);
		}
    }
	else {
		// HTML 5 canvas object is not supported (e.g. Internet Explorer 8 and earlier).
		document.write(Constants.errorMessageNoCanvasSupport);
	}
}

/**
 * Main routine - function that is
 *  executed when page loading has
 *  completed
 */
onLoadHandler = function() {
	// Create the main sleigh ride scene, and ultimately
	// invoke the start of the demo.
	var sleighRideScene = new firstPersonSleighRideScene();
	initDomResources(sceneExecution, sleighRideScene);
}