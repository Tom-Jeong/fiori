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

        // 계획/남은 수량은 빈값으로 초기화
        this.getView().setModel(
          new JSONModel({
            PlanId: "",
            MatId: "",
            Qty: "0",
            Uom: "",
            RemainingQty: "0",
            PoSDate: "0000-00-00",
            PoEDate: "0000-00-00",
          }),
          "FullData"
        );

        const oYear = this.byId("yearComboBox");
        const oMonth = this.byId("monthComboBox");

        const currentYear = new Date().getFullYear();
        for (let y = currentYear - 5; y <= currentYear; y++) {
          oYear.addItem(new sap.ui.core.Item({ key: y, text: y.toString() }));
        }

        for (let m = 1; m <= 12; m++) {
          oMonth.addItem(
            new sap.ui.core.Item({
              key: m.toString(),
              text: m + "월",
            })
          );
        }

        const oPlanModel = new ODataModel(
          "/sap/opu/odata/sap/ZDCPP_GW_001_SRV/"
        );
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

        oModel.read("/ZDCT_PP030Set", {
          success: (oData) => {
            const start = new Date(`${sYear}-${sMonth.padStart(2, "0")}-01`);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

            const aFiltered = oData.results.filter((item) => {
              const d = new Date(item.PoSDate);
              return d >= start && d <= end;
            });

            aFiltered.forEach((item) => {
              const s = new Date(item.PoSDate);
              const e = new Date(item.PoEDate);
              item.PoSDate = `${s.getFullYear()}-${(s.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${s.getDate().toString().padStart(2, "0")}`;
              item.PoEDate = `${e.getFullYear()}-${(e.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${e.getDate().toString().padStart(2, "0")}`;
            });

            this.getView().setModel(
              new JSONModel({ planedOrder: aFiltered }),
              "Plan"
            );

            if (aFiltered.length === 0) {
              MessageToast.show(
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
        this.handleRemoveSelection();

        const oCtx = oEvent.getParameter("listItem").getBindingContext("Plan");
        const oData = oCtx.getObject();

        // FullData 모델 세팅
        const oFullModel = this.getView().getModel("FullData");
        oFullModel.setData({
          PlanId: oData.PlanId,
          MatId: oData.MatId,
          Uom: oData.Uom,
          Qty: oData.Qty,
          RemainingQty: oData.Qty,
          PoSDate: oData.PoSDate,
          PoEDate: oData.PoEDate,
        });

        // 캘린더 준비
        const oCalendar = this.byId("calendar");
        oCalendar.removeAllSelectedDates();
        oCalendar.destroySpecialDates();

        // 캘린더 포커스 (생산 시작일)
        const oStartDate = new Date(oData.PoSDate);
        const oEndDate = new Date(oData.PoEDate);
        oCalendar.focusDate(new Date(oStartDate));

        // 생산오더 OData 조회 (PlanId + ProdDate between 시작~종료)
        const oModel = this.getView().getModel("Plan1");
        const sPlanId = oData.PlanId;
        const sPoS = oStartDate.toISOString().split("T")[0] + "T00:00:00";
        const sPoE = oEndDate.toISOString().split("T")[0] + "T23:59:59";

        // 최대 생산량
        const MAX_QTY = 50; // 필요시 변경

        // 비동기 생산오더 데이터 조회
        await new Promise((resolve, reject) => {
          oModel.read("/ZDCT_PP040Set", {
            filters: [
              new sap.ui.model.Filter("PlanId", "EQ", sPlanId),
              new sap.ui.model.Filter("ProdDate", "GE", sPoS),
              new sap.ui.model.Filter("ProdDate", "LE", sPoE),
            ],
            success: (oData2) => {
              // 날짜별 생산량 집계
              const dateMap = {};
              oData2.results.forEach((row) => {
                const d = new Date(row.ProdDate);
                // yyyy-mm-dd만 뽑기
                const key = d.toISOString().split("T")[0];
                dateMap[key] = (dateMap[key] || 0) + Number(row.Qty || 0);
              });

              // 시작~종료일 루프
              for (
                let d = new Date(
                  oStartDate.getFullYear(),
                  oStartDate.getMonth(),
                  oStartDate.getDate()
                );
                d <= oEndDate;
                d.setDate(d.getDate() + 1)
              ) {
                // 날짜 스트링 (yyyy-mm-dd)
                const sKey = d.toISOString().split("T")[0];
                const qty = dateMap[sKey] || 0;

                // 회색처리: 최대수량 도달
                if (qty >= MAX_QTY) {
                  oCalendar.addSpecialDate(
                    new sap.ui.unified.DateTypeRange({
                      startDate: new Date(sKey),
                      type: "NonWorking",
                      tooltip: "최대 생산량 도달",
                    })
                  );
                }
                // 색 처리: 생산오더 일부 존재 (이 부분은 디자인/기획에 따라 옵션)
                else if (qty > 0) {
                  oCalendar.addSpecialDate(
                    new sap.ui.unified.DateTypeRange({
                      startDate: new Date(sKey),
                      type: "Type08",
                      tooltip: `가능 수량 : ${MAX_QTY - qty}개`,
                    })
                  );
                }
              }
              this.aProdOrders = oData2.results.map((row) => ({
                PlanId: row.PlanId,
                ProdDate: this.oFormatYyyymmdd.format(new Date(row.ProdDate)),
                Qty: Number(row.Qty),
              }));
              resolve();
            },
            error: (err) => {
              MessageToast.show("생산오더 데이터를 읽지 못했습니다.");
              reject(err);
            },
          });
        });
      },

      handleCalendarSelect(oEvent) {
        const oFullData = this.getView().getModel("FullData");

        if (!oFullData || !oFullData.getProperty("/PlanId")) {
          MessageToast.show("먼저 계획주문을 선택해주세요.");
          this.byId("calendar").removeAllSelectedDates();
          return;
        }

        const clearTime = (d) =>
          new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const startDate = clearTime(
          new Date(oFullData.getProperty("/PoSDate"))
        );
        const endDate = clearTime(new Date(oFullData.getProperty("/PoEDate")));

        const planId = oFullData.getProperty("/PlanId");
        const planQty = Number(oFullData.getProperty("/Qty"));
        const aProdOrders = this.aProdOrders || []; // 전체 생산오더

        const oCalendar = oEvent.getSource();
        const aSelected = oCalendar.getSelectedDates();
        const aValidDates = [];

        for (let i = 0; i < aSelected.length; i++) {
          const oDate = clearTime(aSelected[i].getStartDate());
          const formattedDate = this.oFormatYyyymmdd.format(oDate);

          if (oDate < startDate || oDate > endDate) {
            oCalendar.removeSelectedDate(aSelected[i]);
            MessageToast.show(`생산 기간 이외의 날짜는 선택할 수 없습니다.`);
            continue;
          }

          // 생산오더에서 해당 날짜에 이미 배정된 수량 계산
          const usedQty = aProdOrders
            .filter(
              (order) =>
                order.PlanId === planId && order.ProdDate === formattedDate // 포맷 꼭 맞추기!
            )
            .reduce((sum, order) => sum + Number(order.Qty), 0);

          const availableQty = planQty - usedQty;

          aValidDates.push({
            Date: formattedDate,
            Qty: "",
            Editable: true,
            AvailableQty: availableQty, // 남은 가능 수량
          });
        }

        this.oModel.setProperty("/selectedDates", aValidDates);
      },

      handleRemoveSelection() {
        this.byId("calendar").removeAllSelectedDates();
        this.oModel.setProperty("/selectedDates", []);
        const qty = this.getView().getModel("FullData").getProperty("/Qty");
        this.getView().getModel("FullData").setProperty("/RemainingQty", qty);
      },

      async onSaveProductionOrders() {
        const oView = this.getView();
        const oModel = oView.getModel("Plan1");
        const aDates = this.oModel.getProperty("/selectedDates") || [];
        const oFull = oView.getModel("FullData").getData();

        if (aDates.some((d) => !d.Qty || parseInt(d.Qty) <= 0)) {
          MessageToast.show("모든 수량을 입력하고 저장한 후 생성 가능합니다.");
          return;
        }

        let success = 0,
          fail = 0;
        for (const date of aDates) {
          const oEntry = {
            PlanId: oFull.PlanId,
            MatId: oFull.MatId,
            Uom: oFull.Uom,
            Qty: date.Qty,
            ProdDate: `/Date(${new Date(date.Date).getTime()})/`,
          };

          try {
            await new Promise((resolve, reject) => {
              oModel.create("/ZDCT_PP040Set", oEntry, {
                success: () => {
                  success++;
                  resolve();
                },
                error: (err) => {
                  console.error(err);
                  fail++;
                  reject();
                },
              });
            });
          } catch {}
        }

        sap.m.MessageBox.information(
          `생산 오더 : ${success}건 성공 / ${fail}건 실패`
        );

        // 계획주문 ID 기준으로 해당 계획주문을 업데이트 요청
        // 계획주문 ID 기준으로 해당 계획주문을 업데이트 요청
        oModel.update(
          `/ZDCT_PP030Set('${oFull.PlanId}')`,
          { PlanId: oFull.PlanId },
          {
            success: () => {
              MessageToast.show("계획주문 상태가 업데이트되었습니다.");
              this.onSearch();
            },
            error: (oError) => {
              console.error("계획주문 상태 업데이트 실패", oError);
              MessageToast.show("계획주문 상태 업데이트 실패");
            },
          }
        );

        this.byId("calendar").removeAllSelectedDates();
        this.oModel.setProperty("/selectedDates", []);
        this.getView().getModel("FullData").setData({
          PoSDate: "0000-00-00",
          PoEDate: "0000-00-00",
          Qty: "0",
          RemainingQty: "0",
        });
        this.byId("tab1").removeSelections();
      },

      onSave() {
        const aDates = this.oModel.getProperty("/selectedDates") || [];
        const planQty = this.getView().getModel("FullData").getProperty("/Qty");

        const total = aDates.reduce((sum, d) => sum + parseInt(d.Qty || 0), 0);
        if (aDates.some((d) => !d.Qty || parseInt(d.Qty) < 0)) {
          MessageToast.show("모든 수량을 올바르게 입력해주세요.");
          return;
        }
        if (total > planQty) {
          MessageToast.show("입력 수량이 계획 수량을 초과했습니다.");
          return;
        }

        aDates.forEach((d, i) =>
          this.oModel.setProperty(`/selectedDates/${i}/Editable`, false)
        );
        this.getView()
          .getModel("FullData")
          .setProperty("/RemainingQty", planQty - total);
        MessageToast.show("입력값이 저장되었습니다.");
      },

      onChange() {
        const aDates = this.oModel.getProperty("/selectedDates") || [];
        aDates.forEach((_, i) =>
          this.oModel.setProperty(`/selectedDates/${i}/Editable`, true)
        );
      },

      onDelete(oEvent) {
        const sPath = oEvent
          .getSource()
          .getParent()
          .getParent()
          .getBindingContext()
          .getPath();
        const iIndex = parseInt(sPath.split("/").pop());

        const aDates = this.oModel.getProperty("/selectedDates");
        const removedDate = aDates[iIndex].Date;

        // 달력에서도 제거
        const oCalendar = this.byId("calendar");
        oCalendar.getSelectedDates().forEach((d, i) => {
          if (this.oFormatYyyymmdd.format(d.getStartDate()) === removedDate) {
            oCalendar.removeSelectedDate(d);
          }
        });

        // 모델에서 제거
        aDates.splice(iIndex, 1);
        this.oModel.setProperty("/selectedDates", aDates);

        const planQty = this.getView().getModel("FullData").getProperty("/Qty");
        const total = aDates.reduce((s, d) => s + parseInt(d.Qty || 0), 0);
        this.getView()
          .getModel("FullData")
          .setProperty("/RemainingQty", planQty - total);
      },
    });
  }
);
