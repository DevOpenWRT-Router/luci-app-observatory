/* Publicly visible status - common page script
 * Copycenter 2020 Serena's Copycat
 * Additional code below with separate license (but still CC0) and attribution.
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
OBSERVATORY = new (function () {
	var observ_this = this;
	this._common = new (function () {
		var _elMap = {};
		function getElementByIdInCache(id) {
			var result = _elMap[id];
			if (!result) {
				_elMap[id] = result = document.getElementById(id);	
			}
			return result;
		}
		this.setPollStatusOn = function () {
			getElementByIdInCache('xhr_poll_status').style.display = '';
			getElementByIdInCache('xhr_poll_status_on').style.display = '';
			getElementByIdInCache('xhr_poll_status_off').style.display = 'none';
		};
		this.setPollStatusOff = function () {
			getElementByIdInCache('xhr_poll_status').style.display = '';
			getElementByIdInCache('xhr_poll_status_on').style.display = 'none';
			getElementByIdInCache('xhr_poll_status_off').style.display = '';
		};

		this.onConfigSetup = function (callback) {
			if (observ_this._config && observ_this._config.available) {
				callback();
			} else {
				(observ_this._config || (observ_this._config = [])).push(callback);
			}
		};
		this.onMenuSetup = function (callback) {
			if (observ_this._menu && !Array.isArray(observ_this._menu)) {
				callback();
			} else {
				(observ_this._menu || (observ_this._menu = [])).push(callback);
			}
		};

		var _appendSection = function (section) {
			_appendSection.sectionsToLoad.push(section);
			return section;
		};
		_appendSection.sectionsToLoad = [];
		this.loadSections = function () {
			var sectionsToLoad = _appendSection.sectionsToLoad;
			_appendSection = function (section) {
				getElementByIdInCache('sections').appendChild(section);
			};
			sectionsToLoad.forEach(function (section) {
				_appendSection(section);
			});
		};
		this.addSection = function () {
			return _appendSection(document.createElement('div'));
		};

		this.js = new (function () {
			var _thisJS = this;
			this.regexp = new Object();
			this.dom = new (function () {
				this.events = new (function () {
					var _on = this.on = function (target, eventName, handler) {
						var eventFn;
						if (target.addEventListener) {
							target.addEventListener(eventName, handler, false);
						} else if (target.attachEvent) {
							target.attachEvent("on" + eventName, handler);
						} else if ("function" == typeof(eventFn = target["on" + eventName]) && "function" == typeof(eventFn.add)) {
							eventFn.add(handler);
						} else {
							var chainFns = eventFn ? [ eventFn, handler ] : [ handler ];
							function chain() {
								for (var f = 0; f < chainFns.length; ++f) {
									chainFns[f]();
								}
							}
							chain.add = function (callback) {
								if ("function" == typeof(callback)) {
									chainFns.push(callback);
								}
							};
							target["on" + eventName] = chain;
						}
					};
					this.onLoad = function (handler) {
						_on(window, "load", handler);
					};
					this.onDOMLoad = function (handler) {
						if ("loading" == window.document.readyState) {
							_on(window.document, "DOMContentLoaded", handler);
						} else {
							handler();
						}
					};
				});
				this.styles = new (function () {
					var _spaceRegexp, _leadingSpaceRegexp, _trailingSpaceRegexp;
					var _trimRegexp, _trimString = String.prototype.trim ? function (str) {
							return str.trim();
						} : function (str) {
							return str.length == 0 ? str
								: str.match(_trimRegexp || (_trimRegexp = /^\s*(|\S|\S\S|\S.*\S)\s*$/))[1];
						};
					/* Toggles class label, without using a more-modern .classList
					 * @param element The element to update class on
					 * @param classLabel The individual class token to add/remove.
					 *   This function will blindly work with the "token",
					 *   even if it contains a space surrounded by actual tokens,
					 *   at which point incosistencies may occur.
					 *   Surrounding whitespace will be trimmed.
					 *   If neither <code>classLabel</code> nor <code>classLabelInverse</code> is found,
					 *   classLabel will be added on toggle.
					 * @param classLabelInverse The "opposite" individual class token to add/remove.
					 *   Must be different than <code>classLabel</code>.
					 * @param shouldMakeLabeled An optional Boolean changing the toggling behavior
					 *   to either set (true) or unset (false).
					 *   All other values will be ignored and default toggling will be done.
					 */
					this.toggleClass = function (element, classLabel, classLabelInverse, shouldMakeLabeled) {
						function canonicalizeLabel(label) {
							return (null == label) ? ""
								: ("string" != typeof(label)) ? _trimString(label.toString())
								: _trimString(label);
						}
						classLabel = canonicalizeLabel(classLabel);
						classLabelInverse = canonicalizeLabel(classLabelInverse);
						if (classLabel === classLabelInverse) {
							throw new Error("Cannot differentiate between labeled (" + classLabel + ") and not labeled (" + classLabelInverse + ")");
						}
						var oldClass = element.getAttribute("class") || "";
						var isLabelFound = false, isLabelInverseFound = false;
						oldClass = oldClass.replace(new RegExp("(^|\\s+)(" +
							(("" == classLabel) ? _thisJS.regexp.escape(classLabelInverse)
								: ("" == classLabelInverse) ? _thisJS.regexp.escape(classLabel)
								: _thisJS.regexp.escape(classLabel) + "|" +
									_thisJS.regexp.escape(classLabelInverse)) +
							")(\\s+|$)"), function (matchedVal) {
								var trimmedMatch = _trimString(matchedVal);
								isLabelFound = (trimmedMatch === classLabel);
								isLabelInverseFound = (trimmedMatch === classLabelInverse);
								var firstSpace;
								return null != (firstSpace = matchedVal.match(_leadingSpaceRegexp || (_leadingSpaceRegexp = /^\s/))) &&
									(matchedVal.charAt(matchedVal.length - 1).match(_spaceRegexp || (_spaceRegexp = /\s/)) ||
										matchedVal.match(_trailingSpaceRegexp || (_trailingSpaceRegexp = /\s$/))) &&
									firstSpace[0] || "";
							});
						if (isLabelFound != isLabelInverseFound) {
							// found a label; don't do anything special
						} else if (isLabelFound) {	// implies isLabelInverseFound
							// how'd that happen after only replacing once?
							throw new Error("Unexpected state");
						} else if ("" == classLabel) {	// both not found at this point
							// can't look for blank labels, but if the inverse isn't found, pretend the blank label was found instead
							isLabelFound = true;
						} else if ("" == classLabelInverse) {
							// the other way around
							isLabelInverseFound = true;
						} else {
							// force a label in when neither labels found
							isLabelFound = !shouldMakeLabeled;
						}
						if (shouldMakeLabeled !== isLabelFound) {
							// if neither label found, fall back to tagging on the non-inverse label
							var newLabel = isLabelFound ? classLabelInverse : classLabel;
							element.setAttribute("class", "" == newLabel ? oldClass
								: "" == oldClass ? newLabel
								: oldClass + " " + newLabel);
						}
					};
				})();
				this.tags = new (function () {
					var _thisHTMLTags = this;
					this.applyTo = function (editor, element) {
						if (element && "function" == typeof(editor)) {
							editor(element);
						}
						return element;
					};
					this.create = function (tagName, editor) {
						if (arguments.length > 2) {
							editor = _thisHTMLTags.editor.chain(Array.prototype.slice.call(arguments, 1));
						}
						return _thisHTMLTags.applyTo(editor, document.createElement(tagName));
					};
					this.editor = new (function () {
						this.chain = function () {
							var editors = (arguments.length == 1 && Array.isArray(arguments[0]) && arguments[0]) ||
								 Array.prototype.slice.call(arguments);
							return function (el) {
									editors.forEach(function (editor) {
										if ("function" == typeof(editor)) { editor(el); }
									});
								};
						};
						this.attr = function (name, value) {
							return function (el) {
								el[name] = value;
							};
						};
						this.child = function (subEl) {
							return function (el) {
								el.appendChild(subEl);
							};
						};
						this.create = function (tagName, editor) {
							var createArgs = Array.prototype.slice.call(arguments);
							return function (el) {
								el.appendChild(_thisHTMLTags.create.apply(null, createArgs));
							};
						};
						this.text = function (text) {
							return function (el) {
								el.appendChild(document.createTextNode(text));
							};
						};
					});
				})();
				this.data = new (function () {
					function resolve(el) {
						if (el.dataset) {
							this.set = function (el, prop, value) {
								el.dataset[prop] = value;
							};
							this.get = function (el, prop) {
								return el.dataset[prop];
							};
						} else {
							this.set = function (el, prop, value) {
								el.setAttribute("data-" + prop, value);
							};
							this.get = function (el, prop) {
								return el.getAttribute("data-" + prop);
							};
						}
					};
					this.set = function (el, prop, value) {
						resolve.call(this, el);
						this.set.apply(this, arguments);
					};
					this.get = function (el, prop) {
						resolve.call(this, el);
						this.get.apply(this, arguments);
					};
				})();
			})();	// dom
		})();	// js
	})();	// common
})();
OBSERVATORY._common.js.dom.events.onLoad(function() {
		OBSERVATORY._common.loadSections();
		RIDR.schedule.onstart = OBSERVATORY._common.setPollStatusOn;
		RIDR.schedule.onstop = OBSERVATORY._common.setPollStatusOff;
		RIDR.schedule.start();
	});
function buildMenu() {
	var tags = OBSERVATORY._common.js.dom.tags;
	var menu = OBSERVATORY._menu;
	var path = [ menu.subroot, menu.name ];
	if ("/" != menu.subroot[0]) {
		path.unshift("");
	}
	var dropdownClassEditor = tags.editor.attr("className", "dropdown");
	var menuClassEditor = tags.editor.attr("className", "menu");
	function appendLevelChildren(el, childNodes) {
		for (var n = 0; n < childNodes.length; ++n) {
			var childNode = childNodes[n];
			var dropdownItemEditor = undefined, submenuLinkEditor = undefined, buildSubMenuEditor = undefined;
			if (childNode.nodes && childNode.nodes.length > 0) {
				dropdownItemEditor = dropdownClassEditor;
				submenuLinkEditor = menuClassEditor;
				buildSubMenuEditor = function (el) {
					buildLevel(el, childNode, "dropdown-menu");
				}
			}
			path.push(childNode.name);
			try {
				el.appendChild(tags.create("li",
					dropdownItemEditor,
					tags.editor.create("a",
						submenuLinkEditor,
						tags.editor.attr("href", childNode.current ? "#" : path.join("/")),
						tags.editor.text(childNode.title)),
					buildSubMenuEditor));
			} finally {
				path.pop();
			}
		}
	}
	function buildLevel(el, node, className) {
		el.appendChild(tags.create("ul",
			tags.editor.attr("className", className || "nav"),
			function (el) {
				appendLevelChildren(el, node.nodes);
			}));
	}
	buildLevel(document.getElementById("menu"), menu);
}
OBSERVATORY._common.onMenuSetup(function () {
		buildMenu.data = true;
		buildMenu.dom && buildMenu();
	});
OBSERVATORY._common.js.dom.events.onDOMLoad(function() {
		buildMenu.dom = true;
		buildMenu.data && buildMenu();
	});
/* @license-end */

/* Code from MDN by MDN contributors
 * // @license magnet:?xt=urn:btih:90dc5c0be029de84e523b9b3922520e79e0e6f08&dn=cc0.txt CC0-1.0
 * License: CC0
 * To the extent possible under law, the author has dedicated all copyright
 * and related and neighboring rights to this software to the public domain
 * worldwide.  This software is distributed without any warranty.
 * See <http://creativecommons.org/publicdomain/zero/1.0/>.
 */
	var _regexpMetas;
	OBSERVATORY._common.js.regexp.escape = function (string) {
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
		return string.replace(_regexpMetas || // defer RegExp object creation
			(_regexpMetas = /[.*+\-?^${}()|[\]\\]/g), '\\$&');	// $& means the whole matched string
	};
})();
/* @license-end */
