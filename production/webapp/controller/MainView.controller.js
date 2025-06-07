sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (Controller, ODataModel, JSONModel, MessageToast, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("sync.dc.pp.production.controller.MainView", {
      onInit() {
        const oView = this.getView();

        // OData 모델
        const oODataModel = new ODataModel("/sap/opu/odata/sap/ZDCPP_GW_003_SRV/");
        oView.setModel(oODataModel);

        // 사용자 입력값 모델
        const oDataModel = new JSONModel({
          PlantId: "",
          RouteId: "",
          MatId: ""
        });
        oView.setModel(oDataModel, "Data");

        // 플랜트/라인 모델
        const oPlantModel = new JSONModel();
        const oAllRouteModel = new JSONModel(); // 전체 PP080 저장용
        const oFilteredRouteModel = new JSONModel({ results: [] });

        oView.setModel(oPlantModel, "PlantList");
        oView.setModel(oFilteredRouteModel, "RouteList");

        // ✅ PP080 전체 데이터 미리 로딩
        oODataModel.read("/ZDCT_PP080Set", {
          success: function (oData) {
            const aAllData = oData.results;
            oAllRouteModel.setData({ results: aAllData });

            const uniquePlants = {};
            const aPlants = [];

            aAllData.forEach((item) => {
              if (!uniquePlants[item.PlantId]) {
                uniquePlants[item.PlantId] = true;
                aPlants.push({ PlantId: item.PlantId });
              }
            });

            oPlantModel.setData({ results: aPlants });
            oView.setModel(oAllRouteModel, "AllRouteRaw");
          },
          error: function () {
            MessageToast.show("초기 데이터 로딩 실패");
          }
        });

        const formatODataDate = (sODataDate) => {
          if (!sODataDate) return "";
          const timestamp = parseInt(sODataDate.match(/\d+/)[0], 10);
          const date = new Date(timestamp);
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };

        oODataModel.read("/ZDCT_FI040Set", {
          success: function (oData) {
            console.log("환율 데이터:", oData);
            if (oData.results.length === 0) {
              MessageToast.show("환율 정보가 없습니다.");
              return;
            }
            const formatODataDate = (oDate) => {
              if (!(oDate instanceof Date)) return "";
              const yyyy = oDate.getFullYear();
              const mm = String(oDate.getMonth() + 1).padStart(2, '0');
              const dd = String(oDate.getDate()).padStart(2, '0');
              return `${yyyy}-${mm}-${dd}`;
            };

            const jpyData = oData.results.find(item => item.BsCurrency === "JPY");
            const cnyData = oData.results.find(item => item.BsCurrency === "CNY");

            if (jpyData) {
              jpyData.ValfrDate = formatODataDate(jpyData.ValfrDate);
              oView.setModel(new JSONModel(jpyData), "FxJPY");
            }
            if (cnyData) {
              cnyData.ValfrDate = formatODataDate(cnyData.ValfrDate);
              oView.setModel(new JSONModel(cnyData), "FxCNY");
            }
          },
          error: function () {
            MessageToast.show("환율 정보 조회 실패");
          }
        });
      },

      onPlantChange: function (oEvent) {
        const oView = this.getView();
        const sSelectedPlant = oEvent.getSource().getSelectedKey();

        if (!sSelectedPlant) {
          MessageToast.show("플랜트를 선택해주세요.");
          return;
        }

        const oAllRouteModel = oView.getModel("AllRouteRaw");
        const aAllData = oAllRouteModel.getProperty("/results");

        const uniqueRoutes = {};
        const aFilteredRoutes = [];

        aAllData.forEach((item) => {
          if (item.PlantId === sSelectedPlant && !uniqueRoutes[item.RouteId]) {
            uniqueRoutes[item.RouteId] = true;
            aFilteredRoutes.push({ RouteId: item.RouteId });
          }
        });

        oView.getModel("RouteList").setData({ results: aFilteredRoutes });

        oView.byId("routeComboBox").setSelectedKey("");
        oView.getModel("Data").setProperty("/RouteId", "");
      },

      onSearch() {
        const oView = this.getView();
        const oModel = oView.getModel();

        const sMatId = oView.byId("matInput").getValue();
        const sPlantId = oView.byId("plantComboBox").getSelectedKey();
        const sRouteId = oView.byId("routeComboBox").getSelectedKey();

        const oDataModel = oView.getModel("Data");
        oDataModel.setProperty("/MatId", sMatId);
        oDataModel.setProperty("/PlantId", sPlantId);
        oDataModel.setProperty("/RouteId", sRouteId);

        const oCurrencyMap = {
          P100: "KRW",
          P101: "CNY"
        };
        const sTargetCurrency = oCurrencyMap[sPlantId];

        if (!sTargetCurrency) {
          MessageToast.show("해당 플랜트의 통화 설정이 없습니다.");
          return;
        }

        oModel.read("/ZDCSV_COSTSet", {
          filters: [new Filter("MatId", FilterOperator.EQ, sMatId)],
          success: function (oData) {
            const aFilteredResults = oData.results.filter(
              (item) => item.Currency === sTargetCurrency
            );

            if (aFilteredResults.length === 0) {
              MessageToast.show("조건에 맞는 단가 정보를 불러올 수 없습니다.");
              return;
            }

            const ogPrice = parseFloat(aFilteredResults[0].OgPrice || 0);
            oView.setModel(new JSONModel({ results: aFilteredResults }), "Price");

            oModel.read("/ZDCT_PP080Set", {
              success: function (oProdData) {
                const aFilteredProd = oProdData.results.filter(item =>
                  item.PlantId === sPlantId && item.RouteId === sRouteId
                );

                if (aFilteredProd.length === 0) {
                  MessageToast.show("생산비 정보를 불러올 수 없습니다.");
                  return;
                }

                const prodCost = parseFloat(aFilteredProd[0].Price || 0);
                const totalCost = ogPrice + prodCost;

                const oCalcModel = new JSONModel({
                  OgPriceFormatted: `${ogPrice.toLocaleString()} (${sTargetCurrency})`,
                  ProdCostFormatted: `${prodCost.toLocaleString()} (${sTargetCurrency})`,
                  TotalCostFormatted: `${totalCost.toLocaleString()} (${sTargetCurrency})`
                });

                oView.setModel(oCalcModel, "Calc");
              },
              error: function () {
                MessageToast.show("생산비 조회 실패");
              }
            });
          },
          error: function () {
            MessageToast.show("단가 조회 실패");
          }
        });
      }
    });
  }
);
