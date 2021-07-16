<?php 
    session_start();
    $phone = $_POST['phone'];
    $msg = 'Шежіре туралы мәліметтерді WhatsApp +7(702)342-52-79 нөмері арқылы алуға болады.';
    if ( isset($_POST['order']) ) {
        $headers = "Content-type: text/html; charset='utf-8'\n";
        $mail = 'Новая заявка на получение прав с сайта baijigit.kz. ';
        $mail .= 'Пользователь '.$_SESSION['user_name'].' хочет получить доступ к просмотру. ';
        if ( strlen($phone) > 0 ) $mail .= 'Телефон для связи '.$phone.'.';
        mail('han_togas@mail.ru', 'Baijigit', $mail, $headers);
        $msg = 'Өтінім жіберілді';
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
    <form action="" method="POST" style="max-width: 600px">
        <p>"ТОҒАС ХАН ҰРПАҚТАРЫ"-шежіре кітабі.</p>
        <p><?php echo $msg ?></p>
        <label>
            Телефон
            <input type="text" name="phone" required value="<?php echo $phone; ?>">
        </label>
        <input type="submit" value="Кіру" name="order">
        <a href="login.php">Авторландыру</a>
    </form>
</body>

</html>