sap.ui.define([], () => {
    "use strict";

    return {
        statusText(status) {
            const oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            if (status < 5000)  {
                    return oResourceBundle.getText("StatusA");}
            else if (status < 20000) {
                    return oResourceBundle.getText("StatusB"); }
            else{
                return oResourceBundle.getText("StatusC");
            }
            }
}
});