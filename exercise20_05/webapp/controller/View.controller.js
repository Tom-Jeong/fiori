sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("exercise2005.controller.View", {
        onPress: function(){
            var sMsg = this.getView().getModel().getProperty("/MessageInput");
            if(!sMsg){ sMsg = "메세지를 입력해주시기 바랍니다."; }
            MessageToast.show(sMsg);
            }
          
    });
});