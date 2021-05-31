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

let touches = [];
let move = false;

let scale = {
    originX: null, originY: null, translateX: 0, translateY: 0, value: 1
}

const Touches = {};

const mouseDown = 'mousedown';
const mouseMove = 'mousemove';
const mouseUp = 'mouseup';

let currentAddCardId = -1;

let ShownChildArr = [];

let TREE = [];

let TREES = [];

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

const renderCanvas = async (clickCard) => {
    await RaingoldTilford(clickCard);

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
                x: (parentCard.offsetParent.offsetLeft + parentCard.offsetLeft + parentCard.offsetWidth),
                y: (parentCard.offsetParent.offsetTop + parentCard.offsetTop + parseInt(parentCard.offsetHeight/2))
            };
            const P3 = {
                x: (card.offsetParent.offsetLeft + card.offsetLeft),
                y: (card.offsetParent.offsetTop + card.offsetTop + parseInt(card.offsetHeight/2))
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

const arrangement = (card) => {
    const sortTree = () => {
        let flag = true;
        while ( flag ) {
            flag = false;
            TREE.sort((a, b) => {
                if ( a.parentId == b.parentId ) return 1;
                if ( TREE.findIndex(item => item.id == a.parentId) < TREE.findIndex(item => item.id == b.parentId) ) {
                    flag = true;
                    return -1;
                }
                return 1;
            });
        }
    } 

    const parentsNum = (card) => {
        if ( card.id == 1 ) return -1;
        let parentId = card.parentId;
        let j = 0;
        if ( parentId == 1 ) return 0;
        while ( parentId != 1 ) {
            j++;
            parentId = TREE.find(item => item.id == parentId).parentId;
        }
        return j;
    }
    
    sortTree();
    
    area.textContent = '';

    let i = 0;
    let depth = null;
    TREE.forEach(item => {
        if ( parentsNum(item) != depth ) {
            depth = parentsNum(item);
            const div = document.createElement('div');
            div.classList.add('col');
            area.insertAdjacentElement('beforeend', div);
        }
        const cardImg = (item.men == 1) ? '<div class="card-img"></div>' : '<div class="card-img women-card-img"></div>';
        const className = (item.men == 1) ? 'men-card' : 'women-card';
        const col = area.lastChild;
        col.insertAdjacentHTML('beforeend', `
            <div class="card ${className}" data-id="${item.id}" data-parent-id="${item.parentId}">
                ${cardImg}
                <span class="card-title">${item.name}</span>
            </div>
        `);
        i++
    });

    ShownChildArr.forEach((item, index) => {
        showHideChilds(document.querySelector('div.card[data-id="' + item + '"]'));
        if ( index == ShownChildArr.length-1 ) renderCanvas(card);
    });

    if ( currentAddCardId != -1 ) {
        area.querySelector('.card[data-id="' + currentAddCardId + '"]').classList.add('active-card');
    }
}

const distribution = () => {
    const AllCards = Array.from(document.getElementsByClassName('card')).filter(item => item.offsetWidth > 0);
    AllCards.forEach(item => item.style.top = 0);
    const allCols = document.querySelectorAll('.col');
    let Cols = [];
    allCols.forEach(item => {
        const cardVisible = Array.from(item.getElementsByClassName('card')).find(el => el.offsetWidth > 0);
        if ( cardVisible ) {
            item.style.width = cardVisible.offsetWidth + 40 + 'px';
            Cols.push(item);
        }
        else {
            item.style.width = 0;
            item.style.height = 0;
        }
    });

    const getDeep = (card) => {
        let result = 0;
        const id = card.getAttribute('data-id');
        const myChilds = AllCards.filter(item => item.getAttribute('data-parent-id') == id);

        myChilds.forEach(item => {
            const deep = getDeep(item);
            result += (item.offsetHeight > deep) ? (item.offsetHeight + 6) : deep;
        });

        return result;
    }

    for ( let i in Cols ) {
        col = Cols[i];                      // обход всех колонок слева-направо;
        const colCards = Array.from(col.getElementsByClassName('card')).filter(item => item.offsetWidth > 0);
        let top = 0;
        let currentParentId = -2;
        colCards.forEach(card => {          // обход всех карточек в колонке;
            const deep = getDeep(card);     // высота, которую займёт карточка вместе с потомками;
            card.setAttribute('data-deep', deep);
            const parentId = card.getAttribute('data-parent-id');
            if ( parentId != currentParentId ) {
                currentParentId = parentId;
                top = 0;
            }
            const parentCard = AllCards.find(item => item.getAttribute('data-id') == parentId);
            let conteinerStart = 0;
            if ( parentCard ) {
                const parentCardDeep = parentCard.getAttribute('data-deep');
                const parentCardMiddle = parentCard.offsetTop + parseInt(parentCard.offsetHeight/2);
                conteinerStart = parentCardMiddle - parseInt(parentCardDeep/2);
            }
            // смещение карточки с резервированием места для потомков;
            let shiftTop = 3;
            if ((deep>card.offsetHeight) && card.hasAttribute('data-childs-shown'))
            shiftTop = parseInt((deep-card.offsetHeight)/2);
            // позиционирование карточки;
            card.style.top = conteinerStart + top + shiftTop + 'px';
            // резервирование места карточки;
            top += (card.offsetHeight > deep) ? (card.offsetHeight + 6) : deep;
        });
    }

    let reverseShift = 0;
    AllCards.forEach(item => {
        if ( item.offsetTop < reverseShift ) reverseShift = item.offsetTop;
    });
    AllCards.forEach(item => item.style.top = item.offsetTop - reverseShift + 'px');

    Cols.forEach(col => {
        const colCards = Array.from(col.getElementsByClassName('card')).filter(item => item.offsetWidth > 0);
        const colLastCard = colCards[colCards.length - 1];
        col.style.height = colLastCard.offsetHeight + colLastCard.offsetTop + 'px';
    });

    //RainoldTilford();
}

const RaingoldTilford = async (clickCard) => {
    if (!clickCard) return;

    const getLevel = (node, current) => {
        let level = current ?? 0;
        const parent = Nodes.find(item => item.id == node.parentId);
        return parent ? getLevel(parent, ++level) : level;
    }

    const getAbsolutePosition = (node, result) => {
        result = result ?? node.pos;
        const parent = Nodes.find(item => item.id == node.parentId);
        return parent ? getAbsolutePosition(parent, (result + parent.pos)) : result;
    }
    
    const getBasePosition = (node) => {
        const neighbors = Nodes.filter(item => item.parentId == node.parentId);
        const index = neighbors.findIndex(item => item.id == node.id);
        return (neighbors.length - 1) - index*2;
    }

    const changeTrees = async (up, down, range) => {
        let shift = Math.abs(Math.ceil(range/2)) + 1;
        if ( shift%2 == 0 ) ++shift;
        let dinamic = shift;
        const neighbors = Nodes.filter(item => item.parentId == up.parentId);
        neighbors.forEach(node => {
            node.pos += dinamic;
            if ( node.id == up.id ) dinamic = 0;
            if ( node.id == down.id ) {
                dinamic = -shift;
                node.pos += dinamic;
            }
        });
        await updateTrees(neighbors);
    }

    const checkCross = async (nodes) => {
        const parentNode = Nodes.find(item => item.id == nodes[0].parentId);
        if (!parentNode) return;
        const parentNodeTree = TREES.find(item => item.root == parentNode.id);
        if (!parentNodeTree) return;

        const neighbors = Nodes.filter(item => item.parentId == parentNode.parentId);
        const neighborsTrees = TREES.map(tree => {
            if (neighbors.some(item => item.id == tree.root)) 
            return tree;
        }).filter(item => (typeof item != 'undefined'));

        let flag = 'before';
        for (let neighbor of neighborsTrees) {
            if ( neighbor.root == parentNode.id ) {
                flag = 'after';
                continue;
            }
            for (let degree of parentNodeTree.enclosure) {
                const {level, top, bot} = degree;
                const neighborDegree = neighbor.enclosure.find(item => item.level == level);
                if (neighborDegree) {
                    if ( flag == 'before' ) {
                        const range = (getAbsolutePosition(neighborDegree.bot) - getAbsolutePosition(top));
                        if ( range < 2 ) {
                            await changeTrees(Nodes.find(item => item.id == neighbor.root), parentNode, range);
                        }
                    }
                    if ( flag == 'after' ) {
                        const range = (getAbsolutePosition(bot) - getAbsolutePosition(neighborDegree.top));
                        if ( range < 2 ) {
                            await changeTrees(parentNode, Nodes.find(item => item.id == neighbor.root), range);
                        }
                    }
                }
            }
        }
        if ( neighbors ) await checkCross(neighbors);
    }

    const updateTrees = (nodes) => {
        const parentNode = Nodes.find(item => item.id == nodes[0].parentId);
        if (parentNode) {
            let parentNodeTree;
            const thisTrees = TREES.map(item => {
                const {root} = item;
                if ( root == parentNode.id ) parentNodeTree = item;
                if ( nodes.some(item => item.id == root) ) return item;
            }).filter(item => (typeof item != 'undefined'));
            if (parentNodeTree) {
                nodes.forEach(node => {
                    const nodeTree = thisTrees.find(item => item.root == node.id);
                    nodeTree.enclosure.forEach(enc => {
                        const parentNodeTreeLevel = parentNodeTree.enclosure.find(item => item.level == enc.level);
                        if (parentNodeTreeLevel) {
                            const parentNodeLevelTop = getAbsolutePosition(parentNodeTreeLevel.top);
                            const encTop = getAbsolutePosition(enc.top);
                            const parentNodeTreeLevelBot = getAbsolutePosition(parentNodeTreeLevel.bot);
                            const encBot = getAbsolutePosition(enc.bot);
                            if ( parentNodeLevelTop < encTop ) parentNodeTreeLevel.top = enc.top;
                            if ( parentNodeTreeLevelBot > encBot ) parentNodeTreeLevel.bot = enc.bot;
                        }
                        else {
                            parentNodeTree.enclosure.push({
                                level: enc.level,
                                top: enc.top,
                                bot: enc.bot
                            });
                        }
                    });
                });
            }

            const nodeList = Nodes.filter(item => item.parentId == parentNode.parentId);
            if (nodeList.length > 0) updateTrees(nodeList);
            else return;
        }
        else return;
    }

    const mainOpenCard = async (clickCard) => {
        const clickCardId = clickCard.getAttribute('data-id');
        const nodeList = Nodes.filter(item => item.parentId == clickCardId);
        if (nodeList.length == 0) return;
        const level = getLevel(nodeList[0]);
        for (let item of nodeList) {
            item.pos = getBasePosition(item);
            if (!TREES.some(tree => tree.root == item.id))
            TREES.push({
                root: item.id,
                enclosure: [
                    {
                        level: level,
                        top: item,
                        bot: item
                    }
                ]
            });
        }
        await updateTrees(nodeList);
        await checkCross(nodeList);
    }

    const main = async () => {
        let level = 1;
        let nodeList = Nodes.filter(item => getLevel(item) == level);
        while( nodeList.length != 0 ) {
            let group = [];
            let Groups = [];
            let parentId = nodeList[0].parentId;
            for ( let node of nodeList ) {
                if ( node.parentId != parentId ) {
                    Groups.push(group);
                    group = [];
                    parentId = node.parentId;
                }
                group.push(node);
                node.pos = getBasePosition(node);
                if (!TREES.some(tree => tree.root == node.id))
                TREES.push({
                    root: node.id,
                    enclosure: [
                        {
                            level: level,
                            top: node,
                            bot: node
                        }
                    ]
                });
            }
            Groups.push(group);

            for (let nodeList of Groups) {
                await updateTrees(nodeList);
                await checkCross(nodeList);
            }

            ++level;
            nodeList = Nodes.filter(item => getLevel(item) == level);
        }
    }

    const founderCard = document.querySelector('.card')
    const cellHeight = parseInt(founderCard.offsetHeight/2 + 3);
    const origin = founderCard.offsetTop + parseInt(founderCard.offsetHeight/2);
    const AllCards = Array.from(document.getElementsByClassName('card')).filter(item => item.offsetWidth > 0);
    const Nodes = TREE.filter(item => AllCards.some(card => card.getAttribute('data-id') == item.id));
    Nodes[0].pos = 0;
    const allCols = document.querySelectorAll('.col');
    let Cols = [];

    if (clickCard?.hasAttribute('data-childs-shown')) await mainOpenCard(clickCard);
    else {
        TREES = [];
        await main(clickCard);
    }

    AllCards.forEach(card => {
        const cardId = card.getAttribute('data-id');
        const node = Nodes.find(node => node.id == cardId);
        if (!node.pos) node.pos = getBasePosition(node);
        card.style.top = origin - getAbsolutePosition(node) * cellHeight + 'px';
    });

    let reverseShift = 0;
    AllCards.forEach(item => {
        if ( item.offsetTop < reverseShift ) reverseShift = item.offsetTop;
    });
    AllCards.forEach(item => item.style.top = item.offsetTop - reverseShift + 'px');

    allCols.forEach(item => {
        const cardVisible = Array.from(item.getElementsByClassName('card')).find(el => el.offsetWidth > 0);
        if ( cardVisible ) {
            item.style.width = cardVisible.offsetWidth + 40 + 'px';
            Cols.push(item);
        }
        else {
            item.style.width = 0;
            item.style.height = 0;
        }
    });

    Cols.forEach(col => {
        const colCards = Array.from(col.getElementsByClassName('card')).filter(item => item.offsetWidth > 0);
        const colLastCard = colCards[colCards.length - 1];
        col.style.height = colLastCard.offsetHeight + colLastCard.offsetTop + 'px';
    });
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
        infoPopUp.querySelector('.pop-up__title').textContent = 'Элемент сәтті жойылды';
        showPopUp('#info-pop-up');
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

const showHideChilds = (card) => {
    if ( !card ) return;
    const hideChilds = (card) => {
        card.removeAttribute('data-childs-shown');
        card.classList.remove('open-card');
        const id = card.getAttribute('data-id');
        const spliceStart = ShownChildArr.indexOf(id);
        if ( spliceStart != -1 )
        ShownChildArr.splice(spliceStart, 1);
        area.querySelectorAll('div[data-parent-id="' + id + '"]').forEach(item => {
            item.style.display = 'none';
            hideChilds(item);
        });
    }

    if ( card.hasAttribute('data-childs-shown') ) hideChilds(card);
    else {
        card.setAttribute('data-childs-shown', true);
        card.classList.add('open-card');
        const id = card.getAttribute('data-id');
        if ( ShownChildArr.indexOf(id) == -1 )
        ShownChildArr.push(id);
        area.querySelectorAll('div[data-parent-id="' + id + '"]').forEach(item => item.style.display = 'flex');
    }
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
        hidePopUp(event.target.querySelector('input[type="submit"]'));
        arrangement(document.querySelector('.card[data-id="' + currentAddCardId + '"]'));
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
}

const createData = () => {
    const addChildren = obj => {
        TREE.filter(item => item.parentId == obj.id).forEach(item => {
            obj.children.push({
                id: item.id,
                name: item.name,
                children: []
            });
        });
        obj.children.forEach(item => addChildren(item));
    }

    const data = {
        id: 1,
        name: TREE.find(item => item.id == 1).name,
        children: []
    }

    addChildren(data);

    const root = d3.hierarchy(data);

    console.log(d3.tree().nodeSize([60, 100])(root));
}

addEventListener('resize', renderCanvas);


main.addEventListener('wheel', (event) => {
    event.preventDefault();
    areaZoom(event);
});

area.addEventListener('click', async (event) => {
    additInfoForm.querySelector('input[type="submit"]').setAttribute('disabled', 'true');
    area.querySelectorAll('.card').forEach(card => card.classList.remove('active-card'));
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
        await renderCanvas(clickCard);
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
