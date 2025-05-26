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
        this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getDateInstance({
          pattern: "yyyy-MM-dd",
        });
        this.oModel = new JSONModel({ selectedDates: [] });
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
        var oPlanModel = new ODataModel("/sap/opu/odata/sap/ZDCPP_GW_001_SRV/");
        // View에 모델 설정
        this.getView().setModel(oPlanModel, "Plan1");
      },

      onSearch() {
        const oModel = this.getView().getModel("Plan1");
        const sYear = this.byId("yearComboBox").getSelectedKey();
        const sMonth = this.byId("monthComboBox").getSelectedKey();

        if (!sYear || !sMonth) {
          MessageToast.show("연도와 월을 모두 선택해주세요.");
          return;
        }

        // 전체 데이터 가져오기
        oModel.read("/ZDCT_PP030Set", {
          success: (oData) => {
            const aAll = oData.results;

            // 생산 시작일 기준 필터링
            const startDate = new Date(
              `${sYear}-${sMonth.padStart(2, "0")}-01`
            );
            const endDate = new Date(
              startDate.getFullYear(),
              startDate.getMonth() + 1,
              0
            );

            const aFiltered = aAll.filter((item) => {
              const d = new Date(item.PoSDate);
              return d >= startDate && d <= endDate;
            });

            // 날짜 포맷 보정
            aFiltered.forEach((item) => {
              const day1 = new Date(item.PoSDate);
              item.PoSDate = `${day1.getFullYear()}-${(day1.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${day1
                .getDate()
                .toString()
                .padStart(2, "0")}`;

              const day2 = new Date(item.PoEDate);
              item.PoEDate = `${day2.getFullYear()}-${(day2.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${day2
                .getDate()
                .toString()
                .padStart(2, "0")}`;
            });

            const planOrderData = new JSONModel({ planedOrder: aFiltered });
            this.getView().setModel(planOrderData, "Plan");

            if (aFiltered.length === 0) {
              sap.m.MessageBox.information(
                "선택한 연도와 월에 해당하는 계획주문이 없습니다."
              );
            }
          },
          error: (err) => {
            MessageToast.show("계획 주문 데이터를 가져오는 데 실패했습니다.");
            console.error(err);
          },
        });
      },

      async openCalendar(oEvent) {
        const oItem = oEvent.getParameter("listItem");
        const oCtx = oItem.getBindingContext("Plan");
        const oData = oCtx.getObject();

        // 선택된 계획 주문 데이터를 별도 모델로 등록
        const oFullDataModel = new JSONModel(oData);
        oFullDataModel.setProperty("/RemainingQty", oData.Qty); // 초기 남은 수량 = 전체 수량
        this.getView().setModel(oFullDataModel, "FullData");

        const oCalendar = this.byId("calendar");
        const oStartDate = new Date(oData.PoSDate); // "yyyy-MM-dd" 형식일 경우 자동 파싱됨

        oCalendar.removeAllSelectedDates();
        oCalendar.focusDate(oStartDate);
      },

      handleCalendarSelect(oEvent) {
        const oFullData = this.getView().getModel("FullData");

        //계획주문을 먼저 선택하지 않으면 차단
        if (!oFullData || !oFullData.getProperty("/PlanId")) {
          MessageToast.show("먼저 계획주문을 선택해주세요.");
          this.byId("calendar").removeAllSelectedDates(); // 잘못된 선택 제거
          return;
        }
        var oCalendar = oEvent.getSource(),
          aSelectedDates = oCalendar.getSelectedDates(),
          oData = {
            selectedDates: [],
          },
          oDate,
          i;
        if (aSelectedDates.length > 0) {
          for (i = 0; i < aSelectedDates.length; i++) {
            oDate = aSelectedDates[i].getStartDate();
            oData.selectedDates.push({
              Date: this.oFormatYyyymmdd.format(oDate),
              Qty: "",
              Editable: true, // 필드 활성 상태
            });
          }
          this.oModel.setData(oData);
        } else {
          this._clearModel();
        }
      },

      handleRemoveSelection() {
        this.byId("calendar").removeAllSelectedDates();
        this.oModel.setProperty("/selectedDates", []);
        const planQty = this.getView().getModel("FullData").getProperty("/Qty");
        this.getView()
          .getModel("FullData")
          .setProperty("/RemainingQty", planQty);
      },

      async onSaveProductionOrders() {
        const oView = this.getView();
        const oModel = oView.getModel("Plan1"); // OData OModel
        const aDates = this.oModel.getProperty("/selectedDates") || [];
        const oFullData = oView.getModel("FullData").getData();

        // 1. 유효성 검사
        const hasInvalid = aDates.some(
          (d) => !d.Qty || parseInt(d.Qty, 10) <= 0
        );
        if (hasInvalid) {
          MessageToast.show("모든 수량을 입력하고 저장한 후 생성 가능합니다.");
          return;
        }

        // 2. 순차적으로 생성 요청 전송
        let successCount = 0;
        let failCount = 0;

        for (const date of aDates) {
          const oEntry = {
            PlanId: oFullData.PlanId,
            MatId: oFullData.MatId,
            Uom: oFullData.Uom,
            Qty: date.Qty,
            ProdDate: `/Date(${new Date(date.Date).getTime()})/`, // OData DateTime 형식
          };

          try {
            await new Promise((resolve, reject) => {
              oModel.create("/ZDCT_PP040Set", oEntry, {
                success: () => {
                  successCount++;
                  resolve();
                },
                error: (oError) => {
                  console.error("오더 생성 실패:", oError);
                  failCount++;
                  reject();
                },
              });
            });
          } catch (e) {}
        }
        // 3. 생성 결과 요약
        sap.m.MessageBox.information(
          `생산 오더 : ${successCount}건 성공 / ${failCount}건 실패`
        );

        // 1. 선택된 날짜 초기화
        this.byId("calendar").removeAllSelectedDates();
        this.oModel.setProperty("/selectedDates", []);

        // 2. 남은 수량 초기화
        const planQty = this.getView().getModel("FullData").getProperty("/Qty");
        this.getView()
          .getModel("FullData")
          .setProperty("/RemainingQty", planQty);

        // 3. 왼쪽 테이블 선택 해제
        this.byId("tab1").removeSelections();
      },

      onSave(oEvent) {
        const oModel = this.oModel;
        const aDates = oModel.getProperty("/selectedDates") || [];

        // 입력 유효성 체크
        const isInvalid = aDates.some(
          (item) => !item.Qty || parseInt(item.Qty) < 0
        );
        if (isInvalid) {
          MessageToast.show("모든 수량을 올바르게 입력해주세요.");
          return;
        }

        // 수량 합계 계산
        const totalQty = aDates.reduce(
          (sum, item) => sum + parseInt(item.Qty || 0),
          0
        );
        const planQty = this.getView().getModel("FullData").getProperty("/Qty");
        const remaining = planQty - totalQty;

        if (remaining < 0) {
          MessageToast.show("입력 수량이 계획 수량을 초과했습니다.");
          return;
        }

        // 전체 비활성화 처리
        aDates.forEach((item, idx) => {
          oModel.setProperty(`/selectedDates/${idx}/Editable`, false);
        });

        // 남은 수량 반영
        this.getView()
          .getModel("FullData")
          .setProperty("/RemainingQty", remaining);
        MessageToast.show("입력값이 저장되었습니다.");
      },

      onChange(oEvent) {
        const oModel = this.oModel;
        const aDates = oModel.getProperty("/selectedDates") || [];
        aDates.forEach((item, idx) => {
          oModel.setProperty(`/selectedDates/${idx}/Editable`, true);
        });
      },

      onDelete: function (oEvent) {
        const oItem = oEvent.getSource().getParent().getParent();
        const sPath = oItem.getBindingContext().getPath();
        const iIndex = parseInt(sPath.match(/\d+/)[0]);

        const aDates = this.oModel.getProperty("/selectedDates");
        const deletedDateStr = aDates[iIndex].Date;

        // 1. 캘린더에서 해당 날짜 선택 제거
        const oCalendar = this.byId("calendar");
        const aSelectedDates = oCalendar.getSelectedDates();
        for (let i = 0; i < aSelectedDates.length; i++) {
          const oCalDate = aSelectedDates[i].getStartDate();
          const sFormatted = this.oFormatYyyymmdd.format(oCalDate);
          if (sFormatted === deletedDateStr) {
            oCalendar.removeSelectedDate(aSelectedDates[i]);
            break;
          }
        }

        // 2. 모델에서 제거
        aDates.splice(iIndex, 1);
        this.oModel.setProperty("/selectedDates", aDates);

        // 3. 남은 수량 다시 계산
        const planQty = this.getView().getModel("FullData").getProperty("/Qty");
        const totalEnteredQty = aDates.reduce((sum, item) => {
          const qty = parseInt(item.Qty, 10);
          return sum + (isNaN(qty) ? 0 : qty);
        }, 0);
        const remaining = planQty - totalEnteredQty;
        this.getView()
          .getModel("FullData")
          .setProperty("/RemainingQty", remaining);
      },
    });
  }
);
