<?php
    require_once('db.php');

    $db = new Db();

    if ( isset($_POST['sign-up']) ) {
        $name = $_POST['name'];
        $pass = $_POST['pass'];
        $d_pass = $_POST['d-pass'];

        if ( $pass != $d_pass ) $msg = 'Парольдер сәйкес келмейді';
        else {
            $link = $db->db_connect();
            $query = "SELECT * FROM `users` WHERE `name`='$name'";
            $result = mysqli_query($link, $query);
            if ( $result->num_rows > 0 ) $msg = 'Пайдаланушы қазірдің өзінде бар';
            else {
                $pass_md = md5($pass);
                $query = "INSERT INTO `users` (`user_name`, `user_pass`) VALUES ('$name', '$pass_md')";
                if (mysqli_query($link, $query)) {
                    header("Location: index.php");
                    exit();
                }
                $msg = 'Сервердегі қате';
            }
        }
    }

?>

<!DOCTYPE html>
<html lang="kz">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="author.css">
    <title>Тіркелу</title>
</head>
<body>
    <form action="" method="POST">
        <p>Тіркелу</p>
        <label>
            Аты-жөні
            <input type="text" name="name" required value="<?php echo $name; ?>">
        </label>
        <label>
            Құпия сөз
            <input type="pass" name="pass" required>
        </label>
        <label>
            Құпия сөз
            <input type="pass" name="d-pass" required>
        </label>
        <span><?php echo $msg; ?></span>
        <input type="submit" value="Готово" name="sign-up">
        <a href="index.php">Авторландыру</a>
    </form>
</body>
</html>