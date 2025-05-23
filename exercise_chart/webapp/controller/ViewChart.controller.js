sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel"],
  (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("exercisechart.controller.ViewChart", {
      onInit() {
        var DonutData = {
          data: [
            { category: "A등급", value: 50 },
            { category: "B등급", value: 65 },
            { category: "C등급", value: 75 },
            { category: "D등급", value: 40 },
          ],
        };

        var oData = {
          salesData: [
            { month: "2023-01", sales: 12000 },
            { month: "2023-02", sales: 14000 },
            { month: "2023-03", sales: 15000 },
            { month: "2023-04", sales: 13000 },
            { month: "2023-05", sales: 16000 },
            { month: "2023-06", sales: 17000 },
          ],
        };
        var pioModel = new JSONModel(DonutData);
        this.getView().setModel(pioModel, "DonutData");
        var oModel = new JSONModel(oData);
        this.getView().setModel(oModel, "data");

        this._setVizFrameTitle();
      },
      _setVizFrameTitle: function () {
        var oVizFrame = this.getView().byId("VizFrame");
        if (oVizFrame) {
          oVizFrame.setVizProperties({
            title: {
              text: "월별 매출 추이", // 📌 차트 타이틀
              visible: true, // 📌 타이틀을 보이게 설정
            },
            plotArea: {
              dataLabel: {
                visible: true, // 📌 데이터 라벨 활성화
                showTotal: true, // 합계 표시 (Stacked Bar Chart에 유용)
              },
            },
          });
        }

        var oVizFrame2 = this.getView().byId("VizFrame2");
        if (oVizFrame2) {
          oVizFrame2.setVizProperties({
            title: {
              text: "등급별 인원 추이", // 📌 차트 타이틀
              visible: true, // 📌 타이틀을 보이게 설정
            },
            plotArea: {
              shadow: {
                visible: true, // ✅ 그림자 효과 활성화
                color: "#101820", // ✅ 그림자 색상
                size: 5,
              },
              background: {
                visible: true, // ✅ 배경색 활성화
                color: "#EBF4FC", // ✅ 배경색 설정 (회색)
              },
              dataLabel: {
                visible: true, // 📌 데이터 라벨 활성화
                showTotal: false, // 합계 표시 (Stacked Bar Chart에 유용)
              },
              colorPalette: ["#F77B55", "#E9DFEA", "#6CBFC3", "#ADC3EC"],
            },
          });
        }
      },
    });
  }
);
