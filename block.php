<?php 
    session_start();
    $phone = $_POST['phone'];
    $msg = '';
    if ( isset($_POST['order']) ) {
        $headers = "Content-type: text/html; charset='utf-8'\n";
        $msg = 'Новая заявка на получение прав с сайта baijigit.kz. ';
        $msg = 'Пользователь '.$_SESSION['user_name'].' хочет получить доступ к просмотру. ';
        if ( strlen($phone) > 0 ) $msg .= 'Телефон для связи '.$phone.'.';
        mail('shurashovd@yandex.ru', 'Baijigit', $msg, $headers);
    }
?>

<!DOCTYPE html>
<html lang="kz">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="author.css">
    <title>Кіру</title>
</head>

<body>
    <form action="" method="POST">
        <p>У пользователя <?php echo $_SESSION['user_name'] ?> нет прав на просмотр</p>
        <p>Оставьте заявку на получение доступа</p>
        <label>
            Телефон
            <input type="text" name="phone" required value="<?php echo $phone; ?>">
        </label>
        <input type="submit" value="Кіру" name="order">
        <a href="login.php">Авторландыру</a>
        Телефон для связи с администратором <a href="tel:+79111111111">+7495</a>
    </form>
</body>

</html>