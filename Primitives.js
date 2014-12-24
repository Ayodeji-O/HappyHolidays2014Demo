// Primitives.js - Defines basic coordinate/geometric primitives (coordinates are in screen
//                 coordinates, where the origin is located at the upper-left hand corner of
//                 the screen, with increasing Y coordinates progressing downwards)
// Author: Ayodeji Oshinnaiye
// Dependent upon:
//  -Utility.js

///////////////////////////////////////
// point object
///////////////////////////////////////

function point(xCoord, yCoord) {
	this.xCoord = xCoord;
	this.yCoord = yCoord;
}

/**
 * Retrieves the X coordinate of the point
 * @return The X coordinate of the point
 */
point.prototype.getX = function() {
	return this.xCoord;
}

/**
 * Retrieves the Y coordinate of the point
 * @return The Y coordinate of the point
 */
point.prototype.getY = function() {
	return this.yCoord;
}

/**
 * Computes the position of the point if it were to be rotated around
 *  another point, and returns the result as a copy of the
 *  represented point
 * @param rotationCenterPoint {point} Reference point that will be
 *                            used as the rotation center
 * @param degrees Degress of rotation, in radians
 * @return {point} The newly rotated point
 */
point.prototype.rotatePointCopy = function(rotationCenterPoint, degrees) {
	// Rotate the point around the center point, using
	// the two-dimensional rotation formula:
	// x' = (x - x.pivot) · cos(a) - (y - y.pivot) · sin(a) + x.pivot
	// y' = (y - y.pivot) · cos(a) + (x - x.pivot) · sin(a) + y.pivot
	var cosTheta = Math.cos(degrees);
	var sinTheta = Math.sin(degrees);
	
	var newX = 
		((this.xCoord - rotationCenterPoint.getX()) * cosTheta) -
		((this.yCoord - rotationCenterPoint.getY()) * sinTheta) + rotationCenterPoint.getX();
	var newY = 
		((this.yCoord - rotationCenterPoint.getY()) * cosTheta) +        
		((this.xCoord - rotationCenterPoint.getX()) * sinTheta) + rotationCenterPoint.getY();

	// Return the rotated point as a new point object, rather than modifying the
	// existing point object.
	return new point(newX, newY);
}


///////////////////////////////////////
// vector object
///////////////////////////////////////

function vector(xComponent, yComponent) {
	this.xComponent = xComponent;
	this.yComponent = yComponent;
}

vector.prototype.getXComponent = function() {
	return xComponent;
}

vector.prototype.getYComponent = function() {
	return yComponent;
}

vector.prototype.magnitude = function() {
	return Math.sqrt((this.xComponent * this.xComponent) +
		(this.yComponent * this.yComponent));
}

vector.prototype.dotProduct = function(secondVector) {
	// Vector dot product is computed using the following
	// equation (given two vectors, a and b):
	// a·b = a_x  x  b_x + a_y  x  b_y
	// Where a_x and b_x are the x-components for the first
	// and second vectors, respectively, and a_y and b_y are
	// the y-components for the first and second vectors, respectively.
	// Source: Math is Fun website, vectors section
	// http://www.mathsisfun.com/algebra/vectors.html
	return ((this.getXComponent() * secondVector.getXComponent()) +
		this.getYComponent() + secondVector.getYComponent());
}


///////////////////////////////////////
// rectangle object
///////////////////////////////////////

function rectangle(left, top, width, height) {
	this.left = returnValidNumOrZero(left);
	this.top = returnValidNumOrZero(top);
	this.width = Math.abs(returnValidNumOrZero(width));
	this.height = Math.abs(returnValidNumOrZero(height));
}

/**
 * Returns the width of the rectangle
 * @return The width of the rectangle
 */
rectangle.prototype.getWidth = function() {
	return this.width;
}

/**
 * Returns the height of the rectangle
 * @return The height of the rectangle
 */
rectangle.prototype.getHeight = function() {
	return this.height;
}

/**
 * Returns the top-left point of the rectangle
 * @return {point} The top-left point of the rectangle
 */
rectangle.prototype.getTopLeft = function() {
	return new point(this.left, this.top);
}

/**
 * Returns the center point of the rectangle
 * @return {point} The center point of the rectangle
 */
rectangle.prototype.getCenter = function() {
	return new point(this.left + (this.width / 2.0), this.top + (this.height / 2.0));
}

/**
 * Sets the top-left point of the rectangle
 * @param topLeftPoint {point} The point that will become
 *                      the top-left point of the rectangle
 */
rectangle.prototype.setTopLeft = function(topLeftPoint) {
	if (validateVar(topLeftPoint)) {
		this.left = topLeftPoint.getX();
		this.top = topLeftPoint.getY();
	}
}

/**
 * Displaces the rectangle by the specified amount
 * @param deltaX The amount along the X-coordinate by which
 *               the rectangle should be displaced
 * @param deltaY The amount along the Y-coordinate by which
 *               the rectangle should be displaced 
 */
rectangle.prototype.move = function(deltaX, deltaY) {
	this.left += returnValidNumOrZero(deltaX);
	this.top += returnValidNumOrZero(deltaY);
}