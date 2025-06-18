/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"syncd20/ws_cds_exam/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
