const main = document.querySelector('main');
const area = document.querySelector('.area');
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('.overlay');
const addForm = document.getElementById('add-pop-up');
const infoPopUp = document.getElementById('info-pop-up');
const additInfoForm = document.getElementById('addit-info-pop-up');
const footer = document.querySelector('footer');
const mMenuBtn = document.querySelector('.mobile-menu');
const searchDropdownList = document.querySelector('.pop-up-dropdown-list');
const counterSpan = document.querySelector('.counter');

let touches = [];
let move = false;

let scale = {
    originX: null, originY: null, translateX: 0, translateY: 0, value: 1
}

const Touches = {};

const mouseDown = 'mousedown';
const mouseMove = 'mousemove';
const mouseUp = 'mouseup';

const openCards = new Set();

const showedCards = new Set();

let currentAddCardId = -1;

let activeCardId = null;

let TREE = [];

let Rights = [];

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

const animate = (time, duration, draw) => {
    requestAnimationFrame(() => {
        let timeFraction = (performance.now() - time)/duration;
        if ( timeFraction > 1 ) timeFraction = 1;
        draw(timeFraction);
        if ( timeFraction == 1 )  return;
        animate(time, duration, draw);
    });
}

const showPopUp = (selector) => {
    const popup = document.querySelector(selector);
    overlay.childNodes.forEach(node => {
        if ( 'style' in node ) {
            node.style.transform = 'scaleY(0)';
            node.style.display = 'none';
        }
    });
    overlay.style.display = 'flex';
    popup.style.display = 'flex';
    animate(performance.now(), 60, (progress) => {
        popup.style.transform = 'scaleY(' + progress + ')';
    });
}

const hidePopUp = (btn) => {
    const promise = new Promise(resolve => {
        animate(performance.now(), 60, (progress) => {
            popup.style.transform = 'scaleY(' + (1 - progress) + ')';
            if ( progress == 1 ) {
                overlay.style.display = 'none';
                if (popup.querySelector('input[type="submit"]'))
                popup.querySelector('input[type="submit"]').removeAttribute('disabled');
                resolve();
            }
        });
    });
    const popup = btn.closest('.pop-up');
    
    popup.querySelectorAll('input[type="text"]').forEach(input => input.value = '');
    popup.removeAttribute('data-action');
    if ( popup.id == 'add-pop-up' ) {
        const formRows = Array.from(addForm.getElementsByClassName('pop-up-row'));
        for (let i=1; i<formRows.length-1; i++) {
            formRows[i].remove();
        }
        const formLabels = Array.from(addForm.getElementsByClassName('pop-up-label'));
        for (let i=1; i<formLabels.length; i++) {
            formLabels[i].remove();
        }
    }
    if ( popup.querySelector('input[type="file"]') ) {
        popup.querySelector('input[type="file"]').value = null;
    }
    return promise;
}

const showHideMobileMenu = (btn) => {
    console.log(123);
    if ( btn.hasAttribute('data-show') ) {
        btn.removeAttribute('data-show');
        animate(performance.now(), 400, (progress) => {
            footer.style.right = parseInt((-progress)*footer.offsetWidth) + 'px';
        });
    }
    else {
        btn.setAttribute('data-show', true);
        animate(performance.now(), 200, (progress) => {
            footer.style.right = parseInt((progress-1)*footer.offsetWidth) + 'px';
        });
    }
}

const canvasResize = () => {
    canvas.width = area.offsetWidth;
    canvas.height = area.offsetHeight;
    if ( 'ontouchstart' in window ) {
        main.style.width = screen.availWidth + 'px';
        main.style.height = screen.availHeight + 'px';
    }
}

const renderCanvas = async () => {
    canvasResize();

    ctx.fillStyle = '#fff6d4';
    ctx.strokeStyle = '#303030';
    ctx.lineWidth = 4;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fill();

    const cubicBezier = (p0, p1, p2, p3) => {
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.moveTo(p3.x, p3.y);
    }

    let i = 0;
    const cards = [];
    area.querySelectorAll('.card').forEach(item => {
        if ( item.offsetWidth != 0 ) cards.push(item);
    });
    ctx.beginPath();
    cards.forEach(card => {
        const parentId = card.getAttribute('data-parent-id');
        if ( parentId != '-1' ) {
            const parentCard = area.querySelector('div[data-id="' + parentId + '"]');
            const P0 = {
                x: (parentCard.offsetLeft + parentCard.offsetWidth),
                y: (parentCard.offsetTop + parseInt(parentCard.offsetHeight/2))
            };
            const P3 = {
                x: (card.offsetLeft),
                y: (card.offsetTop + parseInt(card.offsetHeight/2))
            };
            const P1 = { x: (P0.x + 20), y: P0.y };
            const P2 = { x: (P3.x - 20), y: P3.y };
            cubicBezier(P0, P1, P2, P3);
        }
        i++;
    });
    ctx.closePath();
    ctx.stroke();
}

const areaMouseDown = (mousedown) => {
    let preX = mousedown.clientX;
    let preY = mousedown.clientY;
    
    const areaMouseMove = (mousemove) => {
        let newX = mousemove.clientX;
        let newY = mousemove.clientY;
        const dX = newX - preX;
        const dY = newY - preY;
        preX = newX;
        preY = newY;
        area.style.left = area.offsetLeft + dX + 'px';
        area.style.top = area.offsetTop + dY + 'px';
        canvas.style.left = area.offsetLeft + dX + 'px';
        canvas.style.top = area.offsetTop + dY + 'px';
    }

    const areaMouseUp = (mouseup) => {
        removeEventListener(mouseMove, areaMouseMove);
    }

    addEventListener(mouseMove, areaMouseMove);
    addEventListener(mouseUp, areaMouseUp);
}

const areaZoom = (wheel) => {
    wheel.preventDefault();
    const multy = ( Math.sign(wheel.deltaY) == 1 ) ? 0.95 : 1.05;

    if ( !scale.originX && !scale.originY ) {
        scale.originX = wheel.clientX - area.offsetLeft;
        scale.originY = wheel.clientY - area.offsetTop;
    }
    else {
        const posInScaleObjX = wheel.clientX - area.offsetLeft + (scale.value-1)*scale.originX;
        const posInScaleObjY = wheel.clientY - area.offsetTop + (scale.value-1)*scale.originY;

        const relPosInScaleObjX = posInScaleObjX / (area.offsetWidth * scale.value);
        const relPosInScaleObjY = posInScaleObjY / (area.offsetHeight * scale.value);

        const newOriginX = parseInt(area.offsetWidth * relPosInScaleObjX);
        const newOriginY = parseInt(area.offsetHeight * relPosInScaleObjY);

        area.style.left = parseInt(area.offsetLeft + (newOriginX - scale.originX) * (scale.value - 1)) + 'px';
        area.style.top = parseInt(area.offsetTop + (newOriginY - scale.originY) * (scale.value - 1)) + 'px';
        canvas.style.left = parseInt(canvas.offsetLeft + (newOriginX - scale.originX) * (scale.value - 1)) + 'px';
        canvas.style.top = parseInt(canvas.offsetTop + (newOriginY - scale.originY) * (scale.value - 1)) + 'px';
        scale.originX = newOriginX;
        scale.originY = newOriginY;
    }
    
    scale.value *= multy;

    area.style.transformOrigin = scale.originX + 'px ' + scale.originY + 'px';
    canvas.style.transformOrigin = scale.originX + 'px ' + scale.originY + 'px';

    area.style.transform = 'scale(' + scale.value + ')';
    canvas.style.transform = 'scale(' + scale.value + ')';
}

const showHideChilds = (card) => {
    const cardId = card.getAttribute('data-id');
    openCards.has(cardId) ? openCards.delete(cardId) : openCards.add(cardId);
    activeCardId = cardId;
    TREE.filter(item => item.parentId == cardId).forEach(item => showedCards.has(item.id) ? showedCards.delete(item.id) : showedCards.add(item.id));
}

const createData = () => {
    const showElements = TREE.filter(item => showedCards.has(item.id));
    if ( showElements[0]?.id != 1 ) showElements.push(TREE[0]);

    const addChildren = obj => {
        showElements.filter(item => item.parentId == obj.id).forEach(item => {
            obj.children.push({
                id: item.id,
                name: item.name,
                men: item.men,
                children: []
            });
        });
        obj.children.forEach(item => addChildren(item));
    }

    const data = {
        id: 1,
        name: TREE.find(item => item.id == 1).name,
        men: 1,
        children: []
    }

    addChildren(data);

    const root = d3.hierarchy(data);

    const width = ( 'ontouchstart' in window ) ? 200 : 250;
    const height = ( 'ontouchstart' in window ) ? 45 : 60;

    return d3.tree().nodeSize([height, width])(root);
}

const arrangement = async () => {
    let minX = 0, minY = 0, maxX = 0, maxY = 0;

    const createHTML = obj => {
        const div = document.createElement('div');
        const divImg = document.createElement('div');
        const span = document.createElement('span');

        div.classList.add('card');
        div.classList.add('men-card');
        if ( obj.data.men != 1 ) div.classList.add('women-card');
        if ( openCards.has(obj.data.id) ) div.classList.add('open-card');
        if ( obj.data.id == activeCardId ) div.classList.add('active-card');

        divImg.classList.add('card-img');
        if (obj.data.men != 1) divImg.classList.add('women-card-img');
        span.classList.add('card-title');
        span.textContent = obj.data.name;

        div.setAttribute('data-id', obj.data.id);
        div.setAttribute('data-parent-id', obj.parent?.data.id ?? '-1');

        div.insertAdjacentElement('beforeend', divImg);
        div.insertAdjacentElement('beforeend', span);
        area.insertAdjacentElement('beforeend', div);

        div.style.top = obj.x + 'px';
        div.style.left = obj.y + 'px';

        if ( obj.x < minX ) minX = obj.x;
        if ( obj.y < minY ) minY = obj.y;
        if ( obj.x > maxX ) maxX = obj.x;
        if ( obj.y > maxY ) maxY = obj.y;

        if ( !obj.children ) return true;
        if ( obj.children.length == 0 ) return true;
        obj.children.forEach(item => createHTML(item));
    }

    area.textContent = '';

    const Data = await createData();
    await createHTML(Data);

    area.style.height = Math.abs(maxX-minX) + 100 + 'px';
    area.style.width = Math.abs(maxY-minY) + 'px';

    await document.querySelectorAll('.card').forEach(card => {
        card.style.top = card.offsetTop - minX + 'px';
    });

    await renderCanvas();
}



const addLabelToAddForm = () => {
    const formRows = Array.from(addForm.getElementsByClassName('pop-up-row'));
    formRows[formRows.length - 2].insertAdjacentHTML('afterend', `
        <label class="pop-up-label">
            Аты-жөні
            <input type="text" name="name" class="pop-up__input" required>
        </label>
        <div class="pop-up-row">
            <label class="pop-up-radio-label">
                <input type="radio" value="1" name="men-${formRows.length}" checked>
                Ер адам
            </label>
            <label class="pop-up-radio-label">
                <input type="radio" value="0" name="men-${formRows.length}">
                Әйел
            </label>
        </div>
    `);
}

const addBtnClick = () => {
    const card = document.querySelector('.active-card');
    if ( !card ) return;
    const addCardId = card.getAttribute('data-id');
    currentAddCardId = addCardId;
    addForm.querySelector('.pop-up__title').textContent = 'Ұрпақтарды қосу ';
    addForm.querySelector('.pop-up__title').textContent += TREE.find(item => item.id == addCardId).name;
    addForm.querySelector('input[type=submit]').value = 'Қосу';
    addForm.removeAttribute('data-update');
    addForm.querySelector('input[name="still"]').style.display = 'flex';
    showPopUp('#add-pop-up');
}

const editBtnClick = () => {
    const card = document.querySelector('.active-card');
    if ( !card ) return;
    const editCardId = card.getAttribute('data-id');
    currentAddCardId = editCardId;
    const {name, men} = TREE.find(item => item.id == editCardId);
    addForm.querySelector('.pop-up__title').textContent = 'Туралы ақпаратты өзгерту ';
    addForm.querySelector('.pop-up__title').textContent += name;
    addForm.querySelector('input[name="name"]').value = name;
    addForm.querySelectorAll('input[name="men-1"]').forEach(radio => {
        if ( radio.value == men ) radio.checked = true;
        else radio.checked = false;
    });
    addForm.querySelector('input[type=submit]').value = 'Жаңарту';
    addForm.setAttribute('data-update', true);
    addForm.querySelector('input[name="still"]').style.display = 'none';
    showPopUp('#add-pop-up');
}

const deleteBtnClick = async () => {
    const card = document.querySelector('.active-card');
    if ( !card ) return;
    const deleteCardId = card.getAttribute('data-id');
    if ( deleteCardId == 1 ) {
        infoPopUp.querySelector('.pop-up__title').textContent = 'Нельзя удалить корневой элемент';
        showPopUp('#info-pop-up');
        return;
    }
    if ( TREE.find(item => item.parentId == deleteCardId) ) {
        infoPopUp.querySelector('.pop-up__title').textContent = 'У этого элемента есть потомки, его нельзя удалить';
        showPopUp('#info-pop-up');
        return;
    }
    
    const response = await fetch('host.php?delete-data=' + deleteCardId);
    const result = await response.text();
    try {
        const msgFromSRV = JSON.parse(result);
        TREE = msgFromSRV.tree;
        counterSpan.textContent = TREE.length;
        TREE.filter(item => item.parentId == activeCardId).forEach(item => showedCards.add(item.id));
        infoPopUp.querySelector('.pop-up__title').textContent = 'Элемент сәтті жойылды';
        showPopUp('#info-pop-up');
        showHideChilds(document.querySelector(`.card[data-id="${activeCardId}"]`));
        arrangement();
    }
    catch {
        console.log(result);
        throw new Error('Ошибка удаления записи');
    }
}

const saveBtnClick = async () => {
    const formData = new FormData();
    formData.append('create-version', JSON.stringify(TREE));

    const response = await fetch('host.php', {
        method: 'POST',
        body: formData
    });
    const result = await response.text();
    try {
        infoPopUp.querySelector('.pop-up__title').textContent = JSON.parse(result).state;
        showPopUp('#info-pop-up');
    }
    catch {
        console.log(result);
        infoPopUp.querySelector('.pop-up__title').textContent = 'Ошибка сохранения версии';
        showPopUp('#info-pop-up');
    }
}

const infoBtnClick = () => {
    const card = document.querySelector('.active-card');
    if ( !card ) return;
    const editCardId = card.getAttribute('data-id');
    currentAddCardId = editCardId;
    const {name, birth, dead, wed, history} = TREE.find(item => item.id == editCardId);
    additInfoForm.querySelector('.pop-up__title').textContent = name;
    additInfoForm.querySelector('.pop-up__title').textContent += ' ТУРАЛЫ ҚОСЫМША АҚПАРАТ';
    additInfoForm.querySelector('input[name="birth"]').value = birth ?? '';
    additInfoForm.querySelector('input[name="dead"]').value = dead ?? '';
    additInfoForm.querySelector('textarea[name="wed"]').value = (wed == 0) ? '' : wed;
    additInfoForm.querySelector('textarea[name="history"]').value = history ?? '';
    if ( Rights[0] == "ADMIN" ) additInfoForm.querySelector('input[type="submit"]').removeAttribute('disabled');
    showPopUp('#addit-info-pop-up');
    getAttachments(editCardId);
}

const printBtnClick = () => {
    document.querySelector('footer').style.display = 'none';
    main.style.height = 297 + 'mm';
    main.style.width = 210 + 'mm';
    main.style.border = '1px solid var(--blue)';
    renderCanvas();
    location.href = '#print';
}

const logout = () => {
    const query = '?logout=true';
    getData('host.php' + query, (data) => {
        try { JSON.parse(data) }
        catch {
            console.log(data);
            return;
        }
        location.href = JSON.parse(data).location;
    });
}

const cardSearchHint = (value) => {
    const str = value.toLowerCase();
    searchDropdownList.textContent = '';
    TREE.filter(item => item.name.toLowerCase().includes(str)).forEach(item => {
        const {id, parentId, name} = item;
        const parent = TREE.find(el => el.id == parentId);
        if ( typeof parent != 'undefined' ) {
            const parentName = parent.name;
            searchDropdownList.innerHTML += `<li class="pop-up-dropdown-list__li" data-id="${id}">
                ${name}<-${parentName}
            </li>`;
        }
    });
    if ( (searchDropdownList.textContent != '') && (str.length != 0) )
    searchDropdownList.style.display = 'block';
    else searchDropdownList.style.display = 'none';
}

const addFormSubmit = async (event) => {
    event.preventDefault();
    event.target.querySelector('input[type="submit"]').setAttribute('disabled', true);

    const formData = new FormData();

    if ( event.target.hasAttribute('data-update') ) {
        const card = TREE.find(item => item.id == currentAddCardId);
        card.name = addForm.querySelector('input[name="name"]').value;
        card.men = addForm.querySelector('input[name="men-1"]:checked').value;

        formData.append('update-data', JSON.stringify(card));
        const response = await fetch('host.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.text();
        try {
            const msgFromSRV = JSON.parse(result);
            TREE = msgFromSRV.tree;
            counterSpan.textContent = TREE.length;
            TREE.filter(item => item.parentId == activeCardId).forEach(item => showedCards.add(item.id));
            hidePopUp(event.target.querySelector('input[type="submit"]'));
            showHideChilds(document.querySelector(`.card[data-id="${activeCardId}"]`));
            arrangement();
        }
        catch {
            console.log(result);
            throw new Error('Ошибка обновления записей');
        }

        hidePopUp(addForm.querySelector('input[type="submit"]'));
        arrangement();
        return;
    }

    const formLabels = Array.from(addForm.getElementsByClassName('pop-up-label'));
    const formRows = Array.from(addForm.getElementsByClassName('pop-up-row'));

    const insertData = formLabels.map((item, index) => {
        return {
            name: item.querySelector('input[name="name"]').value,
            men: formRows[index].querySelector('input[type="radio"]:checked').value,
            parentId: currentAddCardId
        }
    }).filter(item => item.name.length > 0);

    formData.append('insert-data', JSON.stringify(insertData));

    const response = await fetch('host.php', {
        method: 'POST',
        body: formData
    });
    const result = await response.text();
    try {
        const msgFromSRV = JSON.parse(result);
        TREE = msgFromSRV.tree;
        counterSpan.textContent = TREE.length;
        TREE.filter(item => item.parentId == activeCardId).forEach(item => showedCards.add(item.id));
        hidePopUp(event.target.querySelector('input[type="submit"]'));
        showHideChilds(document.querySelector(`.card[data-id="${activeCardId}"]`));
        arrangement();
    }
    catch {
        console.log(result);
        throw new Error('Ошибка добавления записей');
    }
}

const searchFormSubmit = (submit) => {
    submit.preventDefault();
    hidePopUp(submit.target.querySelector('input[type="submit"]'));
    const searchId = submit.target.querySelector('input[name="name"]').getAttribute('data-id');
    const baseCard = area.querySelector('div[data-id="1"]');
    baseCard.setAttribute('data-childs-shown', true);
    showHideChilds(baseCard);
    let parentId = TREE.find(item => item.id == searchId).parentId;
    while (parentId != -1 ) {
        const parent = TREE.find(item => item.id == parentId);
        parentId = parent.parentId;
        showHideChilds(area.querySelector('div[data-id="' + parent.id + '"]'));
    }
    arrangement();
}

const infoFormSubmit = (submit) => {
    submit.preventDefault();
    const card = TREE.find(item => item.id == currentAddCardId);
    card.birth = additInfoForm.querySelector('input[name="birth"]').value;
    card.dead = additInfoForm.querySelector('input[name="dead"]').value;
    card.wed = additInfoForm.querySelector('textarea[name="wed"]').value;
    card.history = additInfoForm.querySelector('textarea[name="history"]').value;
    hidePopUp(additInfoForm.querySelector('input[type="submit"]'));
    return;
}

const getRightsFormSubmit = (submit) => {
    submit.preventDefault();
    const phone = submit.target.querySelector('input[name="phone"]').value;
    const cardId = area.querySelector('.active-card').getAttribute('data-id');
    const query = '?query-rights=' + cardId + '&phone=' + phone;
    hidePopUp(submit.target.querySelector('input[type="submit"]'))
        .then(() => {
            getData('host.php' + query, (data) => {
                try { JSON.parse(data) }
                catch {
                    console.log(data);
                    return;
                }
                const msgFromSrv = JSON.parse(data);
                infoPopUp.querySelector('.pop-up__title').textContent = msgFromSrv.msg;
                showPopUp('#info-pop-up');
            });
        });
}

const getRights = async () => {
    const promise = new Promise((resolve, reject) => {
        const query = '?get-rights';
        getData('host.php' + query, (data) => {
            try { JSON.parse(data) }
            catch {
                alert(data);
                return;
            }
            Rights = JSON.parse(data);
            resolve();
        });
    });
    promise.then(() => {
        createData();
        arrangement();
    });
}

const getAttachments = (id) => {
    const query = '?get-attachments=' + id;
    getData('host.php' + query, (data) => {
        try { JSON.parse(data) }
        catch {
            console.log(data);
            return;
        }
        const filesBlock = additInfoForm.querySelector('.pop-up-info-cards');
        filesBlock.textContent = '';
        JSON.parse(data).forEach(item => {
            const div = document.createElement('div');
            const a = document.createElement('a');
            const input = document.createElement('input');
            div.classList.add('info-card');
            a.classList.add('info-card-pic');
            a.style.backgroundImage = 'url("' + item + '")';
            a.href = item;
            a.setAttribute('target', '_blank');
            input.classList.add('info-card__delete');
            input.setAttribute('type', 'button');
            input.setAttribute('onclick', 'removeAttachment(this)');
            input.value = 'Удалить';
            div.insertAdjacentElement('beforeend', a);
            if ( Rights[0] == 'ADMIN' )
            div.insertAdjacentElement('beforeend', input);
            filesBlock.insertAdjacentElement('beforeend', div);
        });
    });
}

const sendFiles = (input) => {
    const formData = new FormData();
    const files = input.files;
    for (let i in files) {
        formData.append('pictures[]', files[i]);
    }
    formData.append('send-attachments', true);
    formData.append('folder', currentAddCardId);
    postData('host.php', formData, (data) => {
        getAttachments(currentAddCardId);
    });
}

const removeAttachment = (btn) => {
    const href = btn.closest('div').querySelector('a').href;
    const hrefArr = href.split('/');
    const fileName = hrefArr[hrefArr.length-1];
    const fileDir = hrefArr[hrefArr.length-2];
    const query = '?del-attac=' + fileName + '&folder=' + fileDir;
    getData('host.php' + query, (data) => {
        getAttachments(currentAddCardId);
    });
}

const getTree = async () => {
    const query = '?get-tree=true';
    const response = await fetch('host.php' + query);
    const result = await response.text();
    try { JSON.parse(result); }
    catch { throw new Error('Ошибка получения дерева: ' + result); }
    TREE = JSON.parse(result);
    counterSpan.textContent = TREE.length;
}



addEventListener('resize', renderCanvas);


main.addEventListener('wheel', (event) => {
    event.preventDefault();
    areaZoom(event);
});

area.addEventListener('click', async (event) => {
    additInfoForm.querySelector('input[type="submit"]').setAttribute('disabled', 'true');
    area.querySelectorAll('.card').forEach(card => card.classList.remove('active-card'));
    activeCardId = null;
    const clickCard = event.composedPath().find(item => {
        if ( 'classList' in item )
        return item.classList.contains('card');
    });
    if ( clickCard ) {
        const getPath = (card, arr) => {
            arr.push(card.getAttribute('data-id'));
            const parentCard = area.querySelector('.card[data-id="' + card.getAttribute("data-parent-id") + '"]');
            if ( parentCard ) getPath(parentCard, arr);
            return arr;
        }
        const path = getPath(clickCard, []);
        let right = Rights.find(r => path.some(item => item == r.order_begin));
        if ( right ) {
            document.querySelector('#save').removeAttribute('disabled');
            if ( right.addit == 1 ) {
                if ( TREE.find(card => card.id == clickCard.getAttribute('data-id')).men == 1 )
                document.querySelector('#add').removeAttribute('disabled');
                else document.querySelector('#add').setAttribute('disabled', true);
            }
            else document.querySelector('#add').setAttribute('disabled', true);
            if ( right.edit == 1 ) document.querySelector('#edit').removeAttribute('disabled');
            else document.querySelector('#edit').setAttribute('disabled', true);
            if ( right.del == 1 ) document.querySelector('#delete').removeAttribute('disabled');
            else document.querySelector('#delete').setAttribute('disabled', true);
        }
        else {
            if (document.querySelector('#add'))
            document.querySelector('#add').setAttribute('disabled', true);
            if (document.querySelector('#edit'))
            document.querySelector('#edit').setAttribute('disabled', true);
            if (document.querySelector('#delete'))
            document.querySelector('#delete').setAttribute('disabled', true);
        }
        if ( Rights[0] == "ADMIN" ) {
            document.querySelector('#save').removeAttribute('disabled');
            if ( TREE.find(card => card.id == clickCard.getAttribute('data-id')).men == 1 )
            document.querySelector('#add').removeAttribute('disabled');
            else document.querySelector('#add').setAttribute('disabled', true);
            document.querySelector('#edit').removeAttribute('disabled');
            document.querySelector('#delete').removeAttribute('disabled');
        }
        clickCard.classList.add('active-card');
        showHideChilds(clickCard);
        await arrangement(clickCard);
        if ( document.querySelector('.card[data-parent-id="' + clickCard.getAttribute("data-id") + '"]') ) {
            let topPosition, rightPosition, botPosition;
            document.querySelectorAll('.card[data-parent-id="' + clickCard.getAttribute("data-id") + '"]').forEach((item, index) => {
                if ( index == 0 ) {
                    topPosition = item.offsetTop * scale.value;
                    if ( item.offsetParent )
                    rightPosition = (item.offsetParent.offsetLeft + item.offsetWidth) * scale.value;
                }
                botPosition = (item.offsetTop + item.offsetHeight) * scale.value;
            });
            if ( (screen.availWidth - (area.offsetLeft - scale.originX*(scale.value-1))) < rightPosition ) {
                area.style.left = parseInt(area.offsetLeft - (rightPosition - (screen.availWidth - (area.offsetLeft - scale.originX*(scale.value-1))))) + 'px';
                canvas.style.left = parseInt(canvas.offsetLeft - (rightPosition - (screen.availWidth - (canvas.offsetLeft - scale.originX*(scale.value-1))))) + 'px';
            }
        }
    }
});

addEventListener('click', (event) => {
    if ( event.target.classList.contains('pop-up-dropdown-list__li') ) {
        const id = event.target.getAttribute('data-id');
        const name = TREE.find(item => item.id == id ).name;
        const searchInput = document.querySelector('#search-pop-up').querySelector('input[name="name"]');
        searchInput.value = name;
        searchInput.setAttribute('data-id', id);
        searchDropdownList.style.display = 'none';
        return;
    }
});

addEventListener('hashchange', (event) => {
    const hash = location.hash;
    if ( hash == '' ) {
        document.querySelector('footer').style.display = 'flex';
        main.style.width = 'auto';
        main.style.height = '90vh';
        main.style.border = 'none';
    }
});

main.addEventListener('touchstart', (event) => {
    if ( mMenuBtn.hasAttribute('data-show') && !(event.target.classList.contains('mobile-menu')) ) showHideMobileMenu(mMenuBtn);
    if ( event.touches.length > 1 ) {
        if ( Math.hypot((event.touches[0].clientX-event.touches[1].clientX), (event.touches[0].clientY-event.touches[1].clientY)) < 20 ) return;
        Touches.r1 = Math.hypot((event.touches[0].clientX-event.touches[1].clientX), (event.touches[0].clientY-event.touches[1].clientY));
        Touches.r2 = null;
        if ( !scale.originX && !scale.originY ) {
            scale.originX = parseInt((event.touches[0].clientX+event.touches[1].clientX)/2) - area.offsetLeft;
            scale.originY = parseInt((event.touches[0].clientY+event.touches[1].clientY)/2) - area.offsetTop;
            area.style.transformOrigin = scale.originX + 'px ' + scale.originY + 'px';
            canvas.style.transformOrigin = scale.originX + 'px ' + scale.originY + 'px';
        }
        else {
            // получение центра касания;
            const touchCenterX = parseInt((event.touches[0].clientX+event.touches[1].clientX)/2);
            const touchCenterY = parseInt((event.touches[0].clientY+event.touches[1].clientY)/2);
            // координаты центра касания на scale-объекте;
            const posInScaleObjX = touchCenterX - area.offsetLeft + (scale.value-1)*scale.originX;
            const posInScaleObjY = touchCenterY - area.offsetTop + (scale.value-1)*scale.originY;
            // относительные координаты центра касания на scale-объекте;
            const relPosInScaleObjX = posInScaleObjX / (area.offsetWidth * scale.value);
            const relPosInScaleObjY = posInScaleObjY / (area.offsetHeight * scale.value);
            // координаты центра касания на основном объекте;
            const newOriginX = parseInt(area.offsetWidth * relPosInScaleObjX);
            const newOriginY = parseInt(area.offsetHeight * relPosInScaleObjY);
            // применение изменений;
            area.style.left = parseInt(area.offsetLeft + (newOriginX - scale.originX) * (scale.value - 1)) + 'px';
            area.style.top = parseInt(area.offsetTop + (newOriginY - scale.originY) * (scale.value - 1)) + 'px';
            canvas.style.left = parseInt(canvas.offsetLeft + (newOriginX - scale.originX) * (scale.value - 1)) + 'px';
            canvas.style.top = parseInt(canvas.offsetTop + (newOriginY - scale.originY) * (scale.value - 1)) + 'px';
            scale.originX = newOriginX;
            scale.originY = newOriginY;
            area.style.transformOrigin = scale.originX + 'px ' + scale.originY + 'px';
            canvas.style.transformOrigin = scale.originX + 'px ' + scale.originY + 'px';
        }
    }
    if ( event.touches.length == 1 ) {
        Touches.preX = event.touches[0].clientX;
        Touches.preY = event.touches[0].clientY;
    }
}, {passive: false});

main.addEventListener('touchmove', (event) => {
    event.preventDefault();
    if ( event.touches.length > 1 ) {
        if ( Touches.r2 ) {
            Touches.r1 = Touches.r2;
            Touches.r2 = Math.hypot((event.touches[0].clientX-event.touches[1].clientX), (event.touches[0].clientY-event.touches[1].clientY));

            if ( scale.value*(Touches.r2/Touches.r1) < 0.1 ) return;

            scale.value *= Touches.r2/Touches.r1;
            area.style.transform = 'scale(' + scale.value + ')';
            canvas.style.transform = 'scale(' + scale.value + ')';
        }
        else
        Touches.r2 = Math.hypot((event.touches[0].clientX-event.touches[1].clientX), (event.touches[0].clientY-event.touches[1].clientY));
    }
    if ( event.touches.length == 1 ) {
        const dX = parseInt(event.touches[0].clientX - Touches.preX);
        const dY = parseInt(event.touches[0].clientY - Touches.preY);
        Touches.preX = event.touches[0].clientX;
        Touches.preY = event.touches[0].clientY;
        area.style.left = area.offsetLeft + dX + 'px';
        area.style.top = area.offsetTop + dY + 'px';
        canvas.style.left = area.offsetLeft + 'px';
        canvas.style.top = area.offsetTop + 'px';
    }
});

main.addEventListener(mouseDown, (event) => {
    if (event.target.classList.contains('mobile-menu')) return;
    if ( mMenuBtn.hasAttribute('data-show') )
    mMenuBtn.dispatchEvent(new Event('click'));
    const clickCard = event.composedPath().find(item => {
        if ( 'classList' in item )
        return item.classList.contains('card');
    });
    if ( !clickCard ) {
        event.preventDefault();
        areaMouseDown(event);
    }
});

addEventListener('error', event => {
    console.log(event);
});

getTree().then(getRights);
