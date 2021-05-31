const input = document.querySelector('input');
const p = document.querySelector('p');
const form = document.querySelector('form');

const readRFID = () => {
    p.classList.remove('empty');
    p.textContent = input.value;
    setTimeout(() => {
        p.classList.add('empty');
        p.textContent = 'Поднесите метку';
        input.value = '';
    }, 4000);
}

input.addEventListener('blur', () => {
    input.focus();
});

input.addEventListener('change', readRFID);