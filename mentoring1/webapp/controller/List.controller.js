sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("mentoring1.controller.List", {
        onInit() {
            const oViewModel = new JSONModel({
				currency: "KRW"
			});
			this.getView().setModel(oViewModel, "view");
        },

        onFilterProduct(oEvent) {
			// 필터 배열 생성
			const aFilter = [];
			const sQuery = oEvent.getParameter("query"); // 검색어 가져오기
			if (sQuery) {
				aFilter.push(new Filter("name", FilterOperator.Contains, sQuery));
			}

			// 리스트 바인딩 필터 적용
			const oList = this.byId("List20"); // 리스트 찾기
			const oBinding = oList.getBinding("items"); // 바인딩된 데이터 가져오기
			oBinding.filter(aFilter); // 필터 적용
        }
    });
});