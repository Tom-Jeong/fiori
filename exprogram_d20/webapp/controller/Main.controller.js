sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/date/UI5Date",
    "sap/m/MessageBox",
  ],
  (
    Controller,
    JSONModel,
    ODataModel,
    MessageToast,
    DateFormat,
    UI5Date,
    MessageBox
  ) => {
    "use strict";

    return Controller.extend("cl4.exprogramd20.controller.Main", {
      onInit() {
        this.oRouter = this.getOwnerComponent().getRouter(); // 컨트롤러에 유효한 객체

        var oModel = new ODataModel("/sap/opu/odata/SAP/ZEXAM_MEMBER_D20_SRV/");
        this.getView().setModel(oModel, "Data");

      },

      async onDialog() {
        // 다이얼로그가 없으면 생성
        this.oDialog ??= await this.loadFragment({
          name: "cl4.exprogramd20.view.User",
        });
        this.getView().addDependent(this.oDialog); // 다이얼로그 뷰에 추가

        // 다이얼로그 열기
        this.oDialog.open();
      },
      onClose() {
        this.byId("UserData").close();
      },

      
      onCreate() {
        var oView = this.getView(); // View 가져와 객체 선언
        var oModel = oView.getModel("Data"); // 객체로부터 ODataModel 메소드를 통해 데이터모델 가져오기기

        // Input 값 가져오기
        var oData = {
          Name: oView.byId("fname").getValue(),
          Bdate: oView.byId("fdate").getValue(),
          Gender: oView.byId("fgender").getValue(),
          City: oView.byId("fcity").getValue(),
          Country: oView.byId("fcode").getValue(),
          Telephone: oView.byId("fphone").getValue(),
          Email: oView.byId("fmail").getValue(),
        };

        // 데이터 유효성 검사 (빈 값 방지)
        if (
          !oData.Name ||
          !oData.Bdate ||
          !oData.Gender ||
          !oData.City ||
          !oData.Country ||
          !oData.Telephone ||
          !oData.Email
        ) {
          MessageToast.show("모든 필드를 입력해주세요.");
          return;
        }

        
        // ODataModel을 사용하여 데이터 생성 요청 (POST)
        oModel.create("/ZTMEMBERSet", oData, {
          success: function () {
            MessageToast.show("회원정보가 저장되었습니다.");
            oModel.refresh(true); // 데이터 새로고침
          },
          error: function () {
            MessageToast.show("회원정보 저장 실패");
          },
        });

        this.byId("UserData").close();
      },

      goDetail(oEvent) {
        var oData = oEvent.getSource().getBindingContext("Data").getObject();
        const oDate = oData.Bdate.toISOString().substr(0,10);

        this.oRouter.navTo('RouteDetail', {key1: oData.Id, key2: oData.Name, key3: oDate, key4: oData.Gender, key5: oData.City, key6: oData.Country, key7: oData.Telephone, key8: oData.Email}, true);
    }
    });
});
