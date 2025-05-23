sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
  ],
  (Controller, ODataModel, JSONModel) => {
    "use strict";

    return Controller.extend("project3.controller.View1", {
      onInit() {
        var oModel = new ODataModel("/v2/northwind/northwind.svc/");
        this.getView().setModel(oModel, "Data");

        oModel.read("/Products", {
          success: function (oData) {
            var aProductData = oData.results;

            // 정렬 함수
            aProductData.sort(function (a, b) {
              return b.UnitsInStock - a.UnitsInStock; // 높은 값이 먼저 오도록 정렬
            });

            var aTop5 = aProductData.slice(0, 5);

            aTop5.forEach(function (Product) {
              Product.FullProductName =
                Product.ProductID + "." + Product.ProductName;
            });

            var oChartModel = new JSONModel({ products: aTop5 });
            this.getView().setModel(oChartModel, "ChartData");
          }.bind(this),
          error: function () {
            console.error("OData 데이터 로딩 실패");
          },
        });
      },
    });
  }
);
