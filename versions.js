
const tbody = document.querySelector('tbody');
const nodeOfPage = 15;
let Versions = [];

const getData = (url, callback) => {
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.addEventListener('readystatechange', () => {
        if (request.readyState !== 4) return
        if (request.status == 403) {
            location.href = 'index.php';
            return
        }
        if (request.status === 200) { callback(request.response); }
        else {
            console.error('Ошибка: ' + request.response);
            alert('Ошибка интернет-соединения');
        }
    });
    request.send();
}


const pug = (btn) => {
    const action = btn.getAttribute('data-action');
    const span = btn.parentNode.querySelector('span');
    let value = span.textContent.trim();
    if ( action == 'next' ) ++value;
    else
    if ( value > 1 ) span.textContent = --value;
}

const getVersions = (start, finish) => {
    let query = '?get-versions=true';
    if ( start && finish )
    query += '&start=' + start + '&finish=' + finish;
    getData('host.php' + query, (data) => {
        try { JSON.parse(data) }
        catch {
            console.log(data);
            return;
        }
        Versions = JSON.parse(data);
        showVersions(document.querySelector('.pag__span').textContent.trim()-1);
    });
}

const showVersions = (page) => {
    tbody.textContent = '';
    for ( let i=0; i<nodeOfPage; i++ ) {
        const version = Versions[page*nodeOfPage + i];
        if ( !version ) continue;
        const act = (version.v_actual == 1) ? 'actual-version' : '';
        tbody.innerHTML += `
            <tr id="${version.v_id}" class="${act}">
                <td>${version.user_name}</td>
                <td>${version.v_date}</td>
                <td align="center"><input type="button" name="run" value="Өзекті ету" onclick="changeVersion(this)"></td>
            </tr>
        `;
    }
}

const changeVersion = (btn) => {
    const vId = btn.closest('tr').id;
    const query = '?set-version=' + vId;
    getData('host.php' + query, (data) => {
        try { JSON.parse(data) }
        catch {
            console.log(data);
            return;
        }
        alert(JSON.parse(data)[0]);
        getVersions();
    });
}

const searchFormSubmit = (submit) => {
    submit.preventDefault();
    getVersions(
        submit.target.querySelector('input[name="start"]').value,
        submit.target.querySelector('input[name="finish"]').value,
    );
}

getVersions();