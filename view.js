var char = {
    image: null,
    parts: [],
    exp: {},
    expId: "",
    partsId: [],
    custom: false,
    anim: false,
    isAnim: false
};

function clean() {
    var table = document.getElementById("table");
    for (var i = 0; i < char.parts.length; i++) {
        table.deleteRow(2);
    }
    var exp = document.getElementById("exp");
    for (var i = 0; i < Object.keys(char.exp).length; i++) {
        exp.remove(1);
    }
    resize(document.getElementById("c-1"), 0, 0);
    document.getElementById("anim").checked = false;
    document.getElementById("anim").disabled = true;
    char = {
        image: null,
        parts: [],
        exp: {},
        partsId: [],
        custom: false,
        anim: false,
        isAnim: false
    }
}

function genRow(id) {
    var table = document.getElementById("table");
    var row = table.insertRow(id + 2);
    var cell1 = row.insertCell(0);
    cell1.innerHTML =
        "<label>Part: </label>" +
        "<select id=s%i%>".replace("%i%", id) +
        "<option value=null>None</option>" +
        "</select>";
}

function writeData(s, object, cb) {
    var k = Object.keys(object);
    s.onchange = cb;
    for (var i = 0; i < k.length; i++) {
        var o = document.createElement("option");
        o.text = k[i];
        o.value = k[i];
        s.add(o);
    }
}

function genCB(i) {
    return function () {
        changePart(i, this.value);
    };
}

function load() {
    writeData(document.getElementById("exp"), char.exp, changeExp);
    for (var i = 0; i < char.parts.length; i++) {
        writeData(document.getElementById("s" + i), char.parts[i], genCB(i));
    }
}

function imagePromise(path){
  return new Promise(function(resolve, reject) {
    const i = new Image();
    i.onload = resolve(i);
    i.src = path;
  });
}

async function loadChar(data) {
    char.image = {};
    char.image[""] = await imagePromise('media/' + data.src);
    await Promise.all(Object.entries(data.subImages||{}).map(async ([k,v]) => {
      char.image[k] = await imagePromise('media/' + v);
    }))
    char.parts = data.parts;
    char.exp = data.expressions;
    resize(document.getElementById("c-1"), data.width, data.height);
    for (var i = 0; i < char.parts.length; i++) {
        genRow(i);
    }
    load();
}

function resize(canvas, w, h) {
    canvas.width = w;
    canvas.height = h;
}

function getChar(path) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", path, false);
    xhttp.send();
    loadChar(JSON.parse(xhttp.responseText).face);
}

function changeExp() {
    char.expId = this.value;
    char.isAnim = false;
    if (this.value == "null") {
        char.custom = true;
        char.anim = false;
    } else {
        char.custom = false;
        char.anim = !!char.exp[this.value].anim;
        char.partsId = char.exp[this.value].faces[0];
    }
    sync();
}

function sync() {
    for (var i = 0; i < char.parts.length; i++) {
        var s = document.getElementById("s" + i);
        if (char.partsId[i]) {
            s.value = char.partsId[i];
        } else {
            s.value = "null";
        };
        s.disabled = !char.custom;
    }
    document.getElementById("anim").disabled = !char.anim;
    document.getElementById("anim").checked = char.isAnim;
    draw();

}

function changePart(id, value) {
    if (value == "null") {
        value = undefined;
    }
    char.partsId[id] = value;
    draw();
}

function draw() {
    var canvas = document.getElementById("c-1");
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    var x = y = 0;
    for (var i = document.getElementById("body").checked?1:0; i < char.partsId.length; i++) {
        if (char.partsId[i]) {
            var part = char.parts[i][char.partsId[i]]
            drawPart(ctx, char.image, part, x ,y);
            x += part.subX||0;
            y += part.subY||0;
        }
    }
}

function drawPart(ctx, image, p, x, y) {
    ctx.drawImage(image[p.img||""], p.srcX, p.srcY, p.width, p.height, p.destX + x, p.destY + y, p.width, p.height);
}

function animate(i) {
    if (!char.isAnim) {
        return;
    }
    char.partsId = char.exp[char.expId].faces[char.exp[char.expId].anim[i]];
    var ni = (i + 1) % char.exp[char.expId].anim.length;
    sync();
    setTimeout(function () { animate(ni) }, 1000 * char.exp[char.expId].time);

}

function init() {
    var sChar = document.getElementById('char');
    sChar.onchange = function () {
        clean();
        if (this.value == "null") {
            return;
        }
        var path = 'data/' + this.value ;
        getChar(path);

    };
    var anim = document.getElementById('anim');
    anim.onclick = function () {
        char.isAnim = anim.checked;
        if (char.isAnim) {
            animate(0);
        }
    };

}

init();
