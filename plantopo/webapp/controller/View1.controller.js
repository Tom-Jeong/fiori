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
			this.oModel = new JSONModel({selectedDates:[]});
			this.getView().setModel(this.oModel);

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
                // 시작일 날짜 형식 변환
                var date = new Date(item.PoSDate);
                var year = date.getFullYear();
                var month = (date.getMonth() + 1).toString().padStart(2, "0");
                var day = date.getDate().toString().padStart(2, "0");
                var formatDate = year + "-" + month + "-" + day;
                item.PoSDate = formatDate;

                // 종료일도 같은 방식으로 변환
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
        }); // 계획주문 테이블 불러오기
      },

async openCalendar(oEvent) {
  const oDetailBox = this.byId("detailBox");
  oDetailBox.setVisible(true);

  // 나머지 로직 추가 예정 (선택된 행 가져오기, 오더 확인 등)
},

handleCalendarSelect(oEvent) {
			var oCalendar = oEvent.getSource(),
				aSelectedDates = oCalendar.getSelectedDates(),
				oData = {
					selectedDates: []
				},
				oDate,
				i;
			if (aSelectedDates.length > 0 ) {
				for (i = 0; i < aSelectedDates.length; i++){
					oDate = aSelectedDates[i].getStartDate();
					oData.selectedDates.push({Date:this.oFormatYyyymmdd.format(oDate)});
				}
				this.oModel.setData(oData);
			} else {
				this._clearModel();
			}
		},

    		handleRemoveSelection: function() {
			this.byId("calendar").removeAllSelectedDates();
			this._clearModel();
		},

    });
  }
);
