// 電卓の状態をまとめたオブジェクト
const calc_register = {
    operand1: 0.0,       // 最初の数
    operator: null,       // plus、minus、multiple、divideなど
    operand2: 0.0,       // 次の数
    result: 0.0,
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

    update_calc_console();
});

// ニクシー管の表示をUpdate
function update_nixie() {
    const nixie_digit = document.querySelectorAll('#hd_nixie .digit');
    const nixie_dot = document.querySelectorAll('#hd_nixie .dot');

    // エラー発生時
    if (calc_register.status === 'err') {
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
        let isMinus = false;
        let result_digit = parseFloat(calc_register.result);
        if (result_digit < 0) {
            result_digit = Math.abs(result_digit);
            isMinus = true;
        }

        let s = result_digit.toFixed(20);
        s = s.replace(/\.?0+$/, '');
        // let s = result_digit.toString();
        const [intPart, fracPart = ""] = s.split(".");
        // 小数部の文字の長さが小数点の位置。なければ、0
        let rounded_frac_part = "";
        if (fracPart.length > 0) {
            let frac_float = parseFloat('0.' + fracPart);
            rounded_frac_part = frac_float.toFixed(20 - intPart.length);
            // 先頭の数字および小数点を削る
            rounded_frac_part = rounded_frac_part.replace(/^\d+\./, "");
        }
        const result_dot = rounded_frac_part.length;
        s = intPart + rounded_frac_part;
        const len = s.length;
        // 数字を表示、ついでにマイナスも
        nixie_digit.forEach(elem => {
            const idx = parseInt(elem.dataset.index, 10);
            if (idx === 20 && isMinus) {
                elem.textContent = '-';
            } else if (idx >= len) {
                elem.textContent = '';
            } else {
                elem.textContent = s[len - 1 - idx];
            }
        });
        // ドットを表示
        nixie_dot.forEach(el => {
            const idx = Number(el.dataset.index);
            if (idx === result_dot) {
                el.textContent = '.';
            } else {
                el.textContent = '';
            }
        });
        return;
    }

    // 通常はキーボードを反映
    const result = collectInputNumbers();
    const pushed_point = get_pushed_point();

    // 数字のUpdate
    nixie_digit.forEach(el => {
        // 記号と上位10桁は入力されないのでクリア
        // dataset.index は文字列なので数値に変換
        const idx = Number(el.dataset.index);
        // operand2入力モードの場合、operationをニキシー管の先頭に表示
        if (idx === 20 && calc_register.status === 'ope2') {
            switch (calc_register.operator) {
                case 'plus':
                    el.textContent = '+';
                    break;
                case 'minus':
                    el.textContent = '-';
                    break;
                case 'multiple':
                    el.textContent = '×';
                    break;
                case 'divide':
                    el.textContent = '÷';
                    break;
                default:
                    el.textContent = '?';
                    break;
            }
        } else if (idx >= 10 && idx <= 20) {
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

// 押されている数字を取得、整数で返す
function get_pushed_digit() {
    const result = collectInputNumbers();
    let pushed_number = 0;
    for (let i = 0; i < 10; i++) {
        pushed_number += (10 ** i) * result[i];
    }
    return pushed_number;
}

// 押されている数字＋小数点を取得、floatで返す。
function get_pushed_number() {
    const digit = get_pushed_digit();
    const dot = get_pushed_point();
    return parseFloat(digit) * (10.0 ** (-dot));
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
    calc_register.operand1 = get_pushed_number();
    // レジスタoperationに押されたボタンを取り込み
    const btnEl = this;
    calc_register.operator = btnEl.dataset.operator;
    // ope2入力に遷移
    calc_register.status = 'ope2';

    // 数字と小数点のボタンをクリア
    clear_btn_digit_and_point();
    // 電卓のコンソールをUpdate
    update_calc_console();
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
    if (sts === 'ope1') {
        calc_register.result = pushed_number;
        calc_register.status = 'finished';
    } else if (sts === 'ope2') {
        calc_register.operand2 = pushed_number;
        // 計算する
        const sts = calculate_now();
        calc_register.status = sts;
    } else {
        // statusに想定外の値が入っていた場合
        calc_register.status = 'err';
    }
    // ニキシー管に表示する
    update_nixie();
    // ボタンをすべて戻す
    clear_btn_digit_and_point();
    // 電卓のコンソールをUpdate
    update_calc_console();
}

// CLRを押された場合のハンドラ
function click_clear(event) {
    // 電卓レジスタをすべてクリア
    reset_register();
    // 入力ボタンをすべて戻す
    clear_btn_digit_and_point();
    // 電卓のコンソールをUpdate
    update_calc_console();
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
function reset_register() {
    calc_register.operand1 = 0.0;
    calc_register.operator = null;
    calc_register.operand2 = 0.0;
    calc_register.result = 0.0;
    calc_register.status = 'ope1';
}

function calculate_now() {
    if (calc_register.status === 'err' || calc_register.status === 'finished') {
        // 計算済み、または、エラーフリーズ中は何もしない
        return;
    }
    const ope1 = parseFloat(calc_register.operand1);
    const ope2 = parseFloat(calc_register.operand2);
    let result = 0.0;
    let sts = 'finished'
    switch (calc_register.operator) {
        case 'plus':
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
                sts = 'err';
                console.log('0で割ろうとした@calculate_now()');
            } else {
                result = ope1 / ope2;
            }
            break;
        default:
            console.log('演算子に想定外の何かが入っている (' + calc_register.operator + ')@calculate_now()');
            sts = 'err';
            break;
    }
    calc_register.result = result;
    return sts;
}

function update_calc_console() {
    const el_calc_console = document.getElementById('calc_console');
    if (!el_calc_console) return;
    el_calc_console.value = `(${calc_register.status}) ${calc_register.operand1} ${calc_register.operator} ${calc_register.operand2} = ${calc_register.result}`;
}