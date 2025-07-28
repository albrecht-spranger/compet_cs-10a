// 電卓の状態をまとめたオブジェクト
const calc_register = {
    operand1: { value: 0n, dot: 0 },       // 最初の数
    operator: null,       // plus、subtract、multiply、divideなど
    operand2: { value: 0n, dot: 0 },       // 次の数
    result: { value: 0n, dot: 0 },
    status: 'ope1'    // ope1、ope2、finish、err
};

let nixie_digit;
let nixie_dot;

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
    nixie_digit = document.querySelectorAll('#hd_nixie .digit');
    nixie_dot = document.querySelectorAll('#hd_nixie .dot');

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
    const el_btn_multiply = document.getElementById('btn_multiply');
    el_btn_multiply.addEventListener('click', click_opoerator);
    const el_btn_subtract = document.getElementById('btn_subtract');
    el_btn_subtract.addEventListener('click', click_opoerator);
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
    // const nixie_digit = document.querySelectorAll('#hd_nixie .digit');
    // const nixie_dot = document.querySelectorAll('#hd_nixie .dot');

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
        update_nixie_finished();
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
                case 'subtract':
                    el.textContent = '-';
                    break;
                case 'multiply':
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

// 計算結果をニクシー管に表示
function update_nixie_finished() {
    // 負の数のチェック
    let isMinus = false;
    let result_digit = calc_register.result.value;
    let result_dot = calc_register.result.dot;
    if (result_digit < 0n) {
        result_digit = -result_digit;
        isMinus = true;
    }

    let s = result_digit.toString();
    let len = s.length;
    if (len <= result_dot) {
        // 答えが1未満のため、0パディングが必要な場合
        // パディングする0の数(1の位の0を含む)
        const num_padding = result_dot - len + 1;
        // 削りたい桁数
        const deleting_digit = len + num_padding - 20;
        let result_digit_rounded = result_digit;
        if (deleting_digit > 0) {
            // num_digit 桁だけ「右に小数点を動かす」には
            // 10n の num_digit 乗で割る。
            const factor = 10n ** BigInt(deleting_digit);
            const half = factor / 2n;
            result_digit_rounded = (result_digit_rounded + half) / factor;
            result_dot -= deleting_digit;
            ({
                value: result_digit_rounded,
                dot: result_dot
            } = normalize({
                value: result_digit_rounded,
                dot: result_dot
            }));
        }
        s = result_digit_rounded.toString();
        s = s.padStart(result_dot + 1, '0');
    } else {
        // 答えが1以上の場合
        const deleting_digit = len - 20;
        let result_digit_rounded = result_digit;
        if (deleting_digit > 0) {
            const factor = 10n ** BigInt(deleting_digit);
            const half = factor / 2n;
            result_digit_rounded = (result_digit_rounded + half) / factor;
            result_dot -= deleting_digit;
            ({
                value: result_digit_rounded,
                dot: result_dot
            } = normalize({
                value: result_digit_rounded,
                dot: result_dot
            }));
        }
        s = result_digit_rounded.toString();
    }
    // 20桁を超えていたら、20桁で切り捨て
    len = s.length;
    if (len > 20) {
        result_dot -= (len - 20);
        s = s.slice(0, 20);
        len = s.length;
    }

    // 数字を表示、ついでにマイナスも
    nixie_digit.forEach(elem => {
        const idx = parseInt(elem.dataset.index, 10);
        if (idx === 20) {
            // 記号部
            if (isMinus) {
                elem.textContent = '-';
            } else {
                elem.textContent = '';
            }
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
    if (!firstPushed) {
        return 0;
    }
    return parseInt(firstPushed.dataset.index, 10);
}

// ＋、－、×、÷を押された場合のハンドラ
function click_opoerator(event) {
    const sts = calc_register.status;
    if (sts === 'finished' || sts === 'err') {
        return;
    }
    if (sts === 'ope2') {
        // 演算の種類を変える
        // レジスタoperationに押されたボタンを取り込み
        const btnEl = this;
        calc_register.operator = btnEl.dataset.operator;
    } else if (sts === 'ope1') {
        // レジスタope1にボタンを取り込み
        calc_register.operand1.value = get_pushed_digit();
        calc_register.operand1.dot = get_pushed_point();
        // レジスタoperationに押されたボタンを取り込み
        const btnEl = this;
        calc_register.operator = btnEl.dataset.operator;
        // ope2入力に遷移
        calc_register.status = 'ope2';
        // 数字と小数点のボタンをクリア
        clear_btn_digit_and_point();
    } else {
        // ステータスがおかしい
        calc_register.status = 'err';
        // 数字と小数点のボタンをクリア
        clear_btn_digit_and_point();
    }
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
    if (sts === 'ope1') {
        calc_register.result.value = get_pushed_digit();
        calc_register.result.dot = get_pushed_point();
        calc_register.status = 'finished';
    } else if (sts === 'ope2') {
        calc_register.operand2.value = get_pushed_digit();
        calc_register.operand2.dot = get_pushed_point();
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
    calc_register.operand1.value = 0n;
    calc_register.operand1.dot = 0;
    calc_register.operator = null;
    calc_register.operand2.value = 0n;
    calc_register.operand2.dot = 0;
    calc_register.result.value = 0n;
    calc_register.result.dot = 0;
    calc_register.status = 'ope1';
}

// calc_registerの値を使って演算
// statusがope2の場合しかコールされない
function calculate_now() {
    if (calc_register.status !== 'ope2') return;

    let sts = 'finished';
    let aligned_numbers;
    switch (calc_register.operator) {
        case 'plus':
            aligned_numbers = align(calc_register.operand1, calc_register.operand2);
            calc_register.result = normalize({
                value: aligned_numbers.aInt + aligned_numbers.bInt,
                dot: aligned_numbers.scale
            });
            break;
        case 'subtract':
            aligned_numbers = align(calc_register.operand1, calc_register.operand2);
            calc_register.result = normalize({
                value: aligned_numbers.aInt - aligned_numbers.bInt,
                dot: aligned_numbers.scale
            });
            break;
        case 'multiply':
            const v = BigInt(calc_register.operand1.value) * BigInt(calc_register.operand2.value);
            const s = calc_register.operand1.dot + calc_register.operand2.dot;
            calc_register.result = normalize({
                value: v,
                dot: s
            });
            break;
        case 'divide':
            let aInt = normalize(calc_register.operand1);
            let bInt = normalize(calc_register.operand2);
            calc_register.result = normalize({
                value: (aInt.value * (10n ** 21n)) / bInt.value,
                dot: 21 - bInt.dot
                // dot: fact - 1 - bInt.dot
            });
            break;
        default:
            console.log('演算子に想定外の何かが入っている (' + calc_register.operator + ')@calculate_now()');
            sts = 'err';
            break;
    }
    return sts;
}

// 正規化（末尾ゼロ詰め／整数化）
function normalize({ value, dot }) {
    let v = typeof value === "bigint" ? value : BigInt(value);
    if (v === 0n) return { value: 0n, dot: 0 };

    while (dot > 0 && v % 10n === 0n) {
        v /= 10n;
        dot--;
    }
    return { value: v, dot };
}

// 加減算のための桁数揃え
function align(a, b) {
    const maxDot = Math.max(a.dot, b.dot);
    const aInt = BigInt(a.value) * 10n ** BigInt(maxDot - a.dot);
    const bInt = BigInt(b.value) * 10n ** BigInt(maxDot - b.dot);
    return { aInt, bInt, scale: maxDot };
}

// 電卓コンソールへのレジスタ表示
function update_calc_console() {
    const el_calc_console = document.getElementById('calc_console');
    if (!el_calc_console) return;
    el_calc_console.value = `(${calc_register.status}) ${calc_register.operand1.value}:${calc_register.operand1.dot} ${calc_register.operator} ${calc_register.operand2.value}:${calc_register.operand2.dot} = ${calc_register.result.value}:${calc_register.result.dot}`;
}