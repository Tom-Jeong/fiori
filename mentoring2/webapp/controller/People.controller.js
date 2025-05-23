sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
  ],
  (Controller, JSONModel, MessageToast) => {
    "use strict";

    return Controller.extend("mentoring2.controller.View", {
      onInit() {},

      async onDialog() {
        var oList = this.getView().byId("List1");          //뷰 안에 적용된 리스트 가져오기

        var oRow = oList.getSelectedItem();                //리스트에서 선택된 행 가져오기
        if (!oRow) {                                       //예외 처리 : 선택 행이 없는데요?
          sap.m.MessageToast.show("항목을 선택해주세요."); //근데 이 예제에선 굳이?
          return;
        }

        var oContext = oRow.getBindingContext("Employee"); // 선택된 행의 주소 가져오기
                                                           // 주의 : Employee -> manifest에서 선언한 모델명
        var oData = oContext.getObject();                  // 선택한 행의 실제 저장값을 가져와 새로운 객체에 저장

        var dialogModel = new JSONModel(oData);            // 프라그먼트에 전달할 새로운 JSONModel 생성
        this.getView().setModel(dialogModel, "FullData");  // 생성한 모델을 FullData로 시스템에 저장

        // 다이얼로그가 없으면 생성
        this.oDialog ??= await this.loadFragment({
          name: "mentoring2.view.Dial",
        });
        this.getView().addDependent(this.oDialog); // 다이얼로그 뷰에 추가
        
        // 다이얼로그 열기
        this.oDialog.open();
      },

        onCloseDialog() {
        this.byId("Real").close();
      },
    });
  }
);
