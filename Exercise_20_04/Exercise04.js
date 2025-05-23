let button = document.getElementById("submit");

function get_area(a, b){
    return a * b;
}

button.addEventListener('click', function() {

    let x = Number(document.getElementById("length").value);
    let y = Number(document.getElementById("width").value);
   
    let result_num = get_area(x, y);
    if (result_num == 0) {
    document.getElementById("result").innerHTML = "계산 결과 없음";
    }
    else {
    document.getElementById("result").innerHTML = "계산된 면적 : " + result_num +"㎡";
    }
}
);




