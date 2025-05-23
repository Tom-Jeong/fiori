let todo = [];
while(true){

let ask = prompt("선택 - 1. 할일 추가하기 2.할일 삭제하기 3. 종료하기");

if(ask == 1){
let ans = prompt("할 일을 입력하세요");
todo.push(ans);
console.log("현재 할일 목록 :", todo);
}

else if(ask == 2){
    if (todo.length == 0){
        alert("배열이 비어있습니다.");
    }
    else{
        let del = prompt("삭제할 할 일의 번호를 입력하세요 (0부터 시작)");

        let del_num = parseInt(del);
        if (todo.length <= del_num) {
            alert("존재하지 않는 번호입니다.");
        }
        else{
        todo.splice(del_num,1);
        console.log("현재 할일 목록 :", todo);
        }
    }
}

else if(ask == 3){
console.log("현재 할일 목록 :", todo);
break;
}
}
