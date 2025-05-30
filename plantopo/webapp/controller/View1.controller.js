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
        const oPlant = this.byId("plantComboBox");

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

        const plantList = ["P100", "P101"]; // 실제 플랜트 목록으로 교체
        plantList.forEach((plantId) => {
          oPlant.addItem(new sap.ui.core.Item({ key: plantId, text: plantId }));
        });

        const oPlanModel = new ODataModel(
          "/sap/opu/odata/sap/ZDCPP_GW_001_SRV/"
        );
        this.getView().setModel(oPlanModel, "Plan1");
      },

      onSearch() {
        const oModel = this.getView().getModel("Plan1");
        const sYear = this.byId("yearComboBox").getSelectedKey();
        const sMonth = this.byId("monthComboBox").getSelectedKey();
        const sPlant = this.byId("plantComboBox").getSelectedKey();

        if (!sYear || !sMonth || !sPlant) {
          MessageToast.show("연도, 월, 플랜트를 모두 선택해주세요.");
          return;
        }

        oModel.read("/ZDCT_PP030Set", {
          success: (oData) => {
            const start = new Date(`${sYear}-${sMonth.padStart(2, "0")}-01`);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

            const aFiltered = oData.results.filter((item) => {
              const d = new Date(item.PoSDate);
              return d >= start && d <= end && item.PlantId === sPlant;
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
                "선택한 연도와 월, 플랜트에 해당하는 계획주문이 없습니다."
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
          PlantId: oData.PlantId,
        });

        const oCalendar = this.byId("calendar");
        oCalendar.removeAllSelectedDates();
        oCalendar.destroySpecialDates();

        // 기간
        const oStartDate = new Date(oData.PoSDate);
        const oEndDate = new Date(oData.PoEDate);
        oCalendar.focusDate(new Date(oStartDate));

        // 전체 생산오더를 조회 (PlanId 조건 없이)
        const oModel = this.getView().getModel("Plan1");
        let oData2 = await new Promise((resolve, reject) => {
          oModel.read("/ZDCT_PP040Set", {
            success: (data) => resolve(data),
            error: (err) => {
              MessageToast.show("생산오더 데이터를 읽지 못했습니다.");
              reject(err);
            },
          });
        });

        // 날짜별 생산량 합계
        const MAX_QTY = 50;
        const plantId = oData.PlantId; // 현재 계획주문의 PlantId
        const dateMap = {};
        oData2.results.forEach((order) => {
          if (order.PlantId !== plantId) return; // 해당 플랜트의 오더만 처리

          // 날짜 파싱
          const prodDate =
            order.ProdDate instanceof Date
              ? order.ProdDate
              : new Date(order.ProdDate);
          // 기간 내인지 체크
          if (prodDate >= oStartDate && prodDate <= oEndDate) {
            // yyyy-MM-dd 문자열 생성
            const yyyy = prodDate.getFullYear();
            const mm = String(prodDate.getMonth() + 1).padStart(2, "0");
            const dd = String(prodDate.getDate()).padStart(2, "0");
            const dateStr = `${yyyy}-${mm}-${dd}`;
            dateMap[dateStr] = (dateMap[dateStr] || 0) + Number(order.Qty || 0);
          }
        });

        // 기간 내 모든 날짜 루프 돌면서 specialDate 처리
        for (
          let d = new Date(
            oStartDate.getFullYear(),
            oStartDate.getMonth(),
            oStartDate.getDate()
          );
          d <= oEndDate;
          d.setDate(d.getDate() + 1)
        ) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const dateStr = `${yyyy}-${mm}-${dd}`;
          const qty = dateMap[dateStr] || 0;

          if (d.getDay() === 0 || d.getDay() === 6) {
            oCalendar.addSpecialDate(
              new sap.ui.unified.DateTypeRange({
                startDate: new Date(dateStr),
                type: "NonWorking",
                tooltip: "주말(선택불가)",
              })
            );
            continue; // 주말은 생산량 상관없이 무조건 NonWorking
          }

          if (qty >= MAX_QTY) {
            // 회색(공휴일 스타일, 선택 불가)
            oCalendar.addSpecialDate(
              new sap.ui.unified.DateTypeRange({
                startDate: new Date(dateStr),
                type: "NonWorking",
                tooltip: "최대 생산량 도달",
              })
            );
          } else if (qty > 0) {
            // 색상 표시(예: 파랑), 잔여 수량 툴팁
            oCalendar.addSpecialDate(
              new sap.ui.unified.DateTypeRange({
                startDate: new Date(dateStr),
                type: "Type08",
                tooltip: `잔여 가능 수량: ${MAX_QTY - qty}개`,
              })
            );

            this.aProdOrders = oData2.results
              .filter((order) => order.PlantId === plantId)
              .map((order) => ({
                PlanId: order.PlanId,
                ProdDate: this.oFormatYyyymmdd.format(new Date(order.ProdDate)),
                Qty: Number(order.Qty),
              }));
          }
          // 아무것도 없으면 표시 안 함
        }
      },

      handleCalendarSelect(oEvent) {
        const oFullData = this.getView().getModel("FullData");
        if (!oFullData || !oFullData.getProperty("/PlanId")) {
          MessageToast.show("먼저 계획주문을 선택해주세요.");
          this.byId("calendar").removeAllSelectedDates();
          return;
        }

        const MAX_QTY = 50;
        const clearTime = (d) =>
          new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const startDate = clearTime(
          new Date(oFullData.getProperty("/PoSDate"))
        );
        const endDate = clearTime(new Date(oFullData.getProperty("/PoEDate")));

        // **캘린더에 표시하는 specialDate와 동일하게 전체 생산오더의 날짜별 합계를 만든다**
        const aProdOrders = this.aProdOrders || [];
        const dateQtyMap = {};
        aProdOrders.forEach((order) => {
          // 반드시 yyyy-MM-dd로 포맷
          const prodDate = order.ProdDate;
          dateQtyMap[prodDate] =
            (dateQtyMap[prodDate] || 0) + Number(order.Qty || 0);
        });

        const oCalendar = oEvent.getSource();
        const aSelected = oCalendar.getSelectedDates();
        const aValidDates = [];
        const aSpecialDates = oCalendar.getSpecialDates
          ? oCalendar.getSpecialDates()
          : [];

        const grayDates = aSpecialDates
          .filter((s) => s.getType() === "NonWorking")
          .map((s) => {
            const d = s.getStartDate();
            // yyyy-MM-dd 포맷
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
              2,
              "0"
            )}-${String(d.getDate()).padStart(2, "0")}`;
          });

        for (let i = 0; i < aSelected.length; i++) {
          const oDate = clearTime(aSelected[i].getStartDate());
          const formattedDate = this.oFormatYyyymmdd.format(oDate);

          if (oDate < startDate || oDate > endDate) {
            oCalendar.removeSelectedDate(aSelected[i]);
            MessageToast.show(`생산 기간 이외의 날짜는 선택할 수 없습니다.`);
            continue;
          } else if (grayDates.includes(formattedDate)) {
            oCalendar.removeSelectedDate(aSelected[i]);
            MessageToast.show(
              "선택할 수 없는 날짜입니다. (공휴일 또는 최대 생산량 도달)"
            );
            continue;
          }

          // **툴팁과 동일하게 전체 오더의 합계를 사용**
          const usedQty = dateQtyMap[formattedDate] || 0;
          const availableQty = MAX_QTY - usedQty;

          aValidDates.push({
            Date: formattedDate,
            Qty: "",
            Editable: true,
            AvailableQty: availableQty,
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
        const planQty = Number(
          this.getView().getModel("FullData").getProperty("/Qty")
        );

        // 1. 날짜별 입력값과 한도수량 초과 체크
        for (let i = 0; i < aDates.length; i++) {
          const d = aDates[i];
          const inputQty = parseInt(d.Qty || 0);
          const availQty = parseInt(d.AvailableQty || 0);

          if (!d.Qty || inputQty < 0) {
            MessageToast.show(`[${d.Date}] 수량을 올바르게 입력해주세요.`);
            return;
          }
          if (inputQty > availQty) {
            MessageToast.show(
              `[${d.Date}] 입력 수량이 한도수량(${availQty})을(를) 초과했습니다.`
            );
            return;
          }
        }

        // 2. 전체 계획수량 초과 체크
        const total = aDates.reduce((sum, d) => sum + parseInt(d.Qty || 0), 0);
        if (total > planQty) {
          MessageToast.show("입력 수량이 계획 수량을 초과했습니다.");
          return;
        }

        // 3. 저장 처리
        aDates.forEach((d, i) =>
          this.oModel.setProperty(`/selectedDates/${i}/Editable`, false)
        );
        this.getView()
          .getModel("FullData")
          .setProperty("/RemainingQty", planQty - total);
        MessageToast.show("입력값이 저장되었습니다.");
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
