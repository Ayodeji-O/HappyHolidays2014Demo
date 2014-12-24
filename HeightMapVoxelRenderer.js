// HeightMapVoxelRenderer.js - Renders a height map using voxels to a target context
// Author: Ayodeji Oshinnaiye
// Dependent upon:
//  -ContourGenerator.js
//  -DynamicHeightMap.js
//  -RgbColor.js

function heightMapVoxelRenderer(baseMapSpaceWidth, baseMapSpaceDepth, baseHeightMapHeight, baseObserverDistanceZ, baseScreenSpaceYCoord, minHeightColor, maxHeightColor) {
	this.baseMapSpaceWidth = baseMapSpaceWidth;
	this.baseMapSpaceDepth = baseMapSpaceDepth;
	this.baseScreenSpaceYCoord = baseScreenSpaceYCoord;
	this.minHeightColor = minHeightColor;
	this.maxHeightColor = maxHeightColor;
	
	// Base height of heightmap (cartesian coordinates)
	this.baseMapHeight = baseHeightMapHeight;
	
	this.baseObserverDistanceZ = baseObserverDistanceZ;
	
	// Voxel dimensions
	this.constVoxelWidth = 40;
	this.constVoxelHeight = 35;
}

/**
 * Renders a single row within the height map
 * @param targetContext {CanvasRenderingContext2D} Context into which the row will be rendered
 * @param heightMapRow {Array} Array of numerical height map values
 * @param outputDepthFraction {number} Depth fraction of the visible, rendered portion of the
 *                                     heightmap (between 0.0 - 1.0, inclusive)
 * @param maxAmplitude {number} Maximum amplitude value contained within the heightmap
 *
 */
heightMapVoxelRenderer.prototype.renderHeightMapRow = function(targetContext, heightMapRow, outputDepthFraction, maxAmplitude) {
	if (validateVar(heightMapRow) && validateVar(outputDepthFraction) &&
		validateVar(targetContext) && (heightMapRow instanceof Array) &&
		(heightMapRow.length > 0)) {
		
		var mapSpaceCoordZ = outputDepthFraction * this.baseMapSpaceDepth;
		
		// Rudimentary coordinate scaling factor in order to emulate perspective -
		// see the "3D projection" article on Wikipedia for details:
		// http://en.wikipedia.org/wiki/3D_projection
		var distanceScalingFactor = (this.baseObserverDistanceZ /
				(this.baseObserverDistanceZ + mapSpaceCoordZ));
				
		var rowCenteringOffset = (targetContext.canvas.width - (distanceScalingFactor * this.baseMapSpaceWidth)) / 2.0;
		
		// Denominator used to determine voxel color precision, when deciding when
		// to merge consecutive voxels (numerator is always one).
		var constVoxelMergeColorPrecisionDenom = 256;
		var currentVoxelColorCanBeMerged = false;
		var previousMultipliedVoxelValue = 0;
		
		var boundaryMergingInitialized = false;
		var previousVoxelBoundsCanBeMerged = false;
		var leadingXCoord = 0;
		var lastTrailingXCoord = 0;
		var previousVoxelRenderedYCoord = 0;
		targetContext.beginPath();
		targetContext.fillStyle = "RGB(0, 0, 0, 255)";
		var rowEndRequiresRendering = false;
		for (var valueLoop = 0; valueLoop < heightMapRow.length; valueLoop++) {		
			var mapSpaceCoordY = heightMapRow[valueLoop];
							
			var mapSpaceCoordX = this.baseMapSpaceWidth * ((valueLoop + 1) / heightMapRow.length);

			// Convert from map space to screen space; also convert/invertt map space Y-coordinates
			// (increasing Y value as coordinates progress upwards) to screen space coordinates
			// (decreasing Y value as coordines progress upwards).
			var screenSpaceCoordX = mapSpaceCoordX * distanceScalingFactor;
			var screenSpaceCoordY = this.baseScreenSpaceYCoord - ((mapSpaceCoordY + this.baseMapHeight) * distanceScalingFactor);
			
			// Center rendered line on screen.
			screenSpaceCoordX += rowCenteringOffset;				
			if (screenSpaceCoordX >= -(this.constVoxelWidth / 2) && (screenSpaceCoordX < targetContext.canvas.width + (this.constVoxelWidth / 2))) {


				if (!boundaryMergingInitialized) {
					boundaryMergingInitialized = true;
					leadingXCoord = screenSpaceCoordX;
					lastTrailingXCoord = screenSpaceCoordX;
					previousVoxelRenderedYCoord = screenSpaceCoordY;
				}
							
				// Set the color for the voxel, using the height from the height map in order to appropriately shade
				// the voxel.
				colorMultiplier = (heightMapRow[valueLoop] - (-maxAmplitude)) / (2.0 * maxAmplitude);

				currentVoxelColorCanBeMerged = 
					previousMultipliedVoxelValue === Math.floor(colorMultiplier * constVoxelMergeColorPrecisionDenom);
				
				previousVoxelBoundsCanBeMerged =				
					previousVoxelRenderedYCoord === Math.floor(screenSpaceCoordY);
				
				// Render the voxel.
				
				// If the previous voxel color is the same as the current voxel color, do not change the
				// fill color - reducing fill style parsing/fill style canvas state changes greatly
				// improves performance.
				if (!currentVoxelColorCanBeMerged) {					
					var currentVoxelColor = new rgbColor(
						(1.0 - colorMultiplier) * this.minHeightColor.getRedValue() + (colorMultiplier) * this.maxHeightColor.getRedValue(),
						(1.0 - colorMultiplier) * this.minHeightColor.getGreenValue() + (colorMultiplier) * this.maxHeightColor.getGreenValue(),
						(1.0 - colorMultiplier) * this.minHeightColor.getBlueValue() + (colorMultiplier) * this.maxHeightColor.getBlueValue(),
						1.0);
					targetContext.fillStyle = currentVoxelColor.getRgbIntValueAsStandardString();
					previousMultipliedVoxelValue = Math.floor(colorMultiplier * constVoxelMergeColorPrecisionDenom);
				}
				
				// If the current voxel is the same color as the previous voxel, and at the same output
				// Y-coordinate, merge this voxel with the previous voxel in order to reduce rendering
				// directives, improving performance.
				var mergeCurrentVoxel = (previousVoxelBoundsCanBeMerged && currentVoxelColorCanBeMerged)
				if (!mergeCurrentVoxel) {
					targetContext.rect(Math.floor(leadingXCoord - (this.constVoxelWidth / 2)),
						Math.floor(screenSpaceCoordY - (this.constVoxelHeight / 2)),
						this.constVoxelWidth + (lastTrailingXCoord - leadingXCoord), this.constVoxelHeight);
						previousVoxelRenderedYCoord = Math.floor(screenSpaceCoordY);
						leadingXCoord = screenSpaceCoordX;
						lastTrailingXCoord = screenSpaceCoordX;			
						
						rowEndRequiresRendering = false;
				}
				else {
					lastTrailingXCoord = screenSpaceCoordX;
					rowEndRequiresRendering = true;
				}
			}
			else if (rowEndRequiresRendering) {
				// The end of the row has been reached - force a render of the voxel section.
				targetContext.rect(Math.floor(leadingXCoord - (this.constVoxelWidth / 2)),
					Math.floor(screenSpaceCoordY - (this.constVoxelHeight / 2)),
					this.constVoxelWidth + (screenSpaceCoordX - leadingXCoord), this.constVoxelHeight);
					previousVoxelRenderedYCoord = Math.floor(screenSpaceCoordY);
					leadingXCoord = screenSpaceCoordX;	

				rowEndRequiresRendering = false;			
			}
		}
		targetContext.fill();
	}
}

/**
 * Renders a single row within the height map (callback for dynamicHeightMap.processHeightMap)
 * @param currentHeightMapRow {Array} Array of numerical height map values
 * @param currentRowIndex {number} Processing index of the row (not the actual height map row value)
 * @param totalHeightMapRows {number} Total number of rows that are being processed
 * @param maxAmplitude {number} Maximum amplitude permitted within the height map
 * @param processorData {Object} Data to be provided to the processor object
 *                               (the row renderer uses a canvas context for rendering)
 *
 * @see heightMapVoxelRenderer.renderHeightMapRow
 * @see dynamicHeightMap.processHeightMap
 */
heightMapVoxelRenderer.prototype.processHeightMapRow = function(currentHeightMapRow, currentRowIndex, totalHeightMapRows, maxAmplitude, processorData) {
	this.renderHeightMapRow(processorData, currentHeightMapRow, currentRowIndex/(totalHeightMapRows - 1), maxAmplitude); 
}