<?php
    require_once("author.php");

    if ( $_SESSION['user_rights'] != 'ADMIN' ) {
        header("Location: login.php");
        exit();
    }

?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>Family tree</title>
</head>
<body>
    <div class="admin-conteiner">
        <a href="orders.php" class="admin__link">Пайдаланушылар құқық</a>
        <a href="access.php" class="admin__link">Пайдаланушылар кіру</a>
        <a href="versions.php" class="admin__link">Нұсқалары</a>
    </div>
</body>
</html>