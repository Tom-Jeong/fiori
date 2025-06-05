sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
  ],
  (Controller, ODataModel, JSONModel, MessageToast) => {
    "use strict";

    return Controller.extend("sync.dc.pp.production.controller.MainView", {
      onInit() {
 const oView = this.getView();

  // OData 모델 설정
  const oODataModel = new ODataModel("/sap/opu/odata/sap/ZDCPP_GW_003_SRV/");
  oView.setModel(oODataModel); // unnamed model

  // 선택값 모델 (플랜트/라인 선택용)
  const oDataModel = new JSONModel({ PlantId: "", RouteId: "", MatId: "" });
  oView.setModel(oDataModel, "Data");

  // 중복 제거된 플랜트 리스트
  const oPlantModel = new JSONModel();
  oView.setModel(oPlantModel, "PlantList");

  // 중복 제거된 라인 리스트
  const oRouteModel = new JSONModel();
  oView.setModel(oRouteModel, "RouteList");

  // OData 읽어서 중복 없는 플랜트/라인 리스트 추출
  oODataModel.read("/ZDCT_PP080Set", {
    success: (oData) => {
      const uniquePlants = {};
      const uniqueRoutes = {};
      const aPlants = [];
      const aRoutes = [];

      oData.results.forEach((item) => {
        if (!uniquePlants[item.PlantId]) {
          uniquePlants[item.PlantId] = true;
          aPlants.push({ PlantId: item.PlantId });
        }
        if (!uniqueRoutes[item.RouteId]) {
          uniqueRoutes[item.RouteId] = true;
          aRoutes.push({ RouteId: item.RouteId });
        }
      });

      oPlantModel.setData({ results: aPlants });
      oRouteModel.setData({ results: aRoutes });
    },
    error: () => {
      sap.m.MessageToast.show("플랜트/라인 정보를 불러오지 못했습니다.");
    },
  });
      },

      onSearch() {
    var oView = this.getView();
    var oModel = oView.getModel(); // ODataModel
    var sMatId = oView.byId("matInput").getValue();
    var sPlantId = oView.byId("plantComboBox").getValue();

    // 자재번호로 서버 필터
    var aFilters = [
        new sap.ui.model.Filter("MatId", sap.ui.model.FilterOperator.EQ, sMatId)
    ];

    // 플랜트에 따라 올바른 통화 지정
    var oCurrencyMap = {
        "P100": "KRW",
        "P101": "CNY"
    };
    var sTargetCurrency = oCurrencyMap[sPlantId]; // 해당 플랜트의 통화

    if (!sTargetCurrency) {
        MessageToast.show("해당 플랜트의 통화 설정이 없습니다.");
        return;
    }

    // OData read 실행
    oModel.read("/ZDCSV_COSTSet", {
        filters: aFilters,
        success: function (oData) {
            // 해당 통화만 필터링
            var aFilteredResults = oData.results.filter(function (item) {
                return item.Currency === sTargetCurrency;
            });

            var oJsonModel = new JSONModel({ results: aFilteredResults });
            oView.setModel(oJsonModel, "Data");
        },
        error: function () {
            MessageToast.show("조회 실패");
        }
    });
},

    });
  }
);
