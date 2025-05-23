// sap.ui.define([
//	"sap/m/Text"
//], (Text) => {    // 화살표 함수 표현
// 	"use strict";			// 고정? 엄격하게 문법 관리하겠다.
/*	alert("UI5 is ready");	 */

// 생성자 메소드로부터 객체 생성
//	new Text({
//		text: "Hello World"
//	}).placeAt("content");
/*placeAt : sap-ui-core에 상속받은 컨트롤들이 사용가능한 메소드
	 기능 : HTML 파일의 해당 요소에 삽입하라, 위치시켜라.
	 		DOM에 직접 랜더링하지 않고 컨트롤에게 삽입하여 랜더링 */
//});

// View 생성으로 인한 인덱스.js 변경
sap.ui.define(["sap/ui/core/ComponentContainer"], (ComponentContainer) => {
  "use strict";

  new ComponentContainer({
    name: "ui5.walkthrough",
    settings: {
      id: "walkthrough",
    },
    async: true,
  }).placeAt("content");
});
