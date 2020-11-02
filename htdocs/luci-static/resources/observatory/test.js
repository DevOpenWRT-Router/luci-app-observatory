(function () {
	(function testToggleClass() {
		var fn = OBSERVATORY._common.js.dom.styles.toggleClass;
		var testEl = document.createElement("span");
		function test(startClass, expectClass) {
			testEl.className = startClass;
			var toggleArgs = Array.prototype.slice.call(arguments, 1);
			toggleArgs[0] = testEl;
			fn.apply(null, toggleArgs);
			if (testEl.className != expectClass) { throw new Error(); }
		}
		test("", "a",
			"", "a");
		test("a", "",
			"", "a");
		test("", "a",
			"a");
		test("a", "",
			"a");
		// preferably toggled them all out but just one for now
		test("a a", "a",
			"a");
		// toggle first match out
		test("a b", "b b",
			"a", "b");
		// toggle first match out
		test("b a", "a a",
			"a", "b");
		test("a", "a",
			"a", "b", true);
		test("a", "b",
			"a", "b", false);
		test("b", "a",
			"a", "b", true);
		test("b", "b",
			"a", "b", false);
		test("", "a",
			"a", "b", true);
		test("", "b",
			"a", "b", false);
	})();

})();
