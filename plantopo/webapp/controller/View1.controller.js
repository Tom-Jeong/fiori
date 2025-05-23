sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
  ],
  (Controller, ODataModel, JSONModel, MessageToast) => {
    "use strict";

    return Controller.extend("sync.dc.pp.plantopo.controller.View1", {
      onInit() {
        var oComboBox = this.byId("yearComboBox");

        // 현재 연도 및 범위 설정
        var currentYear = new Date().getFullYear();
        var startYear = currentYear - 5; // 20년 전부터 현재 연도까지

        // 연도 항목 동적으로 추가
        for (var year = startYear; year <= currentYear; year++) {
          oComboBox.addItem(
            new sap.ui.core.Item({
              key: year.toString(),
              text: year.toString(),
            })
          );
        }
        // 월 콤보박스에 1~12월 항목 추가
        var oMonthComboBox = this.byId("monthComboBox");
        for (var i = 1; i <= 12; i++) {
          oMonthComboBox.addItem(
            new sap.ui.core.Item({
              key: i.toString(),
              text: i + "월",
            })
          );
        }


        // OData 모델 생성 및 설정
        var oPlanModel = new ODataModel(
          "/sap/opu/odata/sap/ZDCPP_GW_001_SRV/"
        );
        
        // View에 모델 설정
        this.getView().setModel(oPlanModel, "Plan1");
        oPlanModel.read("/ZDCT_PP030Set", {
          success: function (oData) {
            var aResults = oData.results;
            
            aResults.forEach(function(item) {
              if(item.PoSDate && item.PoEDate) {
                var date = new Date(item.PoSDate);
                var year = date.getFullYear();
                var month = (date.getMonth() + 1)
                .toString()
                .padStart(2, "0");
                var day = date.getDate().toString().padStart(2, "0");
                var formatDate = year + "-" + month + "-" + day;
                item.PoSDate = formatDate;


                var date1 = new Date(item.PoEDate);
                var year1 = date1.getFullYear();
                var month1 = (date.getMonth() + 1)
                .toString()
                .padStart(2, "0");
                var day1 = date1.getDate().toString().padStart(2, "0");
                var formatDate1 = year1 + "-" + month1 + "-" + day1;
                item.PoEDate = formatDate1;
              }
            console.log(aResults);
            });
            var planOrderData = new JSONModel();
              planOrderData.setData({ planedOrder: aResults });
              this.getView().setModel(planOrderData, "Plan");
          }.bind(this),
          error: function (oError) {
            MessageToast.show("계획주문 데이터를 불러오지 못했습니다.");
            console.error(oError);
          },
        });

        var onSearch = this.byId("searchButton");
        onSearch.attachPress(function () {
          var selectedYear = oComboBox.getSelectedKey();
          var selectedMonth = oMonthComboBox.getSelectedKey();

          if (selectedYear && selectedMonth) {
				aFilter.push(new Filter("YearAndMonth", FilterOperator.Contains, selectedYear + selectedMonth));
          } else {
            MessageToast.show("연도와 월을 선택하세요.");
          }
        }, this);




      },
    });
  }
);
