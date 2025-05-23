sap.ui.define([
    "sap/ui/core/format/DateFormat"
], (DateFormat) => {
	"use strict";

	return {
		formatDate(sDate) {
            const oDateFormat = DateFormat.getDateInstance({ pattern: "yyyy/MM/dd" });
            return oDateFormat.format(new Date(sDate));
        },


        isFutureMonth(sDate) {
            const oDate = new Date(sDate);
            var iBirthMonth = oDate.getMonth() + 1; // 생일의 월 (1 ~ 12)
            var iCurrentMonth = new Date().getMonth() + 1; // 현재 월 (1 ~ 12)

            return iBirthMonth < iCurrentMonth ? "Flagged" : "Favorite";
        }
	};
});