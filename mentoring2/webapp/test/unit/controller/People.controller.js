/*global QUnit*/

sap.ui.define([
	"mentoring2/controller/People.controller"
], function (Controller) {
	"use strict";

	QUnit.module("People Controller");

	QUnit.test("I should test the People controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
