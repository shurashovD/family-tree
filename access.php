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
    <main>
        <table style="width: 90%">
            <thead>
                <tr>
                    <td>Қолданушы</td>
                    <td>Қіру</td>
                    <td>Әрекет</td>
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
    <script src="access.js"></script>
</body>
</html>