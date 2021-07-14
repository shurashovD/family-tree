<?php
    require_once('db.php');

    if ( isset($_POST['sign-in']) ) {
        $name = $_POST['name'];
        $pass = $_POST['pass'];
        $pass_md = md5($pass);

        $db = new Db();

        $link = $db->db_connect();
        $query = "SELECT * FROM `users` WHERE `user_name`='$name' AND `user_pass`='$pass_md'";
        $result = mysqli_query($link, $query);
        if ( $result->num_rows == 0 ) $msg = 'Қате логин/пароль';
        else {
            $result = mysqli_fetch_all($result, MYSQLI_ASSOC)[0];
            session_start();
            $_SESSION['user_id'] = $result['user_id'];
            $_SESSION['user_name'] = $result['user_name'];
            $_SESSION['user_rights'] = $result['user_rights'];
            ($result['user_rights'] == 'block') ? header("Location: block.php") : header("Location: index.php");
            exit();
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
    <title>Кіру</title>
</head>
<body>
    <form action="" method="POST">
        <p>Кіру</p>
        <label>
            Аты-жөні
            <input type="text" name="name" required value="<?php echo $name; ?>">
        </label>
        <label>
            Құпия сөз
            <input type="pass" name="pass" required>
        </label>
        <span><?php echo $msg; ?></span>
        <input type="submit" value="Кіру" name="sign-in">
        <a href="register.php">Тіркелу</a>
    </form>
</body>
</html>