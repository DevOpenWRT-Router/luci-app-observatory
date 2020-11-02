/* Dark mode - switches CSS to display UI in darker colors
 * Copycenter 2020 Serena's Copycat
 * // @license magnet:?xt=urn:btih:90dc5c0be029de84e523b9b3922520e79e0e6f08&dn=cc0.txt CC0-1.0
 * License: CC0
 * To the extent possible under law, the author has dedicated all copyright
 * and related and neighboring rights to this software to the public domain
 * worldwide.  This software is distributed without any warranty and
 * is published from: United States.
 * See <http://creativecommons.org/publicdomain/zero/1.0/>.
 * Feel free to mangle in any way, including inserting malicious code
 * and removing information related to license and/or author,
 * but then don't expect people to blame the author for undesired behavior though.
 * Note that no warranties of any kind are made regardless,
 * but you have the right to blame the author. XP
 */
(function () {
	function isPreferLight() {
		// https://flaviocopes.com/javascript-detect-dark-mode
		return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
	}
	function appendDarkModeButton() {
		var targetContainer;
		if (!targetContainer) {
			var xhrButton = document.getElementById("xhr_poll_status");
			if (xhrButton) {
				targetContainer = xhrButton.parentNode;
			}
		}
		if (targetContainer) {
			var darkButton = document.createElement("span");
			darkButton.onclick = function (e) {
				switchDarkClass();
			};
			darkButton.style.cursor = "pointer";
			var darkOnLabel = document.createElement("span");
			darkOnLabel.className = "label sc-dark-mode sc-dark-mode-on";
			darkOnLabel.appendChild(document.createTextNode("\u263D Dark Mode: on"));
			darkButton.appendChild(darkOnLabel);
			var darkOffLabel = document.createElement("span");
			darkOffLabel.className = "label sc-dark-mode sc-dark-mode-off";
			darkOffLabel.appendChild(document.createTextNode("\u263D Dark Mode: off"));
			darkButton.appendChild(darkOffLabel);
			targetContainer.appendChild(darkButton);
		}
	}
	var _darkMarkerTag;
	function init() {
		_darkMarkerTag = document.body;
		if (_darkMarkerTag) {
			appendDarkModeButton();
			switchDarkClass(!isPreferLight());
		}
	}
	function switchDarkClass(shouldTargetDark) {
		var oldClass = _darkMarkerTag.getAttribute("class");
		var isDarkFound = false, isLightFound = false;
		oldClass = !oldClass ? "" : oldClass.replace(/(^|\s+)sc-colors-(dark|light)(\s+|$)/, function (matchedVal) {
				isDarkFound = (-1 < matchedVal.indexOf("sc-colors-dark"));
				isLightFound = (-1 < matchedVal.indexOf("sc-colors-light"));
				var firstSpace;
				return null != (firstSpace = matchedVal.match(/^\s/)) &&
					matchedVal.charAt(matchedVal.length - 1).match(/\s/) &&
					firstSpace[0] || "";
			});
		if (shouldTargetDark !== isDarkFound || shouldTargetDark === isLightFound) {
			_darkMarkerTag.setAttribute("class", oldClass +
				(isDarkFound ? " sc-colors-light" : " sc-colors-dark"));
		}
	};
	(function onLoad(callback) {
		if (window.addEventListener) {
			window.addEventListener("load", callback, false);
		} else if (window.attachEvent) {
			window.attachEvent("onload", callback);
		} else if ("function" == typeof(window.onload) && "function" == typeof(window.onload.add)) {
			window.onload.add(callback);
		} else {
			var chainFns = window.onload ? [ window.onload, callback ] : [ callback ];
			function chain() {
				for (var f = 0; f < chainFns.length; ++f) {
					chainFns[f]();
				};
			};
			chain.add = function (callback) {
				if ("function" == typeof(callback)) {
					chainFns.push(callback);
				}
			};
			window.onload = chain;
		}
	})(init);
})();
/* @license-end */
