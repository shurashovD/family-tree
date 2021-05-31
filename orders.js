const tbody = document.querySelector('tbody');
const nodeOfPage = 15;

let Orders = [];

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

const getOrders = () => {
    const query = '?get-orders=true';
    getData('host.php' + query, (data) => {
        try { JSON.parse(data) }
        catch {
            console.log(data);
            return;
        }
        Orders = JSON.parse(data);
        showOrders(document.querySelector('.pag__span').textContent.trim()-1);
    });
}

const showOrders = (page) => {
    tbody.textContent = '';
    for ( let i=0; i<nodeOfPage; i++ ) {
        const order = Orders[page*nodeOfPage + i];
        if ( !order ) continue;
        const addit = (order.addit == 1) ? 'checked' : '';
        const edit = (order.edit == 1) ? 'checked' : '';
        const del = (order.del == 1) ? 'checked' : '';
        const view = (order.viewed != 1) ? '' : 'new-order';
        tbody.innerHTML += `
            <tr data-id="${order.order_id}" class="${view}">
                <td>${order.user_name}</td>
                <td>${order.order_phone}</td>
                <td>${order.order_date}</td>
                <td>${order.name} және оның барлық ұрпақтары</td>
                <td align="center"><input type="checkbox" name="addit" ${addit}></td>
                <td align="center"><input type="checkbox" name="edit" ${edit}></td>
                <td align="center"><input type="checkbox" name="del" ${del}></td>
                <td align="center"><input type="button" name="run" value="Қолдану" onclick="changeRights(this)"></td>
                <td align="center"><input type="button" name="run" value="Өшіру" onclick="delRecord(this)"></td>
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
    showOrders(value - 1);
}

const changeRights = (btn) => {
    const tr = btn.closest('tr');
    const orderId = tr.getAttribute('data-id');
    const formData = new FormData();
    formData.append('update-order', orderId);
    tr.querySelectorAll('input[type="checkbox"]').forEach(element => {
        formData.append(element.name, (element.checked) ? 1:0);
    });
    postData('host.php', formData, (data) => {
        try { JSON.parse(data) }
        catch {
            console.log(data);
            return;
        }
        const msgFromSrv = JSON.parse(data);
        getOrders();
    });
}

const delRecord = btn => {
    const tr = btn.closest('tr');
    const orderId = tr.getAttribute('data-id');
    const formData = new FormData();
    formData.append('delete-order', orderId);
    postData('host.php', formData, (data) => {
        try { JSON.parse(data) }
        catch {
            console.log(data);
            return;
        }
        const msgFromSrv = JSON.parse(data);
        getOrders();
    });
}



getOrders();