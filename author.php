<?php
    session_start();
    if ( isset($_SESSION['user_id']) ) {
        $user = $_SESSION['user_id'];
    }