<?php
    require_once('db.php');
    $db = new Db();
    $link = $db->db_connect();
    
    session_start();
    if ( isset($_SESSION['user_id']) ) {
        $user = $_SESSION['user_id'];
        $query = "SELECT `user_rights` from `users` WHERE `user_id`='$user'";
        $result = mysqli_query($link, $query);
        $_SESSION['user_rights'] = mysqli_fetch_all($result, MYSQLI_ASSOC)[0]['user_rights'];
    }