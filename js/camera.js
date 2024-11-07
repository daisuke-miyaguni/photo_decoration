/** @fileoverview 全般的な共通処理を定義するスクリプト */
/** @namespace camera */
/* methods ********************************************************************/

function videoStart() {
    var video = document.getElementById('camera');

    var constraints = {
        audio: false,
        video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },

            facingMode: enviroment,
        }
    };

    CONSTRAINTS = constraints;

    cameraActive(video);
    setUI();
    setStickerUI();
};

function setUI() {
    var video = document.getElementById('camera');

    const shotBtn = document.getElementById('shot_btn');
    shotBtn.addEventListener('click', photoShoot);

    const changeBtn = document.getElementById('change_btn');
    changeBtn.addEventListener('click', function () {
        var front = changeBtn.classList.toggle('front');
        cameraActive(video, front);
    });

    document.getElementsByClassName('preview')[0].classList.toggle('hidden', true);

    delete_img.src = delete_btn_path;
    delete_img.onload = () => {
        console.log(delete_img.width);
        select_delete_btn = setImg(delete_img, 0, 0, 1);
        select_delete_btn.width = select_delete_btn.width;
        select_delete_btn.height = select_delete_btn.height;
    }

    resize_img.src = resize_btn_path;
    resize_img.onload = () => {
        select_resize_btn = setImg(resize_img, 0, 0, 1);
        select_resize_btn.width = select_resize_btn.width;
        select_resize_btn.height = select_resize_btn.height;
    }

    console.log("setup UI fin");
}

function getUrlQueries() {
    var queryStr = window.location.search.slice(1);  // 文頭?を除外

    // クエリがない場合は空のオブジェクトを返す
    if (!queryStr) {
        console.log('null');
        location.href = 'template.html';
        return queries;
    }
    console.log(queryStr);
    location.href = queryStr + '.html';
    return queryStr;
}

/**
 * @summary カメラを<video>と同期
 * @function
 * @memberof camera
 * @param {object} video
 * @param {boolean} [is_front=true]
 */
function cameraActive(video, is_front = false) {
    console.log('camera Active');
    // 前後カメラの設定
    CONSTRAINTS.video.facingMode = (is_front) ? user : enviroment;

    if (currentStream) {
        console.log('CS not null');
        currentStream.getVideoTracks().forEach((camera) => {
            camera.stop();
        });
    }

    // カメラと接続する
    navigator.mediaDevices.getUserMedia(CONSTRAINTS)
        .then((stream) => {
            currentStream = stream;   // 前後の切り替え用に保持
            // <video>とStremaを接続
            video.srcObject = stream;
            video.addEventListener('loadedmetadata', function (e) {
                video.play();
            });
        })
        .catch((err) => {
            console.log(`${err.name}: ${err.message}`);
            alert("カメラとの接続時にエラーが発生しました");
        });


    var footer = document.getElementById('footer');
    footer.classList.toggle('hidden', true);
}

/**
 * @summary カメラを<video>と同期
 * @function
 * @memberof camera
 */
function cameraUnpause() {
    console.log('camera unpause');
    var cameraEl = document.getElementById('camera');
    console.log(cameraEl);

    // カメラと接続する
    navigator.mediaDevices.getUserMedia(CONSTRAINTS)
        .then((stream) => {
            currentStream = stream;   // 前後の切り替え用に保持

            // <video>とStremaを接続
            cameraEl.srcObject = stream;
            cameraEl.addEventListener('loadedmetadata', function (e) {
                cameraEl.play();
            });
        })
        .catch((err) => {
            console.log(`${err.name}: ${err.message}`);
            alert("カメラとの接続時にエラーが発生しました");
        });

    cameraEl.classList.toggle('hidden', false);
}

/**
 * @summary カメラを<video>と同期
 * @function
 * @memberof camera
 */
function cameraPause() {
    console.log('camera pause');

    if (currentStream) {
        console.log('CS not null');
        currentStream.getVideoTracks().forEach((camera) => {
            camera.stop();
        });
    }
}


function redraw() {
    var canvas = document.querySelector('canvas');
    const context = canvas.getContext("2d");

    // // 描画をリセット
    context.clearRect(0, 0, canvas.width, canvas.height);

    // // カメラ画像を描画
    context.drawImage(snap_img, 0, 0, canvas.width, canvas.height);
    context.save();

    stickers.forEach(sticker => {

        if (sticker != selected) {
            context.save();

            if (sticker.width < 1 || sticker.height < 1) {
                sticker.width = sticker_size * sticker.ratio;
                sticker.height = sticker_size * sticker.ratio;
            }
            context.translate(sticker.x, sticker.y);
            context.rotate(sticker.radian);
            context.drawImage(sticker.img, - (sticker.width / 2), - (sticker.height / 2), sticker.width, sticker.height);
            context.restore();
        }
    });

    if (addSticker == true) {
        console.log(`AddSticker: ${addSticker}`);
        addSticker = false;
    }

    // クリック座標にスタンプを描画
    // クリック座標が原点(左上)の設定になるので中心位置を補正
    // context.drawImage(sticker_img, diff.x - (size / 2), diff.y - (size / 2), size, size);

    if (selected != null || selected != undefined) {
        context.save();

        if (isDrag) {
            selected.x = diff.x;
            selected.y = diff.y;
        }

        selected.width = sticker_size * selected.ratio;
        selected.height = sticker_size * selected.ratio;
        if (selected.width < 1 || selected.height < 1) {
            selected.width = sticker_size;
            selected.height = sticker_size;
        }

        // Canvasの中心座標を移動
        context.translate(selected.x, selected.y);
        // Canvasの回転
        context.rotate(selected.radian);
        // ステッカーを描画
        context.drawImage(selected.img, - (selected.width / 2), - (selected.height / 2), selected.width, selected.height);

        // 選択対象の線描画定義開始
        context.beginPath();
        // 点線
        context.setLineDash([5, 5]);
        // 線の範囲
        context.rect(- (selected.width / 2), - (selected.height / 2), selected.width, selected.height);
        // 線の色
        context.strokeStyle = 'gray'
        // 線の太さ
        context.lineWidth = 5;
        // 線を描画
        context.stroke();

        // Canvasの座標移動と回転を戻す
        context.restore();

        // ステッカーの中心座標から端までの長さ
        var radius = Math.sqrt(Math.pow(selected.width / 2, 2) + Math.pow(selected.height / 2, 2));
        // ステッカーの角度 回転時に右下を始点としているため、45度引いて補正
        var rad = selected.radian + (45 * (Math.PI / 180));

        // ステッカーの右上を算出
        select_delete_btn.x = radius * Math.sin(rad) + selected.x;
        select_delete_btn.y = radius * -Math.cos(rad) + selected.y;
        select_delete_btn.width = select_ui_size;
        select_delete_btn.height = select_ui_size;
        // ステッカー削除ボタンの描画
        context.drawImage(select_delete_btn.img, select_delete_btn.x - (select_delete_btn.width / 2), select_delete_btn.y - (select_delete_btn.height / 2), select_delete_btn.width, select_delete_btn.height);

        // ステッカーの左下を算出
        select_resize_btn.x = (radius * Math.cos(rad)) + selected.x;
        select_resize_btn.y = radius * Math.sin(rad) + selected.y;
        select_resize_btn.width = select_ui_size;
        select_resize_btn.height = select_ui_size;
        // リザイズ、回転ボタンを描画
        context.drawImage(select_resize_btn.img, select_resize_btn.x - (select_resize_btn.width / 2), select_resize_btn.y - (select_resize_btn.height / 2), select_resize_btn.width, select_resize_btn.height);
    }
}

/**
 * @summary アクセス中のカメラをcanvas化して編集する
 * @function
 * @memberof camera
 */
function photoShoot() {
    console.log('photo shoot');

    document.getElementsByClassName('preview')[0].classList.toggle('hidden', false);
    document.getElementById('camera').classList.toggle('hidden', true);

    var video = document.getElementById('camera');
    var canvas = document.querySelector('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;


    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    snap_img = new Image(canvas.width, canvas.height);
    snap_img.src = canvas.toDataURL('image/png');

    editMode();

    var dl_btn = document.getElementById('dl_btn');
    dl_btn.addEventListener('click', function () {
        if (selected) {
            selected = null;
            redraw();
        }
        download(canvas);
    });

    var clean_btn = document.getElementById('clean_btn');
    clean_btn.addEventListener('click', function () {
        console.log('clean');

        context.drawImage(snap_img, 0, 0, canvas.width, canvas.height);
        stickers.splice(0);
    });

    var rotate = false;

    var canvas_click = (ev) => {
        console.log('tocuh start');
        var rect = ev.target.getBoundingClientRect();

        let x = ev.clientX - rect.left,
            y = ev.clientY - rect.top;

        // 表示サイズとCanvasの実サイズの比率を求める
        const scaleWidth = canvas.clientWidth / canvas.width,
            scaleHeight = canvas.clientHeight / canvas.height;

        // ブラウザ上でのクリック座標をCanvas上に変換
        var canvasX = Math.floor(x / scaleWidth),
            canvasY = Math.floor(y / scaleHeight);

        start.x = canvasX;
        start.y = canvasY;

        // タップ位置を更新
        diff.x = canvasX;
        diff.y = canvasY;

        var select = stickers.slice().reverse().find(obj => {
            var obj_x = obj.x - (obj.width / 2);
            var obj_y = obj.y - (obj.height / 2);
            var obj_right = obj_x + obj.width;
            var obj_bottom = obj_y + obj.height;

            if ((start.x <= obj_right && start.x >= obj_x) && (start.y <= obj_bottom && start.y >= obj_y)) {
                // diff.x = obj.x;
                // diff.y = obj.y;
                isDrag = true;
                return obj;
            }

            return null;
        });

        if (select == undefined || select == null) {
            if (selected) {
                console.log('selected');

                var del_btn_x = select_delete_btn.x - (select_delete_btn.width / 2);
                var del_btn_y = select_delete_btn.y - (select_delete_btn.height / 2);
                var del_right = del_btn_x + select_delete_btn.width;
                var del_bottom = del_btn_y + select_delete_btn.height;

                var resize_btn_x = select_resize_btn.x - (select_resize_btn.width / 2);
                var resize_btn_y = select_resize_btn.y - (select_resize_btn.height / 2);
                var resize_right = select_resize_btn.x + select_resize_btn.width;
                var resize_bottom = select_resize_btn.y + select_resize_btn.height;

                if ((start.x <= resize_right && start.x >= resize_btn_x)
                    && (start.y <= resize_bottom && start.y >= resize_btn_y)) {
                    console.log('resize');

                    // diff.x = selected.x;
                    // diff.y = selected.y;
                    rotate = true;

                    // var distance = Math.sqrt(canvasX - selected.x, 2) + Math.pow((canvasY - selected.y, 2));
                    // selected.ratio = Math.min(Math.max(distance / sticker_size, 1), 3);

                    redraw();
                } else if ((start.x <= del_right && start.x >= del_btn_x)
                    && (start.y <= del_bottom && start.y >= del_btn_y)) {
                    console.log('delete');
                    var index = stickers.indexOf(selected);

                    selected = null;
                    select = null;

                    rotate = false;
                    isDrag = false;

                    stickers.splice(index, 1);
                    console.log(stickers);
                    redraw();
                } else {
                    console.log("select null");
                    rotate = false;
                    isDrag = false;

                    selected = null;
                    return;
                }
            }
        } else if (select != undefined && select != selected) {
            console.log('change');
            ratio = select.ratio;
            selected = select;

            var sel_num = stickers.indexOf(selected), target;
            if (sel_num > -1) {
                target = stickers.splice(sel_num, 1);
                stickers.push(target[0]);
            }

            redraw();
        }

        redraw();
    };

    var canvas_move = (ev) => {
        // 一本指のときはスタンプ画像を指二追従させる
        var rect = ev.target.getBoundingClientRect();

        let x = ev.clientX - rect.left,
            y = ev.clientY - rect.top;

        // 表示サイズとCanvasの実サイズの比率を求める
        const scaleWidth = ev.target.clientWidth / ev.target.width,
            scaleHeight = ev.target.clientHeight / ev.target.height;

        // ブラウザ上でのクリック座標をCanvas上に変換
        var canvasX = Math.floor(x / scaleWidth),
            canvasY = Math.floor(y / scaleHeight);

        if (rotate) {
            console.log('rotate');
            isDrag = false;

            var distance = Math.sqrt(Math.pow(canvasX - selected.x, 2) + Math.pow(canvasY - selected.y, 2));
            selected.ratio = (Math.min(Math.max(distance / sticker_size, 0.5), 2)).toFixed(1);

            // 選択ステッカーからリサイズボタンの角度
            let defaultRadian = 45 * (Math.PI / 180);
            let radianCanvas = Math.atan2(canvasY - selected.y, canvasX - selected.x);
            selected.radian = radianCanvas - defaultRadian;

            redraw();
        }

        if (isDrag) {
            console.log('move');
            // タップ中はタップ位置に画像が追従する
            diff.x = canvasX;
            diff.y = canvasY;

            redraw();
        }
    };

    canvas.onpointerdown = canvas_click;
    canvas.onpointermove = canvas_move;
    // canvas.onpointerover = canvas_over;
    canvas.onpointerleave = canvas_up;
    canvas.onpointerup = canvas_up;
    canvas.onpointerout = canvas_up;

    canvas.addEventListener('pointerover', function (ev) {
        console.log("over");
        canvas_click();
    });

    canvas.addEventListener('pointerout', function (ev) {
        console.log("pointer out");
        canvas_up();
    });

    var canvas_up = (ev) => {
        console.log('tocuh end');

        end.x = diff.x;
        end.y = diff.y;

        if (selected) {
            var index = stickers.indexOf(selected);
            stickers[index].width = selected.width;
            stickers[index].height = selected.height;
            stickers[index].ratio = selected.ratio;
            stickers[index].radian = selected.radian;

            if (isDrag) {
                selected.x = end.x;
                selected.y = end.y;
                isDrag = false;
            }
        }
        onCanvas = false;
        rotate = false;

        redraw();
    };

    var document_move = (ev) => {
        if (!isDrag) { return; }
        // console.log('move');

        var x = canvas.offsetLeft,
            y = canvas.offsetTop;

        var w = canvas.offsetWidth,
            h = canvas.offsetHeight;

        var right = x + w,
            bottom = y + h;

        if (ev.clientX < right && ev.clientX > x && ev.clientY < bottom && ev.clientY > y) {
            onCanvas = true;

            // 一本指のときはスタンプ画像を指二追従させる
            var rect = canvas.getBoundingClientRect();

            let x = ev.clientX - rect.left,
                y = ev.clientY - rect.top;

            // 表示サイズとCanvasの実サイズの比率を求める
            const scaleWidth = canvas.clientWidth / canvas.width,
                scaleHeight = canvas.clientHeight / canvas.height;
            // ブラウザ上でのクリック座標をCanvas上に変換
            var canvasX = Math.floor(x / scaleWidth),
                canvasY = Math.floor(y / scaleHeight);

            diff.x = canvasX;
            diff.y = canvasY;

            redraw();
        } else if (ev.clientX > right || ev.clientX < x || ev.clientY > bottom || ev.clientY < y) {
            onCanvas = false;
        }
    }

    document.addEventListener('pointerout', document_up);
    // document.addEventListener('pointermove', document_move);
    document.getElementById('bg').addEventListener('pointerdown', canvas_click);

    var document_up = (ev) => {
        console.log('document end');
        var canvas = document.querySelector('canvas');

        // 一本指のときはスタンプ画像を指二追従させる
        var rect = canvas.getBoundingClientRect();

        let x = ev.clientX - rect.left,
            y = ev.clientY - rect.top;

        // 表示サイズとCanvasの実サイズの比率を求める
        const scaleWidth = canvas.clientWidth / canvas.width,
            scaleHeight = canvas.clientHeight / canvas.height;
        // ブラウザ上でのクリック座標をCanvas上に変換
        var canvasX = Math.floor(x / scaleWidth),
            canvasY = Math.floor(y / scaleHeight);

        end.x = canvasX;
        end.y = canvasY;

        if (selected) {
            var index = stickers.indexOf(selected);
            stickers[index].width = selected.width;
            stickers[index].height = selected.height;
            stickers[index].ratio = selected.ratio;
            stickers[index].radian = selected.radian;

            if (isDrag) {
                selected.x = end.x;
                selected.y = end.y;
                isDrag = false;
            }
        } else {
            diff.x = (canvas.x + canvas.clientWidth) / 2;
            diff.y = (canvas.y + canvas.clientHeight) / 2;
        }
        rotate = false;
        redraw();
    };
}

function initStickerView() {
    if (selected == undefined || selected == null || addSticker == true) {
        return;
    }
    console.log("sticker init");
    var canvas = document.querySelector('canvas');

    diff.x = (canvas.width) / 2;
    diff.y = (canvas.height) / 2;
    addSticker = true;

    redraw();
}

/**
 * @summary UIのセットアップ
 * @function
 * @memberof camera
 */
function setStickerUI() {
    var canvas = document.querySelector('canvas');
    var rect = canvas.getBoundingClientRect();

    var sticker_menu = document.getElementById('sticker_menu');
    var sticker_table = sticker_menu.querySelector('table');

    var num = 0;
    for (var i = 0; i < 3; i++) {
        var tr = document.createElement('tr');
        for (var j = 0; j < 5; j++) {
            num++;
            var th = document.createElement('th');
            th.textContent = `${num}`;
            th.style.fontSize = 0;

            th.style.backgroundImage = `url(./${img_file + num.toString().padStart(2, '0') + '.png'})`;

            th.addEventListener('pointerover', function (ev) {
                if (ev.isPrimary == false) { return; }
                if (addSticker == true) { return; }
                // 選択状況のスタイルを初期化
                sticker_menu.querySelectorAll('th').forEach(function (table) {
                    // table.style.border = 'none';
                    table.classList.toggle('select', false);
                });

                // 選択したものを強調表示
                ev.target.classList.toggle('select', true);
                sticker_img = new Image();
                sticker_img.src = './' + img_file + ev.target.textContent.toString().padStart(2, '0') + '.png';

                isDrag = true;

                var putSticker = setImg(sticker_img, rect.right, rect.bottom, 1);
                selected = putSticker;
                stickers.push(putSticker);
                // addSticker = true;
                // initStickerView();

            });

            th.addEventListener('pointerout', function (ev) {
                if (ev.isPrimary == false) { return; }
                if (addSticker == true) { return; }
                initStickerView();
            });

            tr.appendChild(th);
        }
        sticker_table.appendChild(tr);
    }

    sticker_menu.querySelector('th').click();
}

function setImg(img, x, y, ratio, radian = 0) {
    return {
        img: img,
        width: img.width,
        height: img.height,
        x: x,
        y: y,
        ratio: ratio,
        radian: radian,
    }
}

function getAngle(centerX, centerY, baseX, baseY, moveX, moveY) {
    const baseVec = { x: baseX - centerX, y: baseY - centerY },
        movedVec = { x: moveX - centerX, y: moveY - centerY };
    return Math.atan2(movedVec.y, movedVec.x) - Math.atan2(baseVec.y, baseVec.x);
}

/**
 * @summary canvasをpng形式でダウンロード
 * @function
 * @memberof camera
 * @param {canvas} canvas
 */
function download(canvas) {
    const yyyymmdd = new Intl.DateTimeFormat(
        undefined,
        {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }
    )

    canvas.toBlob((blob) => window.open(URL.createObjectURL(blob), "_blank"));

}

/**
 * @summary 撮影モード
 * @function
 * @memberof camera
 */
function snapMode() {
    snap_img = new Image();
    stickers.splice(0);
    stickers = [];

    document.getElementsByClassName('preview')[0].classList.toggle('hidden', true);
    document.getElementById('camera').classList.toggle('hidden', false);

    var footer = document.getElementById('footer');
    footer.classList.toggle('hidden', true);

    var btn = document.getElementById('btn');
    btn.classList.toggle('hidden', false);

    var lang = document.getElementById('menu');
    lang.classList.toggle('hidden', false);

    var retry = document.getElementById('retry');
    retry.removeEventListener('click', snapMode);

    cameraUnpause();
}

/**
 * @summary 編集モード
 * @function
 * @memberof camera
 */
function editMode() {
    document.getElementsByClassName('preview')[0].classList.toggle('hidden', false);
    document.getElementById('camera').classList.toggle('hidden', true);

    var footer = document.getElementById('footer');
    footer.classList.toggle('hidden', false);

    var btn = document.getElementById('btn');
    btn.classList.toggle('hidden', true);

    var retry = document.getElementById('retry');
    retry.addEventListener('click', snapMode);

    cameraPause();
}

/* globals ********************************************************************/

/**
 * @summary ステッカー画像
 * @type object
 * @global
 * @memberof camera
 */
var sticker_img = new Image();

/**
 * @summary カメラ画像
 * @type object
 * @global
 * @memberof camera
 */
var snap_img = new Image();

/**
 * @summary 配置ステッカー画像
 * @type object
 * @global
 * @memberof camera
 */
var stickers = [];

var selected = null;

var addSticker = false;

const delete_btn_path = './img/png/delete_button.png';
var delete_img = new Image();
var select_delete_btn = null;


const resize_btn_path = './img/png/resize_button.png';
var resize_img = new Image();
var select_resize_btn = null;

const select_ui_size = 128;

/**
 * @summary 背面カメラ設定
 * @type string
 * @global
 * @memberof camera
 */
const enviroment = { exact: "environment" };

/**
 * @summary フロントカメラ設定
 * @type string
 * @global
 * @memberof camera
 */
const user = "user";

/**
 * @summary スタンプサイズ(1:1 想定)
 * @type number
 * @global
 * @memberof camera
 */
const sticker_size = 500;

/**
 * @summary カメラ起動中か
 * @type object
 * @global
 * @memberof camera
 */
var currentStream = null;

/**
 * @summary カメラ起動中か
 * @type boolean
 * @global
 * @memberof camera
 */
let isDrag = false;

var onCanvas = false;

/**
 * @summary カメラデフォルト設定
 * @type object
 * @global
 * @memberof camera
 */
var CONSTRAINTS = {
    audio: false,
    video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },

        facingMode: enviroment,
    }
};

/**
 * @summary ユーザーのモバイルデータ取得
 * @type boolean
 * @global
 * @memberof camera
 */
const isMobile = navigator.userAgent.match(/iPhone|Android/);

const img_file = '/img/camera/';


let start = {
    x: 0,
    y: 0
};

let diff = {
    x: 0,
    y: 0
};

let end = {
    x: 0,
    y: 0
};

/* entities *******************************************************************/

window.addEventListener('load', () => {
    videoStart();
});