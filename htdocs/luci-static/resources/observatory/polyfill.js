/* Polyfill functionality used by Observatory.
 * Content from MDN (by MDN contributors)
 * // @license magnet:?xt=urn:btih:90dc5c0be029de84e523b9b3922520e79e0e6f08&dn=cc0.txt CC0-1.0
 * License: CC0
 * To the extent possible under law, the author has dedicated all copyright
 * and related and neighboring rights to this software to the public domain
 * worldwide.  This software is distributed without any warranty.
 * See <http://creativecommons.org/publicdomain/zero/1.0/>.
 */
/* Note: LibreJS 6.0.10 doesn't think code is free even when marked so
 * when there are conditional constructs at the top level or
 * when there are multiple statements; burying them within function.
 */
(function () {
	// Math.sign @ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
	Math.sign || (Math.sign = function(x) {
		return (x > 0) - (x < 0) || +x;
	});
	// Date.now @ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
	Date.now || (Date.now = function () {
		return new Date().getTime();
	});
	// Array.isArray @ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
	Array.isArray || (Array.isArray = function (arg) {
		return Object.prototype.toString.call(arg) === '[object Array]';
	});
	// Adapted from Array.forEach @ https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
	Array.prototype.forEach || (Array.prototype.forEach = function (callback, thisArg) {
		if (null == this) { throw new TypeError('Array.prototype.forEach called on null or undefined'); }
		if ("function" !== typeof(callback)) { throw new TypeError(callback + ' is not a function'); }
		var O = Object(this);
		var len = O.length >>> 0;
		var T;
		if (arguments.length > 1) { T = thisArg; }
		for (var k = 0; k < len; ++k) {
			if (k in O) {
				callback.call(T, O[k], k, O);
			}
		}
	});
})();
/* @license-end */
