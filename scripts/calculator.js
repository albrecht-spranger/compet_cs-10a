// 電卓の状態をまとめたオブジェクト
const calc_register = {
    operand1_digit: 0,       // 最初の数
    operand1_dot: 0,       // 最初の小数点
    operator: null,       // plus、minus、multiple、divideなど
    operand2_digit: 0,       // 次の数
    operand2_dot: 0,       // 次の小数点
    result_digit: 0,
    result_dot: 0,
    status: ope1    // ope1、ope2、finish、errなど
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
    if (calc_register.error) {
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

    // 正常時
    const result = collectInputNumbers();
    let pushed_number = 0;
    for (let i = 0; i < 10; i++) {
        pushed_number += (10 ** i) * result[i];
    }

    const pushed_point = get_pushed_point();
    // べき乗を使うと非常に小さい小数でずれるので回数分だけ10で割る
    for (let i = 0; i < pushed_point; i++) {
        pushed_number /= 10;
    }

    console.log(result);
    console.log(pushed_number);

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
    if (calc_register.error) {
        // エラー状態ではフリーズ
        return;
    }
    if (calc_register.result) {
        // 結果が入っていたら、すべてクリア
        clear_register();
    }

    const btnEl = this;

    // dataset は文字列なので必要なら parseInt() してください
    const groupNum = parseInt(btnEl.dataset.group, 10);
    const idxNum = parseInt(btnEl.dataset.index, 10);
    console.log(`グループ ${groupNum} の 通番 ${idxNum} がクリックされました！`);

    const parent = btnEl.parentElement;

    if (btnEl.classList.contains('pushed')) {
        // 押されているなら外す
        btnEl.classList.remove('pushed');
    } else {
        // 押されていないなら兄弟から全部外して、自分にだけ付ける
        Array.from(parent.children).forEach(sib => sib.classList.remove('pushed'));
        btnEl.classList.add('pushed');
    }

    // ニクシー管をUpdate
    update_nixie();

    // 内部レジスタをUpdate
    update_register();
}

// 小数点を押された場合のハンドラ
function click_point(event) {
    if (calc_register.error) {
        // エラー状態ではフリーズ
        return;
    }
    if (calc_register.result) {
        // 結果が入っていたら、すべてクリア
        clear_register();
    }

    const btnEl = this;

    // dataset は文字列なので必要なら parseInt() してください
    const idxNum = parseInt(btnEl.dataset.index, 10);
    console.log(`通番 ${idxNum} の小数点がクリックされました！`);

    const parent = btnEl.parentElement;

    if (btnEl.classList.contains('pushed')) {
        // 押されているなら外す
        btnEl.classList.remove('pushed');
    } else {
        // 押されていないなら兄弟から全部外して、自分にだけ付ける
        Array.from(parent.children).forEach(sib => sib.classList.remove('pushed'));
        btnEl.classList.add('pushed');
    }
    // ニクシー管をUpdate
    update_nixie();

    // 内部レジスタをUpdate
    update_register();
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

// 内部レジスタを更新
function update_register() {
    if (calc_register.error || calc_register.result) {
        return;
    } else if (calc_register.operator) {
        calc_register.operand2_digit = get_pushed_number();
        calc_register.operand2_dot = get_pushed_point();
    } else {
        calc_register.operand1_digit = get_pushed_number();
        calc_register.operand1_dot = get_pushed_point();
    }

    const el = document.getElementById('calculator_console');
    if (el) {
        // ssssss
    }
}

// ＋、－、×、÷を押された場合のハンドラ
function click_opoerator(event) {
    const btnEl = this;
    const op = btnEl.dataset.value;
    const pushed_number = get_pushed_number();
    const pushed_point = get_pushed_point();
    const el_calculator_console = document.getElementById('calculator_console');

    if (calc_register.operand2_digit) {
        // 2つの数字が入力された状態で演算子が押された
        // 1．計算する
        // 2．結果をoperand1に入れる
        // 3．operatorに演算子を入れる
        // 4．operand2をnullに
        // 5．入力ボタンをすべて戻す
    } else if (calc_register.operator) {
        // 1つ目の数字と演算子が押された状態で、再び、演算子が押された
        // operatorを上書き
        calc_register.operator = op;
    } else if (calc_register.operand1_digit) {
        // 1つ目の数字が押された状態で演算子が押された
        // operand1はUpdate済みのはずなので更新しない
        // operatorを保存
        calc_register.operator = op;
        // 入力ボタンをすべて戻す
    } else {
        // 1つ目の数字が入力されていない状態で演算子が押された
        // ⇒1つ目の数字は0とみなす
        calc_register.operand1_digit = 0;
        calc_register.operand1_dot = 0;
        calc_register.operator = op;
    }
    // 電卓のコンソールをUpdate
    // update_calcurator_console();

    // ニクシー管をUpdate
    update_nixie();
}

// ＝を押された場合のハンドラ
function click_enter(event) {
    const btnEl = this;
    const op = btnEl.dataset.value;
    const pushed_number = get_pushed_number();
    const pushed_point = get_pushed_point();
    const el_calculator_console = document.getElementById('calculator_console');

    calc_register.error = true;

    if (calc_register.error) {
        // エラー発生によりフリーズ中の場合
        console.log('エラーでフリーズ中');
    } else if (calc_register.result) {
        // 計算結果が入っている場合
        console.log('計算済み');
    } else if (calc_register.operand2_digit) {
        // 2つ目の数字まで入力されている
        if (parseInt(calc_register.operand2_digit, 10) === 0 && calc_register.operator == 'divide') {
            // 2つ目の数字が0、かつ、演算子が÷
            calc_register.error = true;
        } else {
            calculate_now();
        }
    } else if (calc_register.operator) {
        // 1つ目の数字と演算子が押された状態で＝が押された
        // operand2は0とみなす
        calc_register.operand2_digit = 0;
        calc_register.operand2_dot = 0;
        calculate_now();
    } else if (calc_register.operand1_digit) {
        // 1つ目の数字が押された状態で＝が押された
        // ⇒演算子は＋、2つ目の数字は0とみなす
        calc_register.operator = 'plus';
        calc_register.operand2_digit = 0;
        calc_register.operand2_dot = 0;
        // 計算する
    } else {
        // 1つ目の数字が入力されていない状態で演算子が押された
        // ⇒1つ目、2つ目の数字は0、演算子は＋とみなす
        calc_register.operand1_digit = 0;
        calc_register.operand1_dot = 0;
        calc_register.operator = 'plus';
        calc_register.operand2_digit = 0;
        calc_register.operand2_dot = 0;
        // 計算する
    }
    // 5．入力ボタンをすべて戻す
    // 電卓のコンソールをUpdate
    // update_calcurator_console();

    // ニクシー管をUpdate
    update_nixie();
}

// CLRを押された場合のハンドラ
function click_clear(event) {
    const btnEl = this;
    const op = btnEl.dataset.value;

    clear_register();

    // 5．入力ボタンをすべて戻す
    // 電卓のコンソールをUpdate
    // update_calcurator_console();

    // ニクシー管をUpdate
    update_nixie();
}

// 内部レジスタをすべてクリア
function clear_register() {
    calc_register.operand1_digit = null;
    calc_register.operand1_dot = null;
    calc_register.operator = null;
    calc_register.operand2_digit = null;
    calc_register.operand2_dot = null;
    calc_register.result = null;
    calc_register.error = false;
}

function calculate_now() {
    if (calc_register.error || calc_register.result) {
        // 計算済み、または、エラーフリーズ中は何もしない
        return;
    }
    const ope1 = parseFloat(calc_register.operand1_digit) * (10 ** (-parseFloat(calc_register.operand1_dot)));
    const ope2 = parseFloat(calc_register.operand2_digit) * (10 ** (-parseFloat(calc_register.operand2_dot)));
    let result = 0.0;
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
