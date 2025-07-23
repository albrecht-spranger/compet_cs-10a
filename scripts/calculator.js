document.addEventListener('DOMContentLoaded', () => {
    const el_hd_btn_digit = document.getElementById('hd_btn_digit');
    if (el_hd_btn_digit) {
        for (let i = 0; i < 10; i++){
            for (let j = 0; j < 9; j++){
                const btn = document.createElement('button');
                btn.classList.add('key');
                btn.classList.add('white');
                btn.textContent = j;
                el_hd_btn_digit.appendChild(btn);
            }
        }
    }
});
