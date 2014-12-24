// ContourGenerator.js - Sinusoid-based 2D contour generator
// Author: Ayodeji Oshinnaiye

// Contour generator class - generates a contour in two dimensions
// (height and parameterization/length). A three-dimensional surface
// can be composited by iteratively invoking shiftAmplitudeSingleStep()
// between full-length contour invocations.
function contourGenerator(baseAmplitude) {
	this.baseAmplitude = baseAmplitude;
	
	this.curvePhaseShift = Math.PI * Math.random(); 
	
	// Maximum parametric value for the amplitude modifier.
	this.constMaxAmplitudeStepValue = 1.0;
	// Minimum parametric value for the amplitude modifier.
	this.constMinAmplitudeStepValue = 0.0;
	
	// The immediate value of the amplitude modifier.
	this.amplitudeModifier = 1.0;
	
	// The immediate parametric value that is used to compute the
	// amplitude modifier.
	this.currentAmplitudeStep = 0.0;
	
	// Maximum increment for the parametric value used to compute the
	// amplitude modifier.
	this.constMaxAmplitudeStepIncrement = 0.02;
	
	// Increment used to progressively modify the parametric value used to
	// compute the amplitude modifier.
	this.currentAmplitudeStepIncrement = Math.random() * this.constMaxAmplitudeStepIncrement;

	// Minimum increment for the parametric value used to compute the
	// amplitude modifier.
	this.constMinAmplitudeStepIncrement = 0.01;
	
	// Increment used to adjust the parametric value used to compute
	// the amplitude modifier.
	this.amplitudeStepIncrement =
		(this.constMaxAmplitudeStepIncrement - this.constMinAmplitudeStepIncrement) * Math.random() +
		this.constMinAmplitudeStepIncrement;
		
	// Maximum expected value for a length fraction (parametric value).
	this.constMaxLengthFractionValue = 1.0;
	
	var constMinCurveRangeDenominator = 0.5;
	var constCurveRangeDenominatorVariance = 0.5;
	var curveRangeDenominator = (constMinCurveRangeDenominator + Math.random() * constCurveRangeDenominatorVariance);
	
	// Expect range, in radians, of the sinusoidal contour.
	this.curveRange = Math.PI / curveRangeDenominator;
	
	var constMinAmplitudeCurveRangeDenominator = 1.0;
	var constAmplitudeCurveRangeDenominatorVariance = 7.0;

	// The amplitude modifier is modified during each curve shift increment - these
	// parameters determine the range of the amplitude modifier (a multiplier
	// that will be ultimately applied to the curve).
	var amplitudeModifierCurveRangeDenominator = constMinAmplitudeCurveRangeDenominator + (constAmplitudeCurveRangeDenominatorVariance * Math.random());
	this.amplitudeModifierCurveRangeRadians = Math.PI / amplitudeModifierCurveRangeDenominator;
	this.amplitudeModifierCurvePhaseShiftRadians = Math.PI * Math.random();
}

/**
 * Retrieves a point on the contour
 * @param {number} lengthFraction Parameterized length fraction value (closed
 *                                interval between 0.0 - 1.0)
 * @return {number} An amplitude value retrieved from the contour.
 */
contourGenerator.prototype.getValueOnContour = function(lengthFraction) {
	var generatedPoint = 0.0;

	generatedPoint = this.computePointOnCurve(this.baseAmplitude, this.curvePhaseShift, lengthFraction);

	return generatedPoint;
}

/**
 * Alters defining factors used by the amplitude modifier/modulation curve
 *  that is internally applied to the primary contour - these modifications
 *  are stepwise and predictable, based upon sinusoidal amplitude adjustments.
 */
contourGenerator.prototype.shiftAmplitudeSingleStep = function() {
	// Vary the amplitude of the amplitude modifier curve, in its entirety,
	// in a sinusoidal pattern - this amplitude modifier will be applied to any generated
	// point along the contour (permits variation between full
	// contours, facilitating three-dimensional contour
	// generation).
	this.currentAmplitudeStep = (this.currentAmplitudeStep + this.currentAmplitudeStepIncrement) %
		this.constMaxAmplitudeStepValue;

	this.amplitudeModifier = Math.cos(this.currentAmplitudeStep * Math.PI * 2.0);
}

/**
 * Computes a point on the contour, applying the provided base amplitude and
 *  phase shift (clients should not invoke this routine - clients should
 *  instead invoke getValueOnContour)
 * @param amplitude {number} Base amplitude to be applied to the contour
 * @param phaseShift {number} Phase shift to be applied to the curve
 * @param contourLengthFraction {number} Parameterized length fraction value
 *                                       (closed interval between 0.0 - 1.0)
 * @return {number} An amplitude valuer retrieved from the contour
 * @see contourGenerator.getValueOnContour
 */
contourGenerator.prototype.computePointOnCurve = function(amplitude, phaseShift, contourLengthFraction) {
	// Compute an amplitude modifier value that will apply a progressive change to the curve
	// amplitude over the curve length.
	var workingLengthFractionValue = Math.min(contourLengthFraction, this.constMaxLengthFractionValue);
	var amplitudeModifier = this.amplitudeModifier *
		Math.cos((workingLengthFractionValue * this.amplitudeModifierCurveRangeRadians) +
		this.amplitudeModifierCurvePhaseShiftRadians);
		
	// The contour is based on a sinusodial curve...
	return amplitudeModifier * amplitude * Math.sin(this.curveRange * workingLengthFractionValue + phaseShift);
}