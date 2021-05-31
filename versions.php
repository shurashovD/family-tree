<?php
    require_once("author.php");

    if ( $_SESSION['user_rights'] != 'ADMIN' ) {
        header("Location: login.php");
        exit();
    }

?>

<!DOCTYPE html>
<html lang="kz">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="orders.css">
    <title>Family tree</title>
</head>
<body>
    <header>
        <form class="search-form" onsubmit="searchFormSubmit(event)">
            <input type="date" name="start"> - 
            <input type="date" name="finish">
            <input type="submit" name="get-versions" value="Қолдану" class="search-form__btn">
        </form>
    </header>
    <main>
        <table>
            <thead>
                <tr>
                    <td>Қолданушы</td>
                    <td>Күні</td>
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
    <script src="versions.js"></script>
</body>
</html>