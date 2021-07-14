const tbody = document.querySelector('tbody');
const nodeOfPage = 15;

let Users = [];

const postData = (url, sendData, callback) => {
    const request = new XMLHttpRequest();
    request.open("POST", url, true);
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
    request.send(sendData);
}

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

const getUsers = () => {
    const query = '?get-users=true';
    getData('host.php' + query, (data) => {
        try { JSON.parse(data) }
        catch {
            console.log(data);
            return;
        }
        Users = JSON.parse(data);
        showUsers(document.querySelector('.pag__span').textContent.trim()-1);
    });
}

const showUsers = (page) => {
    tbody.textContent = '';
    console.log(Users);
    for ( let i=0; i<nodeOfPage; i++ ) {
        const user = Users[page*nodeOfPage + i];
        if ( !user ) continue;
        let access = 'Қатынау жоқ';
        if ( user.user_rights == 'read' ) access = 'Тұрақты пайдаланушы';
        if ( user.user_rights == 'full' ) access = 'Шектеусіз';
        tbody.innerHTML += `
            <tr data-id="${user.user_id}">
                <td>${user.user_name}</td>
                <td align="center">${access}</td>
                <td align="center"><input type="button" name="read" value="Көру құқығы" onclick="changeRights(this)"></td>
                <td align="center"><input type="button" name="full" value="Толық құқықтар" onclick="changeRights(this)"></td>
                <td align="center"><input type="button" name="block" value="Құқықтарды алу" onclick="changeRights(this)"></td>
            </tr>
        `;
    }
}

const pug = (btn) => {
    const action = btn.getAttribute('data-action');
    const span = btn.parentNode.querySelector('span');
    let value = span.textContent.trim();
    if ( action == 'next' ) ++value;
    else if ( value > 1 ) span.textContent = --value;
    span.textContent = value;
    showUsers(value - 1);
}

const changeRights = (btn) => {
    const tr = btn.closest('tr');
    const userId = tr.getAttribute('data-id');

    const formData = new FormData();
    formData.append('change-user-rights', true);
    formData.append('user-id', userId);
    formData.append('new-right', btn.name);

    btn.setAttribute('disabled', true);
    postData('host.php', formData, (data) => {
        btn.removeAttribute('disabled');
        try { JSON.parse(data) }
        catch {
            console.log(data);
            return;
        }
        Users = JSON.parse(data);
        showUsers(document.querySelector('.pag__span').textContent.trim()-1);
    });
}



getUsers();