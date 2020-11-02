/* XMLHttpRequest helper influenced by xhr.js on OpenWRT 18.
 * API is NOT compatible with that of xhr.js.  For use outside LuCI.
 * Copycenter 2020 Serena's Copycat
 * // @license magnet:?xt=urn:btih:90dc5c0be029de84e523b9b3922520e79e0e6f08&dn=cc0.txt CC0-1.0
 * License: CC0
 * To the extent possible under law, the author has dedicated all copyright
 * and related and neighboring rights to this software to the public domain
 * worldwide.  This software is distributed without any warranty and
 * is published from: United States.
 * See <http://creativecommons.org/publicdomain/zero/1.0/>.
 * Feel free to mangle in any way, including hiding malicious instructions
 * and removing information related to license and/or author, but then
 * don't expect people to blame the author for undesired behavior though.
 * Note that no warranties of any kind are made regardless,
 * but you have the right to blame the author. XP
 */
// indirect/in-page data retriever, since it doesn't have to involve XML or HTTP,
// just something that the page can retrieve and use without changing page.
// A recursive acronym just for fun and make it sound like something
// that a page might retrieve (rider/amendment).
// Whether you like it as RIDR Indirect Data Retriever or Retrieve Indirect Data: RIDR
RIDR = new (function () {
	// https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie
	var _isIE = window.navigator.userAgent.match(/\b(?:MSIE|Trident)\b/);
	this.Requester = function (timeout) {
		var _xhr, _req, _reqStartTime;
		if (window.XMLHttpRequest) {
			_xhr = new window.XMLHttpRequest();
		} else if (window.ActiveXObject) {
			_xhr = new window.ActiveXObject("Microsoft.XMLHTTP");
		} else {
			throw "ridr.js: No XMLHttpRequest available."
		}
		// IE only allows setting timeout after open and before send
		// They throw errors when setting timeout here:
		//   IE8 throws "Unspecified error."
		//   IE11 throws InvalidStateError
		// MDN mentions it in the description
		var setTimeoutAfterOpen;
		function setTimeout() {
			_xhr.timeout = timeout;
		}
		if (_isIE) {
			setTimeoutAfterOpen = function () {
				// readyState 1 = OPENED
				(1 == _xhr.readyState) && setTimeout();
			};
		} else {
			setTimeoutAfterOpen = function () {};
			setTimeout();
		}
		function _ignoreReadyState() {};
		function _waitForReadyStateDone() {
			if (null != _req && 4 == _xhr.readyState) {
				_req.callback(_xhr, Date.now() - _reqStartTime);
				_req = null;
			}
		};
		_xhr.onreadystatechange = _ignoreReadyState;
		function _isReadyStateProcessing() {
			switch (_xhr.readyState) {
				case 1:
				case 2:
				case 3:
					return true;
				default:
					return false;
			}
		};
		this.isActive = function () {
			return null != _req && _isReadyStateProcessing();
		};
		this.reset = function () {
			_xhr.abort();
			_req = null;
			_reqStartTime = Number.NaN;
		};
		this.getStartTime = function () { return _reqStartTime; };
		this.execRequest = function (req) {
			if (this.isActive()) {
				throw "ridr.js: Already processing a request.";
			} else {
				(_req = req).openOn(_xhr);
				setTimeoutAfterOpen();
				_reqStartTime = Date.now();
				_xhr.onreadystatechange = _waitForReadyStateDone;
				req.sendOn(_xhr);
			}
		};
	};
	this.Request = new function () {
		this.Get = function (url, callback) {
			this.callback = callback;
			this.openOn = function (xhr) {
				var targetURL = "function" == typeof(url) ? url() : url;
				xhr.open('GET', targetURL, true);
			};
			this.sendOn = function (xhr) {
				xhr.send(null);
			};
		};
		this.Post = function (url, formData, callback) {
			this.callback = callback;
			this.openOn = function (xhr) {
				var targetURL = "function" == typeof(url) ? url() : url;
				xhr.open('POST', targetURL, true);
			};
			this.sendOn = function (xhr) {
				xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
				xhr.send(formData);
			};
		};
	};
	this.schedule = new (function () {
		var _requests = [];
		function execRequest(req, cancelActive) {
			if (cancelActive && req.requester.isActive() && ("function" != typeof(cancelActive) ||
					cancelActive(req.requester.getStartTime()))) {
				req.requester.reset();
			}
			req.requester.execRequest(req.request);
		}
		// actually, can add non-repeating by setting interval = 0
		// intervals less than 1000 (1 sec) will not be processed within 1 second
		// unless the interval timer is set to a lower delay
		this.addRepeating = function (requester, request, interval, delay) {
			var req = {
				requester: requester,
				request: request,
				interval: interval,
				delayTo: (delay > 0 ? delay : 0) + Date.now()
			};
			_requests.push(req);
			return {
				execNow: function (cancelActive) {
					execRequest(req, cancelActive);
				},
				setInterval: function (interval) {
					var now = Date.now();
					// readjust the schedule so change happens as if it was done at the previous scheduled time
					// that way it feels "immediate" and don't have to wait out the old schedule
					// very pronounced with 60s to 5s change, or 45s to 60s when it's already 40s in
					req.delayTo += interval - req.interval;
					// watch out for next new schedule being clumped up
					// original exec at t=0, interval is 15s, waited 9s, change to 5s: adjusts by -10s
					// meaning already 4s past (supposed to be at t=5s), executing immediately;
					// new time will be calculated based on the past time (next one after t=5s is t=10s),
					// so it'll schedule again in next second
					if (req.delayTo < now && now < req.delayTo + interval) { req.delayTo = now; }
					req.interval = interval;
				},
				setPause: function (pause) {
					if (undefined == pause || null == pause) {
						delete req.pause;
					} else {
						req.pause = !!pause;
					}
				},
				remove: function () {
					_requests.remove(req);
				}
			};
		};
		function _execScheduled() {
			var now = Date.now();
			var empties = 0;
			for (var r = 0; r < _requests.length; ++r) {
				var req = _requests[r];
				if ("object" != typeof(req)) {
					++empties;
				} else if (req.pause || req.delayTo > now) {
					continue;
				} else {
					if (req.interval > 0) {
						var nextDelayTo = req.delayTo + req.interval;
						req.delayTo = nextDelayTo > now ? nextDelayTo : (now + req.interval);
					} else {
						_requests[r] = null;
					}
					// only try to cancel those that were started by this scheduling
					execRequest(req, req.requester.getStartTime() == req.lastScheduledStartTime);
					req.lastScheduledStartTime = req.requester.getStartTime();
				}
			}
			if (empties > _requests.length / 4) {
				_requests = _requests.filter(function (item) { return "object" == typeof(item); });
			}
		};
		var _intervalHandle = null;
		this.isRunning = function () {
			return null != _intervalHandle;
		};
		this.toggleRun = function () {
			if (this.isRunning()) {
				window.clearInterval(_intervalHandle);
				_intervalHandle = null;
				if ("function" == typeof(this.onstop)) {
					try { this.onstop() } catch (e) {}
				}
			} else {
				if ("function" == typeof(this.onstart)) {
					try { this.onstart() } catch (e) {}
				}
				_intervalHandle = window.setInterval(_execScheduled, 1000);
				_execScheduled();
			}
		};
		this.start = function () {
			if (!this.isRunning()) { this.toggleRun(); }
		};
		this.stop = function () {
			if (this.isRunning()) { this.toggleRun(); }
		};
	});	
})();
/* @license-end */
