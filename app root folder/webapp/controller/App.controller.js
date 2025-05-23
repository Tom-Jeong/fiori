sap.ui.define([
    "sap/ui/core/mvc/Controller"

 ], (Controller, ) => {
    "use strict";
 
    return Controller.extend("ui5.walkthrough.controller.App", {
      //초기 세팅 목적
      /*       onInit() {
         //1. 기본 JSON set data on view {key : value, ...}
         const oData = {
            recipient: {
               name: "정상훈",
               comment: "Hello Tom"
            }
         };
         const oModel = new JSONModel(oData);
         this.getView().setModel(oModel); //뷰에 모델을 연결
         //this.getView().setModel(oModel,"모델명"); 모델명 추가하고싶다.

         // i18n 모델 설정 [초기 리소스 데이터 세팅(최초 한번만)
         // : 타겟 데이터 경로를 매개변수로
         const i18nModel = new ResourceModel({
            bundleName: "ui5.walkthrough.i18n.i18n",
            locale: "en"
         });
         this.getView().setModel(i18nModel, "i18n"); //모델이름 지정정
      }, */
      


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

         // 브라우저 기본 기능이 아닌, 메세지 
         // MessageToast.show("Hello World"); //리소스모델에 바인딩하여 표현해보자
       }
    });
 });