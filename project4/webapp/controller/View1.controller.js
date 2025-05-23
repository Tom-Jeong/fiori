sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("project4.controller.View1", {
        // 컨트롤러가 로드될 때 한번만 실행 - 모델 생성
        onInit() {
            // 한 단계 위에 있는 컴포넌트에 접근해서, 라우터를 가져온다 
            // var oRouter = this.getOwnerComponent().getRouter(); // 해당 함수에만 유효하다.
            this.oRouter = this.getOwnerComponent().getRouter(); // 컨트롤러에 유효한 객체
        },


        goDetail(oEvent) {
        var oData = oEvent.getSource().getBindingContext("students").getObject(); //detail 버튼으로만 
        // var oTable = this.getView().byId("mtable");          //뷰 안에 적용된 리스트 가져오기

        // var oRow = oTable.getSelectedItem();                //리스트에서 선택된 행 가져오기
        // if (!oRow) {                                       //예외 처리 : 선택 행이 없는데요?
        //   sap.m.MessageToast.show("항목을 선택해주세요."); //근데 이 예제에선 굳이?
        //   return;
        // }

        // var oContext = oRow.getBindingContext("students"); // 선택된 행의 주소 가져오기
        //                                                    // 주의 : Employee -> manifest에서 선언한 모델명
        // var oData = oContext.getObject();                  // 선택한 행의 실제 저장값을 가져와 새로운 객체에 저장
        
        this.oRouter.navTo('RouteDetail', {key1: oData.no, key2: oData.name, key3: oData.gender, key4: oData.birthdate}, true);
    }

    });
});