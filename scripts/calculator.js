// 電卓の状態をまとめたオブジェクト
const calc_register = {
    operand1_digit: 0,       // 最初の数
    operand1_dot: 0,       // 最初の小数点
    operator: null,       // plus、minus、multiple、divideなど
    operand2_digit: 0,       // 次の数
    operand2_dot: 0,       // 次の小数点
    result_digit: 0,
    result_dot: 0,
    status: 'ope1'    // ope1、ope2、finish、errなど
};

document.addEventListener('DOMContentLoaded', () => {
    // ニクシー管の表示
    const el_hd_nixie = document.getElementById('hd_nixie');
    if (el_hd_nixie) {
        for (let i = 20; i >= 0; i--) {
            const span_digit = document.createElement('span');
            span_digit.classList.add('digit', 'neon');
            span_digit.textContent = 'n';
            span_digit.dataset.group = 'digit';
            span_digit.dataset.index = i;
            el_hd_nixie.appendChild(span_digit);
            if (i <= 19 && i >= 1) {
                const span_dot = document.createElement('span');
                span_dot.classList.add('dot', 'neon');
                span_dot.textContent = '.';
                span_dot.dataset.group = 'dot';
                span_dot.dataset.index = i;
                el_hd_nixie.appendChild(span_dot);
            }
        }
    }

    // 数字入力ボタンを表示
    const el_hd_btn_digit = document.getElementById('hd_btn_digit');
    if (el_hd_btn_digit) {
        for (let i = 9; i >= 0; i--) {
            const div = document.createElement('div');
            div.classList.add('gr_btn_nine2one');
            for (let j = 9; j >= 1; j--) {
                const btn = document.createElement('button');
                btn.classList.add('key');
                if (i % 6 < 3) {
                    btn.classList.add('white');
                } else {
                    btn.classList.add('black');
                }
                btn.textContent = j;
                btn.dataset.group = i;
                btn.dataset.index = j;

                // クリック時の処理もここで登録
                btn.addEventListener('click', click_digit);
                div.appendChild(btn);
            }
            el_hd_btn_digit.appendChild(div);
        }
    }

    // 小数点入力ボタンを表示
    const el_hd_btn_point = document.getElementById('hd_btn_point');
    if (el_hd_btn_point) {
        for (let i = 9; i >= 1; i--) {
            const btn = document.createElement('button');
            btn.classList.add('point_key');
            btn.classList.add('white');
            btn.textContent = i;
            btn.dataset.index = i;

            // クリック時の処理もここで登録
            btn.addEventListener('click', click_point);
            el_hd_btn_point.appendChild(btn);
        }
    }

    // 演算ボタンにハンドラを登録
    const el_btn_divide = document.getElementById('btn_divide');
    el_btn_divide.addEventListener('click', click_opoerator);
    const el_btn_multiple = document.getElementById('btn_multiple');
    el_btn_multiple.addEventListener('click', click_opoerator);
    const el_btn_minus = document.getElementById('btn_minus');
    el_btn_minus.addEventListener('click', click_opoerator);
    const el_btn_plus = document.getElementById('btn_plus');
    el_btn_plus.addEventListener('click', click_opoerator);
    const el_btn_enter = document.getElementById('btn_enter');
    el_btn_enter.addEventListener('click', click_enter);
    const el_btn_clear = document.getElementById('btn_clear');
    el_btn_clear.addEventListener('click', click_clear);

    // ニクシー管をUpdate
    update_nixie();
});

// ニクシー管の表示をUpdate
function update_nixie() {
    // エラー発生時
    if (calc_register.status === 'err') {
        const nixie_digit = document.querySelectorAll('#hd_nixie .digit');
        nixie_digit.forEach(el => {
            const idx = Number(el.dataset.index);
            if (idx === 0 || idx === 1) {
                el.textContent = 'R';
            } else if (idx === 2) {
                el.textContent = 'E';
            } else {
                el.textContent = '';
            }
        });
        return;
    }

    // 結果表示
    if (calc_register.status === 'finished') {
        const nixie_digit = document.querySelectorAll('#hd_nixie .digit');
        const nixie_dot = document.querySelectorAll('#hd_nixie .dot');
        let isMinus = false;
        const result_digit = calc_register.result_digit;
        if (result_digit < 0) {
            result_digit = Math.abs(result_digit);
            isMinus = true;
        }
        const s = String(result_digit);
        const len = s.length;
        if (len > 20) {
            calc_register.status = 'err';
            update_nixie();
            return;
        }
        // 数字を表示、ついでにマイナスも
        nixie_digit.forEach(elem => {
            const idx = parseInt(elem.dataset.index, 10);
            let digit = '';
            if (idx === 20 && isMinus) {
                elem.textContent = '－';
            } else if (idx >= len) {
                elem.textContent = '';
            } else {
                elem.textContent = s[len - 1 - idx];
            }
        });
        // ドットを表示
        nixie_dot.forEach(el => {
            const idx = Number(el.dataset.index);
            if (idx === calc_register.result_dot) {
                el.textContent = '.';
            } else {
                el.textContent = '';
            }
        });
        return;
    }

    // 通常はボタンを反映
    const result = collectInputNumbers();
    const pushed_point = get_pushed_point();
    const nixie_digit = document.querySelectorAll('#hd_nixie .digit');
    const nixie_dot = document.querySelectorAll('#hd_nixie .dot');

    // 数字のUpdate
    nixie_digit.forEach(el => {
        // 記号と上位10桁は入力されないのでクリア
        // dataset.index は文字列なので数値に変換
        const idx = Number(el.dataset.index);
        if (idx >= 10 && idx <= 20) {
            // テキストをクリア
            el.textContent = '';
        } else if (idx >= 0 && idx < 10) {
            el.textContent = result[idx];
        }
    });

    // 小数点のUpdate
    nixie_dot.forEach(el => {
        const idx = Number(el.dataset.index);
        if (idx === pushed_point) {
            el.textContent = '.';
        } else {
            el.textContent = '';
        }
    });
}

// 数字を押された場合のハンドラ
function click_digit(event) {
    if (calc_register.status === 'err' || calc_register.status === 'finished') {
        // 演算完了、または、エラー状態では無視
        return;
    }

    const btnEl = this;
    if (btnEl.classList.contains('pushed')) {
        // 押されているなら外す
        btnEl.classList.remove('pushed');
    } else {
        const parent = btnEl.parentElement;
        // 押されていないなら兄弟から全部外して、自分にだけ付ける
        Array.from(parent.children).forEach(sib => sib.classList.remove('pushed'));
        btnEl.classList.add('pushed');
    }

    // ニクシー管をUpdate
    update_nixie();
}

// 小数点を押された場合のハンドラ
function click_point(event) {
    if (calc_register.status === 'err' || calc_register.status === 'finished') {
        // 演算完了、または、エラー状態では無視
        return;
    }

    const btnEl = this;
    if (btnEl.classList.contains('pushed')) {
        // 押されているなら外す
        btnEl.classList.remove('pushed');
    } else {
        const parent = btnEl.parentElement;
        // 押されていないなら兄弟から全部外して、自分にだけ付ける
        Array.from(parent.children).forEach(sib => sib.classList.remove('pushed'));
        btnEl.classList.add('pushed');
    }

    // ニクシー管をUpdate
    update_nixie();
}

// 押されている数字を画面から取得
function get_pushed_number() {
    const result = collectInputNumbers();
    let pushed_number = 0;
    for (let i = 0; i < 10; i++) {
        pushed_number += (10 ** i) * result[i];
    }
    return pushed_number;
}

// 押されている数字を配列で返す
function collectInputNumbers() {
    // グループ数分＋安全マージンで初期化（0：未押下を表す）
    const input_number = new Array(10).fill(0);

    // 親要素の全ボタンを取得
    const buttons = document.querySelectorAll('#hd_btn_digit button');

    buttons.forEach(btn => {
        if (btn.classList.contains('pushed')) {
            // dataset から数値化
            const g = parseInt(btn.dataset.group, 10);
            const i = parseInt(btn.dataset.index, 10);
            input_number[g] = i;
        }
    });

    return input_number;
}

// 押されている小数点の位置を返す
function get_pushed_point() {
    const container = document.getElementById('hd_btn_point');
    // ボタン全体から pushed が付いている最初の1つを取得
    const firstPushed = container.querySelector('button.pushed');
    console.log(firstPushed);  // HTMLButtonElement または null
    if (!firstPushed) {
        return 0;
    }
    return parseInt(firstPushed.dataset.index, 10);
}

// ＋、－、×、÷を押された場合のハンドラ
function click_opoerator(event) {
    const sts = calc_register.status;
    if (sts === 'ope2' || sts === 'finished' || sts === 'err') {
        // operand1入力以外の状態では無視
        return;
    }

    // レジスタope1にボタンを取り込み
    calc_register.operand1_digit = get_pushed_number();
    calc_register.operand1_dot = get_pushed_point();
    const btnEl = this;
    // レジスタoperationに押されたボタンを取り込み
    calc_register.operator = btnEl.dataset.operator;
    // ope2入力に遷移
    calc_register.status = 'ope2';

    // 数字と小数点のボタンをクリア
    clear_btn_digit_and_point();
    // 電卓のコンソールをUpdate
    // update_calcurator_console();

    // ニクシー管をUpdate
    update_nixie();
}

// ＝を押された場合のハンドラ
function click_enter(event) {
    const sts = calc_register.status;
    if (sts === 'err' || sts === 'finished') {
        // 演算終了、または、エラーなら、何もしない
        return;
    }
    const pushed_number = get_pushed_number();
    const pushed_point = get_pushed_point();
    if (sts === 'ope1') {
        calc_register.result_digit = pushed_number;
        calc_register.result_dot = pushed_point;
        // ニキシー管に表示する
        clear_btn_digit_and_point();
        // 電卓のコンソールをUpdate
        calc_register.status = 'finished';
    } else if (sts === 'ope2') {
        calc_register.operand2_digit = pushed_number;
        calc_register.operand2_dot = pushed_point;
        // 計算する
        // ニキシー管に表示する
        clear_btn_digit_and_point();
        // 電卓のコンソールをUpdate
        calc_register.status = 'finished';
    } else {
        // statusに想定外の値が入っていた場合
        calc_register.status = 'err';
    }
}

// CLRを押された場合のハンドラ
function click_clear(event) {
    clear_register();

    // 入力ボタンをすべて戻す
    clear_btn_digit_and_point();
    // 電卓のコンソールをUpdate
    // update_calcurator_console();

    // ニクシー管をUpdate
    update_nixie();
}

// 数字と小数点のボタンをすべてクリア
function clear_btn_digit_and_point() {
    // 数字ボタンのクリア
    const el_hd_btn_digit = document.getElementById('hd_btn_digit');
    if (el_hd_btn_digit) {
        // #hd_btn_digit 以下の button 要素のうち、.pushed が付いているものをすべて取得
        const pushedButtons = el_hd_btn_digit.querySelectorAll('button.pushed');
        // 1つずつ回してクラスを外す
        pushedButtons.forEach(btn => btn.classList.remove('pushed'));
    }

    // 小数点ボタンのクリア
    const el_hd_btn_point = document.getElementById('hd_btn_point');
    if (el_hd_btn_point) {
        // #hd_btn_point 以下の button 要素のうち、.pushed が付いているものをすべて取得
        const pushedButtons = el_hd_btn_point.querySelectorAll('button.pushed');
        // 1つずつ回してクラスを外す
        pushedButtons.forEach(btn => btn.classList.remove('pushed'));
    }
}

// 内部レジスタをすべてクリア
function clear_register() {
    calc_register.operand1_digit = 0;
    calc_register.operand1_dot = 0;
    calc_register.operator = null;
    calc_register.operand2_digit = 0;
    calc_register.operand2_dot = 0;
    calc_register.result_digit = 0;
    calc_register.result_dot = 0;
    calc_register.status = 'ope1';
}

function calculate_now() {
    if (calc_register.error || calc_register.result) {
        // 計算済み、または、エラーフリーズ中は何もしない
        return;
    }
    const ope1 = parseInt(calc_register.operand1_digit, 10);
    const dot1 = parseInt(calc_register.operand1_dot, 10);
    const ope2 = parseInt(calc_register.operand2_digit, 10);
    const dot2 = parseInt(calc_register.operand2_dot, 10);
    switch (calc_register.operator) {
        case 'plus':
            if (dot1>dot2) {
                
            }
            result = ope1 + ope2;
            break;
        case 'minus':
            result = ope1 - ope2;
            break;
        case 'multiple':
            result = ope1 * ope2;
            break;
        case 'divide':
            if (ope2 === 0) {
                calc_register.error = true;
                console.log('0で割ろうとした@calculate_now()');
            } else {
                result = ope1 / ope2;
            }
            break;
        default:
            console.log('演算子に想定外の何かが入っている (' + calc_register.operator + ')@calculate_now()');
            calc_register.error = true;
            break;
    }
    calc_register.result = result;
}
