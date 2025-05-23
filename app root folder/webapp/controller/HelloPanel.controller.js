sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
 ], (Controller, MessageToast) => {
    "use strict";
 
    return Controller.extend("ui5.walkthrough.controller.HelloPanel", {
        onShowHello() {
            //리소스 모델 데이터를 가져오는 부분 ((핵심))
            //(1) read msg from i18n model, i18n 모델 가져오기기
               const oBundle = this.getView().getModel("i18n").getResourceBundle();
             
            //기본 JSON 모델에서 /recipient/name의 값을 가져온다
            const sRecipient = this.getView().getModel().getProperty("/recipient/name"); 
   
            //i18n 모델에서 선택된 리소스 모델의 값(텍스트)과 기본 모델에서의 name 값 조합
            const sMsg = oBundle.getText("helloMsg", [sRecipient]); // helloMsg(Hello) + /recipient/name(손흥민) 
       
            // 메시지 출력
            MessageToast.show(sMsg); // 리소스 모델에 바인딩하여 표현해보자자
        },
            // 브라우저 기본 기능이 아닌, 메세지 
            // MessageToast.show("Hello World"); //리소스모델에 바인딩하여 표현해보자
            async onOpenDialog() {
                // 다이얼로그가 없으면 생성 (Lazy Load)
                this.oDialog ??= await this.loadFragment({
                    name: "ui5.walkthrough.view.HelloDialog"
                });
    
                // 다이얼로그 열기
                this.oDialog.open();
              
        },

		onCloseDialog() {
			// note: We don't need to chain to the pDialog promise, since this event handler
			// is only called from within the loaded dialog itself.
			this.byId("helloDialog").close();
		}
    });
 });