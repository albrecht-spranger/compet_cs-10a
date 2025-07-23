document.addEventListener('DOMContentLoaded', () => {

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
});

// 数字を押された場合
function click_digit(event) {
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

    const result = collectInputNumbers();
    let pushed_number = 0;
    for (let i = 0; i < 10; i++) {
        pushed_number += (10 ** i) * result[i];
    }
    console.log(result);
    console.log(pushed_number);
}

// 小数点を押された場合
function click_point(event) {
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
}

// 押されている数字を返す
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
