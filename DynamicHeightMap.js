// DynamicHeightMap.js - Representation of a height map that can be programmatically
//                       generated/updated
// Author: Ayodeji Oshinnaiye
// Dependent upon:
//  -Utility.js
//  -ContourGenerator.js

function dynamicHeightMap(width, depth, maxContourAmplitude, numAggregateContours) {
	this.constMinPermissibleDepthFraction = 0.0;
	this.constMaxPermissibleDepthFraction = 1.0;
	this.maxContourAmplitude = maxContourAmplitude;
	
	// Initialize the height map array. The array will be
	// accessed using a [depth][width] scheme...
	this.heightMap = new Array(depth)
	
	for (var arrayWidthInit = 0; arrayWidthInit < depth; arrayWidthInit++) {
		this.heightMap[arrayWidthInit] = new Array(width);
	}

	// Create the contour generates that will be used to produce the contours
	// that will define the height map (the entire set of contours will be used
	// for each height map row).
	this.constituentContours = new Array(numAggregateContours);
	for (var contoursInit = 0; contoursInit < numAggregateContours; contoursInit++) {
		this.constituentContours[contoursInit] = new contourGenerator(maxContourAmplitude);
	}
}

/**
 * Returns the maximum specified contour amplitude
 * @return {number} Maximum constituent contour amplitude
 */
dynamicHeightMap.prototype.getMaxContourAmplitude = function() {
	return this.maxContourAmplitude;
}

/**
 * Aggregates the values at a particular length fraction for
 *  all constituent contours
 * @param {number} lengthFraction Parameterized length fraction value (closed
 *                                interval between 0.0 - 1.0)
 * @return {number} An aggregate amplitude value
 */
dynamicHeightMap.prototype.getAggregateValueFromContours = function(lengthFraction) {
	var aggregateValue = 0.0;
	
	// Aggregate the contour values (enhances the variations within the
	// heightmap if each contour contains unique defining parameters).
	for (var currentContourIndex = 0; currentContourIndex < this.constituentContours.length;
		currentContourIndex++) {
		
		aggregateValue += this.constituentContours[currentContourIndex].getValueOnContour(lengthFraction);
	}
	
	return aggregateValue;
}

/**
 * Alters defining factors used by the amplitude modifier/modulation curves
 *  that are internally applied to the primary constituent contours - these
 *  modifications are stepwise and predictable, ensuring that progressively-
 *  changing heightmap rows can be generated.
 */
dynamicHeightMap.prototype.shiftContourAmplitudesSingleStep = function() {
	// Shift values used within the contour generator in order to
	// ensure that a different set of values will be generated
	// over the set of valid inputs (required in order to
	// generate a heightmap with variations between the heightmap
	// rows).
	for (var currentContourIndex = 0; currentContourIndex < this.constituentContours.length;
		currentContourIndex++) {
		
		this.constituentContours[currentContourIndex].shiftAmplitudeSingleStep();
	}
}

/**
 * Generates a single row within the height map
 * @param rowIndex {number} The index of the row within the heightmap that
 *                          should be generated
 */
dynamicHeightMap.prototype.generateHeightMapSingleRow = function(rowIndex) {
	// Generate a single row of values within the heightmap, using the
	// aggregate value provided by the contour generators.
	if ((rowIndex >= 0) && (rowIndex < this.heightMap.length)) {
		for (valueGenerationLoop = 0; valueGenerationLoop < this.heightMap[rowIndex].length;
			valueGenerationLoop++) {
	
			this.heightMap[rowIndex][valueGenerationLoop] =
				this.getAggregateValueFromContours(valueGenerationLoop / this.heightMap[rowIndex].length);
		}
	}
}

/**
 * Generates a portion of the height maps
 * @param startDepthFraction {number} Starting parameterized depth value (corresponds to a row)
 *                                    between the closed interval of 0.0 - 1.0
 * @param endDepthFraction {number} Ending parameterized depth value (corresponds to a row)
 *                                  between the closed interval of 0.0 - 1.0
 *
 */
dynamicHeightMap.prototype.generateHeightMap = function(startDepthFraction, endDepthFraction) {
	if ((endDepthFraction > startDepthFraction) &&
		(startDepthFraction >= this.constMinPermissibleDepthFraction) &&
		(endDepthFraction >= this.constMaxPermissibleDepthFraction)) {
		
		// Iterate through the rows of contour information (depth-wise), producing
		// discrete contour information data.
		if (this.heightMap.length > 0) {
			var startDepthIndex = Math.round(startDepthFraction * (this.heightMap.length - 1));
			var endDepthIndex = Math.round(endDepthFraction * (this.heightMap.length - 1));
			for (var currentDepthIndex = startDepthIndex;
				currentDepthIndex <= endDepthIndex; currentDepthIndex++) {
				
				this.generateHeightMapSingleRow(currentDepthIndex);
				
				// Shift the amplitude of the contour generators in order to
				// ensure that the next row of within the height map does not contain
				// identical values to the curretn row.
				this.shiftContourAmplitudesSingleStep();
			}
		}
	}
}

/**
 * Invokes a callback routine to perform an operation on a specified number
 *  of rows within the height map
 * @param startIndex {number} Starting index within the height map
 * @param rowCount {number} Number of rows to process (can circularly traverse through rows, starting
 *                          again at the beginning of the height map, depending on the starting value
 * @param processorObject {Object} Object that will process a height map row - the object must have a
 *                                 method with the prototype :
                                   processHeightMapRow(<current row (Array of number values)>,
								      <row index (number)>,
								      <total number of rows (number)>,
								      <max heightmap amplitude (number)>,
								      <processor object data (Object)>)
 * @param processorObjectData {Object} Data that is specific to the processor object, as necessary
 */
dynamicHeightMap.prototype.processHeightMap = function(startIndex, rowCount, processorObject, processorObjectData) {
	// Starting index can be greater than the array boundaries, as the modulus of the
	// starting index will be used to permit processing to progress continuously
	// within the height map.
	if (validateVar(processorObject) && (rowCount > 0) && (startIndex >= 0)) {
		// Iterate through the collection of rows, executing the 
		// processHeightMapRow(<current row>, <row index>, <total number of rows>, <max heightmap amplitude>, <processor object data>)
		// method that is expected to be present on the processor object.
		// The iteration can wrap beyond the end of the height map array, starting at
		// the initial height map row.
		for (var rowLoop = (rowCount - 1); rowLoop >= 0; rowLoop--) {
			var currentHeightMapRow = (startIndex + rowLoop) % this.heightMap.length;
			processorObject.processHeightMapRow(this.heightMap[currentHeightMapRow],
				rowLoop, this.heightMap.length, this.getMaxContourAmplitude(), processorObjectData);
		}
	}
}