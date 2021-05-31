<?php
    require_once("author.php");

    if ( $_SESSION['user_rights'] != 'ADMIN' ) {
        header("Location: index.php");
        exit();
    }

?>

<!DOCTYPE html>
<html lang="kz">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="orders.css">
    <title>Family tree</title>
</head>
<body>
    <header>
        <input type="button" class="header__btn" value="Орындау">
    </header>
    <main>
        <table>
            <thead>
                <tr>
                    <td>Қолданушы</td>
                    <td>Телефон</td>
                    <td>Күні</td>
                    <td>Филиалдың басталуы</td>
                    <td>Қосу</td>
                    <td>Редакциялау</td>
                    <td>Өшіру</td>
                    <td>Әрекет</td>
                    <td>Әрекет</td>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        <div class="pag">
            <input type="button" class="pag__btn" data-action="prev" value="<" onclick="pug(this)">
            <span class="pag__span">1</span>
            <input type="button" class="pag__btn" data-action="next" value=">" onclick="pug(this)">
        </div>
    </main>
    <script src="orders.js"></script>
</body>
</html>