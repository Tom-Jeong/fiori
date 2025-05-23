// key : value, key : value ...
var fruit = { 
    name : "banana",
    color : "yellow",
    origin : "Puerto Rico",
    weight : 230,
    size : 17
};
var aFruit = [];

for (var p in fruit) {
    console.log(p + ": " + fruit[p]); //출력
    aFruit.push(fruit[p]);           // Array 객체의 메소드 PUSH
}

console.log(aFruit);                //배열에 입력된 데이터 출력

alert(aFruit);