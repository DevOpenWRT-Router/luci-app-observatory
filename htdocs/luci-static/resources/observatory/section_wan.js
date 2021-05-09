/* Publicly visible WAN status
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
var REQ_TIMEOUT = 3000;
var REFRESH_INTERVALS = [3, 5, 10, 15];
OBSERVATORY.WAN = new (function () {
	var _wan = this;
	var _truncateNumber = Math.trunc || function (num) {
		var sign = Math.sign(num);
		return Math.floor(num * sign) * sign;
	};
	var _wanTable;
	var _refreshIntervalButtons = REFRESH_INTERVALS;
	var _schedule;
	var _tags = OBSERVATORY._common.js.dom.tags;
	var _showFuzzy, _showFuzzyRegexp = /(?:^|\s+)(show|hide)-fuzzy(?:\s+|$)/;
	function _updateShowFuzzy() {
		var foundFuzzy = _wanTable.getAttribute("class").match(_showFuzzyRegexp);
		_showFuzzy = foundFuzzy && ("show" == foundFuzzy[1]);
	}
	var _showPacket, _showPacketRegexp = /(?:^|\s+)(show|hide)-packet(?:\s+|$)/;
	function _updateShowPacket() {
		var foundPacket = _wanTable.getAttribute("class").match(_showPacketRegexp);
		_showPacket = !foundPacket || ("show" == foundPacket[1]);
	}
	var _dozeRegexp = /(?:^|\s+)doze(?:\s+|$)/;
	function _enableDoze(enable) {
		OBSERVATORY._common.js.dom.styles.toggleClass(_wanTable, "no-doze", null, false);
		OBSERVATORY._common.js.dom.styles.toggleClass(_wanTable, "doze", null, enable);
		_updateDoze();
	}
	function _disableDoze() {
		OBSERVATORY._common.js.dom.styles.toggleClass(_wanTable, "no-doze", null, true);
		OBSERVATORY._common.js.dom.styles.toggleClass(_wanTable, "doze", null, false);
		_updateDoze();
	}
	function _updateDoze() {
		var foundDoze = _wanTable.getAttribute("class").match(_dozeRegexp);
		(foundDoze ? _setupDoze : _teardownDoze)();
	}
	var _dozeAt, _dozeFn, _successRegexp = /(?:^|\s+)success(?:\s+|$)/;
	function _setupDoze() {
		var curRefreshInterval = (function findCurrentRefreshInterval() {
				for (var b = 0; b < _refreshIntervalButtons.length; ++b) {
					var btn = _refreshIntervalButtons[b];
					if ("string" == typeof(btn.className) && btn.className.match(_successRegexp)) {
						return parseInt(OBSERVATORY._common.js.dom.data.get(btn, "interval"));
					}
				}
			})();
		var nextRefreshFn = (0 < curRefreshInterval) && (function findNextRefreshFn() {
				var nextRefreshInterval, nextRefreshFn;
				for (var b = 0; b < _refreshIntervalButtons.length; ++b) {
					var btn = _refreshIntervalButtons[b];
					if ("string" == typeof(btn.className)) {
						var btnRefreshInterval = parseInt(OBSERVATORY._common.js.dom.data.get(btn, "interval"));
						if (btnRefreshInterval > curRefreshInterval && (isNaN(nextRefreshInterval) ||
								btnRefreshInterval < nextRefreshInterval)) {
							nextRefreshInterval = btnRefreshInterval;
							nextRefreshFn = btn.onclick;
						}
					}
				}
				return nextRefreshFn;
			})();
		if (nextRefreshFn) {
			_dozeAt = Date.now() + 30 * 60 * 1000;
			_dozeFn = function () {
				_enableDoze(false);
				nextRefreshFn();
			};
		} else {
			_disableDoze();
		}
	}
	function _teardownDoze() {
		_dozeAt = Number.NaN;
		_dozeFn = null;
	}
	this.setupDisplay = function () {
		var ed = _tags.editor;
		var textUpdateEls = [];
		var titleUpdateEls = [];
		function editorDeferredText(textConst, fallbackValue) {
			return function (el) {
					textUpdateEls.push({ el: el, textConst: textConst, fallbackValue: fallbackValue });
				};
		}
		function editorDeferredTitle(titleConst, fallbackValue) {
			return function (el) {
					titleUpdateEls.push({ el: el, titleConst: titleConst, fallbackValue: fallbackValue });
				};
		}
		function toggleRefreshIntervalButtons(targetEl) {
			var toggleClass = OBSERVATORY._common.js.dom.styles.toggleClass;
			_refreshIntervalButtons.forEach(function (elLoop) {
					toggleClass(elLoop, "success", null, elLoop === targetEl);
				});
		}
		function editorManualRefreshButton(el) {
			_refreshIntervalButtons.unshift(el);
			el.onclick = function () {
				_schedule.setPause(true);
				toggleRefreshIntervalButtons(el);
				_disableDoze();
				_schedule.execNow(function (activeReqStartTime) {
						return Date.now() - activeReqStartTime > REQ_TIMEOUT;
					});
			};
		}
		function editorCreateRefreshButtons(el) {
			for (var r = 0; r < _refreshIntervalButtons.length; ++r) {
				var rInterval = _refreshIntervalButtons[r];
				if (!isNaN(rInterval)) {
					var tagClass = "label clickable refresh-interval" +
							// match initial display to scheduler default (5s)
							(5 == rInterval && " success" || "");
					el.appendChild(_tags.create("span",
						ed.attr("className", tagClass),
						editorDeferredText("WAN_REFRESH_" + rInterval + "S", rInterval + "s"),
						function (el) {
							OBSERVATORY._common.js.dom.data.set(el, "interval", rInterval);
							_refreshIntervalButtons[r] = el;
							var scheduleInterval = rInterval * 1000;
							el.onclick = function () {
								_schedule.setPause(false);
								_schedule.setInterval(scheduleInterval);
								toggleRefreshIntervalButtons(el);
								_teardownDoze();
								_enableDoze(true);
							};
						}));
				}
			}
		}
		OBSERVATORY._common.addSection().appendChild(_wanTable = _tags.create("table",
			ed.attr("className", "table wan"),
			ed.create("colgroup",
				ed.attr("className", "cg-interface")),
			ed.create("colgroup",
				ed.attr("className", "cg-outbound"),
				ed.create("col",
					ed.attr("className", "col-packet")),
				ed.create("col",
					ed.attr("className", "col-byte"))),
			ed.create("colgroup",
				ed.attr("className", "cg-inbound"),
				ed.create("col",
					ed.attr("className", "col-packet")),
				ed.create("col",
					ed.attr("className", "col-byte"))),
			ed.create("colgroup",
				ed.attr("className", "cg-datatype")),
			ed.create("thead",
				ed.create("tr",
					ed.attr("className", "tr"),
					ed.create("th",
						ed.attr("className", "th"), ed.attr("colSpan", 6), ed.attr("scope", "col"),
						ed.create("span",
							editorDeferredText("WAN_LINK"),
							editorDeferredTitle("WAN_LINK_EX", "Shows basic statistics of interfaces over which packets could be sent by default")),
						ed.create("div",
							ed.attr("className", "pull-right"),
							ed.create("span",
								editorDeferredText("WAN_REFRESH_GROUP", "Refresh:")),
							ed.create("span",
								ed.attr("className", "label clickable refresh-interval"),
								editorDeferredText("WAN_REFRESH_MANUAL", "Manual"),
								editorDeferredTitle("WAN_REFRESH_MANUAL_EX", "When Auto Refresh is ON, click to manually update data once"),
								editorManualRefreshButton),
							editorCreateRefreshButtons,
							ed.create("span",
								ed.attr("className", "label clickable doze"),
								editorDeferredText("WAN_REFRESH_DOZE", "Doze off"),
								editorDeferredTitle("WAN_REFRESH_DOZE_EX", "Lengthen refresh interval after 30 minutes to lighten up server load when left unattended"),
								function (el) {
									el.onclick = function () {
										_enableDoze(undefined);
									};
								}),
							ed.text(" "),
							ed.create("span",
								editorDeferredText("WAN_VISIBILITY_GROUP", "Show:")),
							ed.create("span",
								ed.attr("className", "label clickable packet"),
								editorDeferredText("WAN_SHOW_PACKET", "Packet"),
								editorDeferredTitle("WAN_SHOW_PACKET_EX", "Show or hide packet count"),
								function (el) {
									el.onclick = function () {
										OBSERVATORY._common.js.dom.styles.toggleClass(_wanTable, "hide-packet", "show-packet");
										_updateShowPacket();
									};
								}),
							ed.create("span",
								ed.attr("className", "label clickable fuzzy"),
								editorDeferredText("WAN_FUZZY", "Fuzzy Range"),
								editorDeferredTitle("WAN_SHOW_FUZZY_EX", "Show or hide possible rate range the actual rate could be; caused by time resolution = 1s"),
								function (el) {
									el.onclick = function () {
										OBSERVATORY._common.js.dom.styles.toggleClass(_wanTable, "show-fuzzy", "hide-fuzzy");
										_updateShowFuzzy();
									};
								})))),
				ed.create("tr",
					ed.attr("className", "tr"),
					ed.create("th",
						ed.attr("className", "th"), ed.attr("rowSpan", 2), ed.attr("scope", "col"),
						editorDeferredText("WAN_INTERFACE", "Interface")),
					ed.create("th",
						ed.attr("className", "th"), ed.attr("colSpan", 2), ed.attr("scope", "col"),
						editorDeferredText("WAN_UP", "Up (Tx)"),
						editorDeferredTitle("WAN_UP_EX", "Data leaving out from this device")),
					ed.create("th",
						ed.attr("className", "th"), ed.attr("colSpan", 2), ed.attr("scope", "col"),
						editorDeferredText("WAN_DOWN", "Down (Rx)"),
						editorDeferredTitle("WAN_DOWN_EX", "Data coming into this device")),
					ed.create("th",
						ed.attr("className", "th"), ed.attr("scope", "row"),
						editorDeferredText("WAN_DIRECTION", "Data Direction"),
						editorDeferredTitle("WAN_DIRECTION_EX"))
				),
				ed.create("tr",
					ed.attr("className", "tr"),
					ed.create("th",
						ed.attr("className", "th col-packet"), ed.attr("scope", "col"),
						editorDeferredText("WAN_PACKET", "Packets")),
					ed.create("th",
						ed.attr("className", "th col-byte"), ed.attr("scope", "col"),
						editorDeferredText("WAN_BYTE", "Bytes")),
					ed.create("th",
						ed.attr("className", "th col-packet"), ed.attr("scope", "col"),
						editorDeferredText("WAN_PACKET", "Packets")),
					ed.create("th",
						ed.attr("className", "th col-byte"), ed.attr("scope", "col"),
						editorDeferredText("WAN_BYTE", "Bytes")),
					ed.create("th",
						ed.attr("className", "th"), ed.attr("scope", "row"),
						editorDeferredText("WAN_UNIT", "Unit"),
						editorDeferredTitle("WAN_UNIT_EX"))
				))));
		OBSERVATORY._common.onConfigSetup(function () {
				for (var e = 0, updateEl = textUpdateEls[0]; e < textUpdateEls.length; updateEl = textUpdateEls[++e]) {
					updateEl.el.appendChild(document.createTextNode(
						OBSERVATORY._config.i18n[updateEl.textConst] || updateEl.fallbackValue || "?"));
				};
				for (var e = 0, updateEl = titleUpdateEls[0]; e < titleUpdateEls.length; updateEl = titleUpdateEls[++e]) {
					// EX = Extended text / Explanation
					var explanation = OBSERVATORY._config.i18n[updateEl.textConst] || updateEl.fallbackValue;
					if (explanation) { updateEl.el.title = explanation; }
				};
				textUpdateEls = null;	
			});
		_updateShowFuzzy();
		OBSERVATORY._common.js.dom.styles.toggleClass(_wanTable, "show-packet", "hide-packet", document.documentElement.clientWidth >= 640);
		_updateShowPacket();
		_enableDoze(true);
	};

// Interface update on UI //////////////////////////////////////////////////////

	var _interfaceUpdaters = {};
	function InterfaceUpdater() {
		var _updaters = [];
		var _dataRows = [];
		var _isLiveOnUI, _isLiveMark;
		function _asUpdaterEditor(updater) {
			return function (el) {
				_updaters.push(function (data) {
					updater(data, el);
				});
			};
		};
		this.getUpdaterEditor = _asUpdaterEditor;
		this.getReplacerEditor = function (retriever) {
			return _asUpdaterEditor(function (data, el) {
				while (el.firstChild) { el.removeChild(el.lastChild); }
				var newData = retriever(data);
				if (newData) {
					el.appendChild(newData instanceof Node ? newData : document.createTextNode(newData));
				}
			});
		};
		this.liveIndicatorEditor = function (el) {
			_dataRows.push(el);
		};
		this.reviseLiveIndicator = function () {
			_isLiveMark = false;
		};
		this.updateWith = function (data) {
			if (data.statistics) {
				_updaters.forEach(function (updater) {
						updater(data);
					});
				_isLiveMark = true;
			}
		};
		function updateLiveIndicatorOnRow(row) {
			OBSERVATORY._common.js.dom.styles.toggleClass(row, "live-indicator-active", "live-indicator-inactive", _isLiveMark);
		}
		this.finalizeLiveIndicator = function () {
			if (_isLiveMark !== _isLiveOnUI) {
				_dataRows.forEach(updateLiveIndicatorOnRow);
				_isLiveOnUI = _isLiveMark;
			}
		};
	}
	var _fnFormatByte, _fnFormatPacket;
	var _fnFormatPacketPerSec, _fnFormatByteAsKilobitPerSec, _fnFormatByteAsKilobitPerSecInt;
	var _fnFormatUpHigh, _fnFormatUpLow, _fnFormatUpSec;
	if (window.Intl && "function" == typeof(window.Intl.NumberFormat)) {
		var locale = undefined;
		var styleForUnit = "decimal";
		var _numFormatPacket = new Intl.NumberFormat(locale, {
			style: styleForUnit, unit: "packet", unitDisplay: "long",
			minimumFractionDigits: 0, maximumFractionDigits: 0,
			useGrouping: true
		});
		_fnFormatPacket = function (num) { return _numFormatPacket.format(num); };
		var _numFormatByte = new Intl.NumberFormat(locale, {
			style: styleForUnit, unit: "byte", unitDisplay: "narrow",
			minimumFractionDigits: 0, maximumFractionDigits: 0,
			useGrouping: true
		});
		_fnFormatByte = function (num) { return _numFormatByte.format(num); };
		var _numFormatPacketPerSec = new Intl.NumberFormat(locale, {
			style: styleForUnit, unit: "packet-per-sec", unitDisplay: "long",
			minimumFractionDigits: 2, maximumFractionDigits: 2,
			useGrouping: true
		});
		_fnFormatPacketPerSec = function (packets, time) {
			return _numFormatPacketPerSec.format(_truncateNumber(packets / time * 100) / 100);
		};
		var _numFormatKilobitPerSec = new Intl.NumberFormat(locale, {
			style: styleForUnit, unit: "kilobit-per-sec", unitDisplay: "narrow",
			minimumFractionDigits: 2, maximumFractionDigits: 2,
			useGrouping: true
		});
		_fnFormatByteAsKilobitPerSec = function (bytes, time) {
		 	return _numFormatKilobitPerSec.format(_truncateNumber(bytes / time * 8 / 1000 * 100) / 100);
		};
		var _numFormatKilobitPerSecInt = new Intl.NumberFormat(locale, {
			style: styleForUnit, unit: "kilobit-per-sec", unitDisplay: "narrow",
			minimumFractionDigits: 0, maximumFractionDigits: 0,
			useGrouping: true
		});
		_fnFormatByteAsKilobitPerSecInt = function (bytes, time, intConv) {
		 	return _numFormatKilobitPerSecInt.format(intConv(bytes / time * 8 / 1000));
		};

		var _numFormatUpHigh = new Intl.NumberFormat(locale, {
			style: "decimal",
			minimumFractionDigits: 0, maximumFractionDigits: 0,
			useGrouping: true
		});
		_fnFormatUpHigh = function (num) { return _numFormatUpHigh.format(num); };
		var _numFormatUpLow = new Intl.NumberFormat(locale, {
			style: "decimal",
			minimumFractionDigits: 2, maximumFractionDigits: 2,
			useGrouping: true
		});
		_fnFormatUpLow = function (num) { return _numFormatUpLow.format(num); };
		var _numFormatSecond = new Intl.NumberFormat(locale, {
			style: styleForUnit, unit: "second", unitDisplay: "narrow",
			minimumFractionDigits: 0, maximumFractionDigits: 0,
			useGrouping: true
		});
		_fnFormatUpSec = function (num) { return _numFormatSecond.format(num) + ("unit" == styleForUnit ? "" : "s"); };
	} else {
		// try to force the formatting, but only tries for numbers that look like en-US but different separators
		var decimalSeparator = (function () {
			var decStr = (1.23).toLocaleString();
			var match = /^1(.+)23$/.exec(decStr);
			return match ? match[1] : null;
		})();
		var toDecimalLocaleString, toIntLocaleString;
		if (decimalSeparator) {
			toDecimalLocaleString = (function () {
				var formatOpt = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
				var overOneStr = (1.10).toLocaleString(undefined, formatOpt);
				var trimRegexp;
				if ("1.10" != overOneStr) {
					if ("1" == overOneStr) {	// no fraction at all..
						return function (num) {
							return num.toString();	// don't bother with toLocaleString with no fraction
						};
					} else if ("1.10" == (overOneStr + "00").replace(trimRegexp = new RegExp("(" + OBSERVATORY._common.js.regexp.escape(decimalSeparator) + "\\d\\d)\\d*$"), "$1")) {
						return function (num) {	// not using minimumFractionDigits...  e.g. IceCat 38.6.0
							var formattedNum = num.toLocaleString(undefined, formatOpt);
							return (-1 < formattedNum.indexOf(decimalSeparator))
								? (formattedNum + "00").replace(trimRegexp, "$1")
								: (formattedNum + decimalSeparator + "00");
						};
					}
					// need to see what this could be
					// throw "Unexpected number format.";
				}
				return function (num) {
					return (_truncateNumber(num * 100) / 100).toLocaleString(undefined, formatOpt);
				};
			})();
			toIntLocaleString = (function () {
				var formatOpt = { minimumFractionDigits: 0, maximumFractionDigits: 0 };
				var oneStr = (1).toLocaleString(undefined, formatOpt);
				var trimRegexp;
				if ("1" != oneStr) {
					// if it's IE using 0.00 formatting no matter what...
					if ("1" == oneStr.replace(trimRegexp = new RegExp(OBSERVATORY._common.js.regexp.escape(decimalSeparator) + "00$"), "")) {
						return function (num) {
							return num.toLocaleString(undefined, formatOpt).replace(trimRegexp, "");
						};
					}
					// need to see what this could be
					// throw "Unexpected number format.";
				}
				return function (num) {
					return num.toLocaleString(undefined, formatOpt);
				};
			})();
		} else {
			toDecimalLocaleString = toIntLocaleString = function (num) {
				return num.toLocaleString();
			}
		}
		_fnFormatPacket = function (num) { return toIntLocaleString(num); };
		_fnFormatByte = function (num) { return toIntLocaleString(num); };
		_fnFormatPacketPerSec = function (packets, time) {
			return toDecimalLocaleString(packets / time);
		};
		_fnFormatByteAsKilobitPerSec = function (bytes, time) {
			return toDecimalLocaleString(bytes / time * 8 / 1000);
		};
		_fnFormatByteAsKilobitPerSecInt = function (bytes, time, intConv) {
			return toIntLocaleString(intConv(bytes / time * 8 / 1000));
		};
		_fnFormatUpHigh = function (num) { return toIntLocaleString(num); };
		_fnFormatUpLow = function (num) { return toDecimalLocaleString(num); };
		_fnFormatUpSec = function (num) { return toIntLocaleString(num) + "s"; };
	}
	function _formatUptime(up) {
		var lowerUp, nextUp;
		function bumpNumbers() {
			lowerUp = up;
			up = nextUp;
			return true;
		}
		function checkNotUseNextUnit(nextHigherUnit) {
			return (nextUp = up / nextHigherUnit) < 2;
		}
		function formatUnits(unitSuffix, toLowerUnit, lowerUnitSuffix) {
			var upInteger = _truncateNumber(up);
			var lowerRemain = lowerUp - (upInteger * toLowerUnit);
			return _fnFormatUpHigh(upInteger) + unitSuffix +
				" " + _fnFormatUpLow(lowerRemain) + lowerUnitSuffix;
		}
		return checkNotUseNextUnit(60) ? up + "s"
			: bumpNumbers() && checkNotUseNextUnit(60) ? formatUnits("m", 60, "s")
			: bumpNumbers() && checkNotUseNextUnit(24) ? formatUnits("h", 60, "m")
			: bumpNumbers() && formatUnits("d", 24, "h");
	}
	function _formatByteRange(changeBytes, changeTime) {
		return _fnFormatByteAsKilobitPerSecInt(changeBytes, changeTime + 1, Math.floor) + " - " +
			(changeTime <= 1 ? "?" : _fnFormatByteAsKilobitPerSecInt(changeBytes, changeTime - 1, Math.ceil));
	}
	var _dataRetrievers = {
		ifName: function(data, el) {
			var ed = _tags.editor;
			var toggleClass = OBSERVATORY._common.js.dom.styles.toggleClass;
			var ifSpans = el.getElementsByTagName("span");
			var namesToAdd = {};
			for (var n in data.up) {
				namesToAdd[n] = true;
			}
			for (var s = ifSpans.length - 1; s >= 0; --s) {
				var ifSpan = ifSpans[s];
				var ifName = ifSpan.innerText;
				toggleClass(ifSpan, "live-indicator-active", "live-indicator-inactive", ifName in data.up);
				delete namesToAdd[ifName];
			}
			var separator = ifSpans.length > 0 && ", ";
			for (var n in namesToAdd) {
				separator && el.appendChild(document.createTextNode(separator));
				el.appendChild(_tags.create("span",
					ed.attr("className", "live-indicator-active"),
					ed.text(n)));
				separator = ", ";
			}
		},
		upTotal: function (data) {
			var upMax, upMin;
			for (var n in data.up) {
				var up = data.up[n];
				if (null == upMax) {
					upMax = up;
				} else if (up == upMax) {
					// do nothing
				} else if (up > upMax) {
					if (null == upMin) {
						upMin = upMax;
					}
					upMax = up;
				} else if (null == upMin || up < upMin) {
					upMin = up;
				}
			}
			return null == upMax ? "X" :
				null == upMin ? _formatUptime(upMax) :
				_formatUptime(upMin) + " - " + _formatUptime(upMax);
		},
		txPktTotal: function (data) {
			return _showPacket && _fnFormatPacket(data.statistics.tx_packets);
		},
		txBytTotal: function (data) {
			return _fnFormatByte(data.statistics.tx_bytes);
		},
		rxPktTotal: function (data) {
			return _showPacket && _fnFormatPacket(data.statistics.rx_packets);
		},
		rxBytTotal: function (data) {
			return _fnFormatByte(data.statistics.rx_bytes);
		},
		upChange: function (data) {
			return data.change && _fnFormatUpSec(data.change.up || _uptimeChange);
		},
		txPktChange: function (data) {
			return _showPacket && data.change && _fnFormatPacket(data.change.tx_packets);
		},
		txBytChange: function (data) {
			return data.change && _fnFormatByte(data.change.tx_bytes);
		},
		rxPktChange: function (data) {
			return _showPacket && data.change && _fnFormatPacket(data.change.rx_packets);
		},
		rxBytChange: function (data) {
			return data.change && _fnFormatByte(data.change.rx_bytes);
		},
		txPktRate: function (data) {
			return _showPacket && data.change && _fnFormatPacketPerSec(data.change.tx_packets, data.change.up || _uptimeChange);
		},
		txBytRate: function (data) {
			return data.change && _fnFormatByteAsKilobitPerSec(data.change.tx_bytes, data.change.up || _uptimeChange);
		},
		rxPktRate: function (data) {
			return _showPacket && data.change && _fnFormatPacketPerSec(data.change.rx_packets, data.change.up || _uptimeChange);
		},
		rxBytRate: function (data) {
			return data.change && _fnFormatByteAsKilobitPerSec(data.change.rx_bytes, data.change.up || _uptimeChange);
		},
		txBytRange: function (data) {
			return _showFuzzy && data.change && _formatByteRange(data.change.tx_bytes, data.change.up || _uptimeChange);
		},
		rxBytRange: function (data) {
			return _showFuzzy && data.change && _formatByteRange(data.change.rx_bytes, data.change.up || _uptimeChange);
		}
	};
	function _createInterfaceSegment(updater) {
		var ed = _tags.editor;
		_wanTable.appendChild(_tags.create("tbody",
			updater.liveIndicatorEditor,
			ed.create("tr",
				ed.attr("className", "tr"),
				ed.create("td",
					ed.attr("className", "td"), ed.attr("rowSpan", 4),
					updater.getUpdaterEditor(_dataRetrievers.ifName)),
				ed.create("td",
					ed.attr("className", "td col-packet data-number"),
					updater.getReplacerEditor(_dataRetrievers.txPktTotal)),
				ed.create("td",
					ed.attr("className", "td col-byte data-number"),
					updater.getReplacerEditor(_dataRetrievers.txBytTotal)),
				ed.create("td",
					ed.attr("className", "td col-packet data-number"),
					updater.getReplacerEditor(_dataRetrievers.rxPktTotal)),
				ed.create("td",
					ed.attr("className", "td col-byte data-number"),
					updater.getReplacerEditor(_dataRetrievers.rxBytTotal)),
				ed.create("th",
					ed.attr("className", "th"), ed.attr("scope", "row"),
					ed.create("span",
						updater.getReplacerEditor(_dataRetrievers.upTotal)),
					ed.text(" "),
					ed.text(OBSERVATORY._config.i18n.WAN_TOTAL))),
			ed.create("tr",
				ed.attr("className", "tr"),
				ed.create("td",
					ed.attr("className", "td col-packet data-number"),
					updater.getReplacerEditor(_dataRetrievers.txPktChange)),
				ed.create("td",
					ed.attr("className", "td col-byte data-number"),
					updater.getReplacerEditor(_dataRetrievers.txBytChange)),
				ed.create("td",
					ed.attr("className", "td col-packet data-number"),
					updater.getReplacerEditor(_dataRetrievers.rxPktChange)),
				ed.create("td",
					ed.attr("className", "td col-byte data-number"),
					updater.getReplacerEditor(_dataRetrievers.rxBytChange)),
				ed.create("th",
					ed.attr("className", "th"), ed.attr("scope", "row"),
					ed.create("span",
						updater.getReplacerEditor(_dataRetrievers.upChange)),
					ed.text(" "),
					ed.text(OBSERVATORY._config.i18n.WAN_CHANGE))),
			ed.create("tr",
				ed.attr("className", "tr"),
				ed.create("td",
					ed.attr("className", "td col-packet data-number"),
					updater.getReplacerEditor(_dataRetrievers.txPktRate)),
				ed.create("td",
					ed.attr("className", "td col-byte data-number"),
					updater.getReplacerEditor(_dataRetrievers.txBytRate)),
				ed.create("td",
					ed.attr("className", "td col-packet data-number"),
					updater.getReplacerEditor(_dataRetrievers.rxPktRate)),
				ed.create("td",
					ed.attr("className", "td col-byte data-number"),
					updater.getReplacerEditor(_dataRetrievers.rxBytRate)),
				ed.create("th",
					ed.attr("className", "th"), ed.attr("scope", "row"),
					ed.text(OBSERVATORY._config.i18n.WAN_RATE),
					ed.text(" (kbit/s)"))),
			ed.create("tr",
				ed.attr("className", "tr fuzzy"),
				ed.create("td",
					ed.attr("className", "td data-number"), ed.attr("colSpan", 2),
					updater.getReplacerEditor(_dataRetrievers.txBytRange)),
				ed.create("td",
					ed.attr("className", "td data-number"), ed.attr("colSpan", 2),
					updater.getReplacerEditor(_dataRetrievers.rxBytRange)),
				ed.create("th",
					ed.attr("className", "th"), ed.attr("scope", "row"),
					ed.text(OBSERVATORY._config.i18n.WAN_RANGE),
					ed.text(" (kbit/s)")))));
		return updater;
	}
	this.updateDisplay = function () {
		for (var i in _interfaceUpdaters) {
			_interfaceUpdaters[i].reviseLiveIndicator();
		}
		var updatedInterfaces = {};
		for (var i in _interfaceData) {
			if (!updatedInterfaces[i]) {
				var data = _interfaceData[i];
				var updater = _interfaceUpdaters[i];
				// use any one from up interfaces, but might not be available if they were all down previously
				for (var n in data.up) {
					updater = _interfaceUpdaters[n];
					if (updater) { break; }
				}
				if (!updater) {
					_createInterfaceSegment(updater = new InterfaceUpdater());
				}
				updater.updateWith(data);
				for (var n in data.up) {
					_interfaceUpdaters[n] = updater;
					updatedInterfaces[n] = true;
				}
			}
		}
		for (var i in _interfaceUpdaters) {
			_interfaceUpdaters[i].finalizeLiveIndicator();
		}
	};

// Update scheduling ///////////////////////////////////////////////////////////

	this.setupSchedule = function () {
		_schedule = RIDR.schedule.addRepeating(new RIDR.Requester(REQ_TIMEOUT),
			new RIDR.Request.Get(OBSERVATORY._config.dataURL.WAN, OBSERVATORY.WAN.updateFromXHR),
			5000, 0);
	};
	var _interfaceData = {};
	this.beginUpdateInterfaces = function () {
		for (var i in _interfaceData) {
			var baseStats = _interfaceData[i].statistics;
			if (baseStats) { baseStats.isOld = true; }
		}
	};
	function updateInterfaceStatChanges(data, baseData) {
		if (baseData.statistics) {
			var change = baseData.change || (baseData.change = {});
			(function (change) {
				for (var k in data.statistics) {
					change[k] = data.statistics[k] - baseData.statistics[k];
				}
			})(change);
		}
		if (baseData.up) {
			var correspondingInterfaces = 0, correspondingInterfaceUp = 0;
			for (var n in data.up) {
				var baseUp = baseData.up[n];
				if (baseUp) {
					++correspondingInterfaces;
					correspondingInterfaceUp += data.up[n] - baseUp;
				}
			}
			change.up = correspondingInterfaceUp / correspondingInterfaces;
		}
	}
	this.updateInterface = function (data) {
		var baseData;
		var interfaceChange = {};
		for (var n in data.up) {
			baseData = _interfaceData[n];
			if (baseData) { break; }
		}
		if (baseData) {
			updateInterfaceStatChanges(data, baseData);
		} else {
			baseData = { names: {} };
		}
		for (var n in data.up) {
			_interfaceData[n] = baseData;
		}
		baseData.up = data.up;
		baseData.statistics = data.statistics;
	};
	this.finalizeUpdateInterfaces = function () {
		for (var i in _interfaceData) {
			var baseData = _interfaceData[i];
			if (baseData.statistics && baseData.statistics.isOld) {
				baseData.up = null;
				baseData.statistics = null;
				baseData.change = null;
			}
		}
	};
	var _uptime, _uptimeChange;
	this.setUptime = function (up) {
		_uptimeChange = up - _uptime;
		_uptime = up;
	};
	this.updateFromXHR = function(xhr) {
		if ((200 == xhr.status) && ("application/json" == xhr.getResponseHeader("Content-Type"))) {
			try {
				var json = JSON.parse(xhr.responseText);
				_wan.beginUpdateInterfaces();
				json.forEach(function (interface) {
					if ("dev" == interface.type) {
						_wan.updateInterface(interface);
					} else if ("sys" == interface.type) {
						_wan.setUptime(interface.up);
					}
				});
				_wan.finalizeUpdateInterfaces();
			} catch (e) {};
			if (RIDR.schedule.isRunning()) {
				_wan.updateDisplay();
			}
			if (Date.now() >= _dozeAt) {
				_dozeFn();
			}
		}
	};

})();
OBSERVATORY._common.onConfigSetup(OBSERVATORY.WAN.setupSchedule);
OBSERVATORY.WAN.setupDisplay();

})();
/* @license-end */
