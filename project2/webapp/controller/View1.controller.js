sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
  ],
  (Controller, ODataModel, JSONModel, MessageToast) => {
    "use strict";

    return Controller.extend("project2.controller.View1", {
      onInit() {
        // OData 모델 생성 및 설정
        var oModel = new ODataModel("/sap/opu/odata/sap/ZCARR_D20_SRV/");
        // View에 모델 설정
        this.getView().setModel(oModel, "Air");
      },

      // 버튼 클릭시 호출될 함수 정의
      onNewData() {
        var oView = this.getView(); // View 가져와 객체 선언
        var oModel = oView.getModel("Air"); // 객체로부터 ODataModel 메소드를 통해 데이터모델 가져오기기

        // Input 값 가져오기
        var oData = {
          Carrid: oView.byId("Input1").getValue(),
          Carrname: oView.byId("Input2").getValue(),
          Currcode: oView.byId("Input3").getValue(),
          Url: oView.byId("Input4").getValue(),
        };

        // 데이터 유효성 검사 (빈 값 방지)
        if (!oData.Carrid || !oData.Carrname || !oData.Currcode || !oData.Url) {
          MessageToast.show("모든 필드를 입력해주세요.");
          return;
        }

        // ODataModel을 사용하여 데이터 생성 요청 (POST)
        oModel.create("/ZCARR_D20Set", oData, {
          success: function () {
            MessageToast.show("항공사 데이터가 성공적으로 생성되었습니다.");
            oModel.refresh(true); // 데이터 새로고침
          },
          error: function () {
            MessageToast.show("데이터 생성 오류");
          },
        });
      },

      onDelete() {
        var oView2 = this.getView(); // 뷰 가져오기
        var oModel = oView2.getModel("Air"); // ODataModel 가져오기
        var oTable = oView2.byId("table"); //뷰 안에 데이터 모델이 적용된 테이블 가져오기

        var oRow = oTable.getSelectedItem(); //테이블에서 선택된 행 가져오기
        // 데이터 유효성 검사 (빈 값 방지)
        if (!oRow) {
          MessageToast.show("삭제할 항목을 선택해주세요.");
          return;
        }

        var oContext = oRow.getBindingContext("Air"); // 선택된 행 안에 들어있는 값을 데이터모델에서 가져오기
        var oPath = oContext.getPath(); // 해당 값의 경로를 가져오기

        // ODataModel을 사용하여 데이터 제거 요청 (ODataModel >> Remove 메소드드)
        oModel.remove(oPath, {
          success: function () {
            MessageToast.show("데이터가 성공적으로 제거되었습니다.");
            oTable.removeSelections(); // 테이블에서 선택 해제
          },
          error: function () {
            MessageToast.show("데이터 삭제에 실패했습니다");
          },
        });
      },

      // 3. 다이얼로그(프라그먼트 창) 생성 및 선택 행의 데이터 가져가기기

      async onDialog() {
        var oView3 = this.getView(); // 뷰 가져오기
        var oTable = oView3.byId("table"); //뷰 안에 데이터 모델이 적용된 테이블 가져오기
        var oRow2 = oTable.getSelectedItem(); //테이블에서 선택된 행 가져오기

        // 데이터 유효성 검사 (빈 값 방지)
        if (!oRow2) {
          MessageToast.show("수정할 항목을 선택해주세요.");
          return;
        }

        var oContext = oRow2.getBindingContext("Air"); // 선택된 행 안의 데이터 가져오기
        var oValue = oContext.getObject(); // OData에서 선택된 행의 오브젝트트를 새로운 객체에 저장
        var dialogModel = new JSONModel(oValue); // 새로운  JSONModel 생성
        this.getView().setModel(dialogModel, "UpdateData"); // 생성한 모델을 updateData로 프라그먼트에 전달달

        // 비동기 프라그먼트 실행(최초에 없을 경우 생성)
        if (!this.oDialog) {
          this.oDialog ??= await this.loadFragment({
            name: "project2.view.Update",
          });
          oView3.addDependent(this.oDialog); // 다이얼로그 뷰에 추가
        }
        // 다이얼로그 열기
        this.oDialog.open();
      },

      // 다이얼로그 닫는 함수
      onCloseDialog() {
        // note: We don't need to chain to the pDialog promise, since this event handler
        // is only called from within the loaded dialog itself.
        this.byId("UpdateDialog").close();
      },

      // 4. UPDATE : 다이얼로그에 입력된 값을 바탕으로
      onUpdate() {
        // OData 모델 가져오기
        var oModel = this.getView().getModel("Air");

        // 현재 편집 중인 데이터 가져오기
        var oEditModel = this.getView().getModel("UpdateData");
        var oUpdatedData = oEditModel.getData(); // 수정된 데이터 객체 가져오기

        // 선택한 아이템의 바인딩 경로 가져오기
        var mtable = this.getView().byId("table");
        var sPath = mtable.getSelectedItem().getBindingContext("Air").getPath();

        // ODataModel을 사용하여 PUT 또는 PATCH 요청 보내기
        oModel.update(sPath, oUpdatedData, {
          success: function () {
            MessageToast.show("데이터가 성공적으로 업데이트되었습니다.");
            oModel.refresh(); // 테이블 데이터 갱신
          },
          error: function () {
            MessageToast.show("데이터 업데이트에 실패했습니다.");
          },
        });

        // 다이얼로그 닫기
        this.byId("UpdateDialog").close();
      },
    });
  }
);
