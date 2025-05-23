sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  (Controller, JSONModel, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("practice1.controller.practice", {
      onInit() {},

      async onPress(oEvent) {
        let Data = oEvent.getSource().getBindingContext("Datas").getObject();
        let oValue = new JSONModel(Data);
        this.getView().setModel(oValue, "Info");

        // 비동기 프라그먼트 실행(최초에 없을 경우 생성)
        if (!this.oDialog) {
          this.oDialog ??= await this.loadFragment({
            name: "practice1.view.Info",
          });
          this.getView().addDependent(this.oDialog); // 다이얼로그 뷰에 추가
        }
        // 다이얼로그 열기
        this.oDialog.open();
      },

      onCloseDialog() {
        this.byId("Info").close();
      },

      //search field의 돋보기 눌렀을 때 트리거 되는 이벤트 핸들러 메소드 정의
      onFilterInvoices(oEvent) {
        // build filter array (기준은 배열)
        const aFilter = [];
        const sQuery = oEvent.getParameter("query"); //입력된 값
        if (sQuery) {
          aFilter.push(
            new Filter("ProductName", FilterOperator.Contains, sQuery)
          );
        }

        // filter binding
        const oList = this.byId("invoiceList"); //대상 리스트(인터널 테이블)
        const oBinding = oList.getBinding("items"); //각 아이템에 바인딩
        oBinding.filter(aFilter); //필터
      },
    });
  }
);
