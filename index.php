<?php
    require_once("author.php");
    $footer = '<span class="counter"></span>';
    if ( $_SESSION['user_rights'] == 'ADMIN' ) {
        $input_files = '<label class="pop-up-label">Тіркемелер';
        $input_files .= '<input type="file" class="pop-up__input" multiple accept=".jpg, .jpeg, .png" oninput="sendFiles(this)"></label>';
        $footer .= '<a href="admin.php" class="footer-btn" id="admin" title="Әкімші панелі"></a>';
    }
    if ( isset($_SESSION['user_id']) ) {
        $footer .= '<input type="button" class="footer-btn" id="info" onclick="infoBtnClick()" title="Ақпарат">';
        $footer .= '<input type="button" class="footer-btn" id="save" onclick="saveBtnClick()" disabled title="Сақтау">';
        $footer .= '<input type="button" class="footer-btn" id="add" onclick="addBtnClick()" disabled title="Ұрпақ қосу">';
        $footer .= '<input type="button" class="footer-btn" id="edit" onclick="editBtnClick()" disabled title="Өзгерту">';
        $footer .= '<input type="button" class="footer-btn" id="delete" onclick="deleteBtnClick()" disabled title="Жою">';
        $footer .= '<input type="button" class="footer-btn" id="search" onclick="showPopUp('."'#search-pop-up')".'" title="Іздеу">';
        $footer .= '<input type="button" class="footer-btn" id="print" onclick="printBtnClick(this)" title="Басып шығару">';
        $footer .= '<input type="button" class="footer-btn" id="get-rights" onclick="showPopUp('."'#get-rights-pop-up')".'" title="Құқықтарды сұрау">';
        $footer .= '<input type="button" class="footer-btn" id="logout" onclick="logout()" title="Шығу">';
    }
    else {
        $footer = '<input type="button" class="footer-btn" id="info" onclick="infoBtnClick()" title="Ақпарат">';
        $footer .= '<input type="button" class="footer-btn" id="search" onclick="showPopUp('."'#search-pop-up')".'" title="Іздеу">';
        $footer .= '<input type="button" class="footer-btn" id="print" onclick="printBtnClick(this)" title="Басып шығару">';
        $footer .= '<a href="login.php" class="footer-btn" id="enter" title="Кіру"></a>';
    }
?>

<!DOCTYPE html>
<html lang="kz">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;500&display=swap" rel="stylesheet">
    <link rel="icon" href="https://baijigit.kz/img/favicon.jpg" type="image/jpeg">
    <link rel="stylesheet" href="style.css">
    <script src="https://d3js.org/d3.v6.js"></script>
    <title>ХАН ТОҒАС ШЕЖIРЕСI</title>
</head>
<body>
    <main>
        <input type="button" class="mobile-menu" onclick="showHideMobileMenu(this)">
        <canvas width="450" height="300"></canvas>
        <div class="area" data-scale="1"></div>
    </main>
    <footer><?php echo $footer; ?></footer>
    <section class="overlay">
        <form action="" class="pop-up" id="search-pop-up" onsubmit="searchFormSubmit(event)">
            <label class="pop-up-label">
                Аты бойынша іздеу
                <input type="text" name="name" class="pop-up__input" oninput="cardSearchHint(this.value)">
                <div class="pop-up-dropdown-conteiner">
                    <ul class="pop-up-dropdown-list"></ul>
                </div>
            </label>
            <div class="pop-up-row">
                <input type="button" value="Артқа" class="pop-up-btn" onclick="hidePopUp(this)">
                <input type="submit" value="Іздеу" class="pop-up-btn">
            </div>
        </form>
        <form action="" class="pop-up" id="add-pop-up" onsubmit="addFormSubmit(event)">
            <p class="pop-up__title"></p>
            <label class="pop-up-label">
                Аты-жөні
                <input type="text" name="name" class="pop-up__input" required>
            </label>
            <div class="pop-up-row">
                <label class="pop-up-radio-label">
                    <input type="radio" value="1" name="men-1" checked>
                    Ер адам
                </label>
                <label class="pop-up-radio-label">
                    <input type="radio" value="0" name="men-1">
                    Әйел
                </label>
            </div>
            <div class="pop-up-row">
                <input type="button" value="Артқа" class="pop-up-btn" onclick="hidePopUp(this)">
                <input type="button" value="Тағы" name="still" class="pop-up-btn" onclick="addLabelToAddForm(this)">
                <input type="submit" value="Қосу" class="pop-up-btn">
            </div>
        </form>
        <form action="" class="pop-up" id="addit-info-pop-up" onsubmit="infoFormSubmit(event)">
            <p class="pop-up__title"></p>
            <div class="pop-up-row">
                <label class="pop-up-half-label">
                    Туған күні
                    <input type="date" name="birth" class="pop-up__input">
                </label>
                <label class="pop-up-half-label">
                    Қайтыс болған күні
                    <input type="date" name="dead" class="pop-up__input">
                </label>
            </div>
            <label class="pop-up-label">
                Неке
                <textarea name="wed" class="pop-up__input" rows="4"></textarea>
            </label>
            <div class="pop-up-info-cards"></div>
            <?php echo $input_files; ?>
            <textarea name="history" cols="60" rows="20" class="pop-up-textarea"></textarea>
            <div class="pop-up-row">
                <input type="button" value="Артқа" class="pop-up-btn" onclick="hidePopUp(this)">
                <input type="submit" value="Жаңарту" class="pop-up-btn" disabled>
            </div>
        </form>
        <form action="" class="pop-up" id="info-pop-up">
            <p class="pop-up__title"></p>
            <div class="pop-up-row">
                <input type="button" value="Артқа" class="pop-up-btn" onclick="hidePopUp(this)">
            </div>
        </form>
        <form action="" class="pop-up" id="get-rights-pop-up" onsubmit="getRightsFormSubmit(event)">
            <label class="pop-up-label">
                Сіздің телефон нөміріңіз
                <input type="text" name="phone" class="pop-up__input">
            </label>
            <div class="pop-up-row">
                <input type="button" value="Назад" class="pop-up-btn" onclick="hidePopUp(this)">
                <input type="submit" value="Отправить" class="pop-up-btn">
            </div>
        </form>
    </section>
    <script src="script.js"></script>
</body>
</html>