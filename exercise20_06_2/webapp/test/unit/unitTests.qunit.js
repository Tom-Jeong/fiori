/* global QUnit */
// https://api.qunitjs.com/config/autostart/
QUnit.config.autostart = false;

sap.ui.require([
	"exercise20_06_2/test/unit/AllTests"
], function (Controller) {
	"use strict";
	QUnit.start();
});