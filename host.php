<?php
    require_once('author.php');

    require_once('db.php');

    $db = new Db();

    if ( isset($_GET['get-tree']) ) {
        $link = $db->db_connect();
        $query = "SELECT * FROM `actual` WHERE `parentId` IS NOT NULL ORDER BY `parentId`";
        $response = mysqli_query($link, $query);
        exit( json_encode(mysqli_fetch_all($response, 1)) );
    }

    if ( isset($_POST['insert-data']) ) {
        $msg_to_client = 'Сәтті сақталды';
        $link = $db->db_connect();
        $json_data = $_POST['insert-data'];
        $data = json_decode($_POST['insert-data'], true);

        $count = count($data);
        $query = "UPDATE `counter` SET `counter`=(`counter` + '$count')";
        if ( mysqli_query($link, $query) ) {
            $query = "SELECT `counter` FROM `counter`";
            $last_id = mysqli_fetch_all( mysqli_query($link, $query), MYSQLI_ASSOC )[0]['counter'];
        }

        $query = "INSERT INTO `actual`(`id`, `parentId`, `name`, `men`, `birth`, `dead`, `wed`, `history`, `creator`) VALUES";
        foreach ($data as $node) {
            $id = $last_id - (--$count);
            $parentId = $node['parentId'];
            $name = $node['name'];
            $men = $node['men'];
            $query .= " ('$id', '$parentId', '$name', '$men', null, null, '', '', '$user'),";
        }
        $query = trim($query, ",");
        mysqli_query($link, $query);

        $query = "SELECT * FROM `actual` ORDER BY `parentId`";
        $result = mysqli_query($link, $query);
        exit( json_encode([
            "tree"      => mysqli_fetch_all($result, MYSQLI_ASSOC),
            "result"    => $msg_to_client
        ]) );
    }

    if ( isset($_POST['update-data']) ) {
        $link = $db->db_connect();
        $data = json_decode($_POST['update-data'], 1);
        $id = $data['id'];
        $name = $data['name'];
        $men = $data['men'];
        $query = "UPDATE `actual` SET `name`='$name',`men`='$men' WHERE `id`='$id'";
        mysqli_query($link, $query);

        $query = "SELECT * FROM `actual` ORDER BY `id`";
        $result = mysqli_query($link, $query);
        exit( json_encode([
            "tree" => mysqli_fetch_all($result, MYSQLI_ASSOC)
        ]) );
    }

    if ( isset($_GET['delete-data']) ) {
        $link = $db->db_connect();
        $id = $_GET['delete-data'];
        $query = "DELETE FROM `actual` WHERE `id`='$id'";
        mysqli_query($link, $query);

        $query = "SELECT * FROM `actual` ORDER BY `parentId`";
        $result = mysqli_query($link, $query);
        exit( json_encode([
            "tree" => mysqli_fetch_all($result, MYSQLI_ASSOC)
        ]) );
    }

    if ( isset($_GET['get-rights']) ) {
        $link = $db->db_connect();
        if ( ($_SESSION['user_rights'] == 'full') || ($_SESSION['user_rights'] == 'ADMIN') ) exit( json_encode(["ADMIN"]) );
        $query = "SELECT `order_begin`, `addit`, `edit`, `del` FROM `orders` WHERE `order_user`='$user' AND `viewed`='1'";
        $result = mysqli_query($link, $query);
        $result = mysqli_fetch_all($result, MYSQLI_ASSOC);
        exit( json_encode($result) );
    }

    if ( isset($_GET['get-users']) ) {
        $link = $db->db_connect();
        $query = "SELECT * FROM `users` WHERE `user_rights`!='ADMIN'";
        $result = mysqli_query($link, $query);
        $result = mysqli_fetch_all($result, MYSQLI_ASSOC);
        exit( json_encode($result) );
    }

    if ( isset($_POST['change-user-rights']) ) {
        $link = $db->db_connect();
        $user_id = $_POST['user-id'];
        $rights = $_POST['new-right'];
        $query = "UPDATE `users` SET `user_rights`='$rights' WHERE `user_id`='$user_id'";
        mysqli_query($link, $query);
        
        $query = "SELECT * FROM `users` WHERE `user_rights`!='ADMIN'";
        $result = mysqli_query($link, $query);
        $result = mysqli_fetch_all($result, MYSQLI_ASSOC);
        exit( json_encode($result) );
    }

    if ( isset($_GET['query-rights']) ) {
        $link = $db->db_connect();
        if ( ($_SESSION['user_rights'] == 'full') || ($_SESSION['user_rights'] == 'ADMIN') ) exit( json_encode(["msg" => 'Толық құқықтар тағайындалды']) );
        $id = $_GET['query-rights'];
        $phone = $_GET['phone'];
        $query = "SELECT * FROM `orders` WHERE `order_user`='$user' AND `order_begin`='$id' AND `viewed`='0'";
        $result = mysqli_query($link, $query);
        if ( $result->num_rows != 0 )
        exit( json_encode(["msg" => 'Өтініш қазірдің өзінде бар']) );

        $from = 'mimoza54@mimoza54.ru';
        $headers = "Content-type: text/html; charset='utf-8'\n";
        #$headers .= "From: $from\nReply-To: $from\n";
        $msg = 'Новая заявка на получение прав с сайта baijigit.kz. ';
        $msg .= 'Телефон для связи '.$phone.'.';
        mail('han_togas@mail.ru', 'Baijigit', $msg, $headers);

        $order_date = date("Y-m-d");
        $query = "INSERT INTO `orders`(`order_user`, `order_date`, `order_begin`, `order_phone`) VALUES ('$user', '$order_date', '$id', '$phone')";
        if ( mysqli_query($link, $query) ) exit( json_encode(["msg" => 'Өтінім қабылданды']) );
        exit( json_encode(["msg" => 'Сервердегі қате']) );
    }

    if ( isset($_GET['get-orders']) ) {
        $link = $db->db_connect();
        $query = "SELECT `order_id`, `user_name`, `order_date`, `name`, `addit`, `edit`, `del`, `order_phone` FROM `orders` as t1 ";
        $query .= "JOIN `users` as t2 JOIN `actual` as t3 WHERE t1.order_user=t2.user_id AND t1.order_begin=t3.id";
        $result = mysqli_query($link, $query);
        $result = mysqli_fetch_all($result, MYSQLI_ASSOC);
        exit( json_encode($result) );
    }

    if ( isset($_POST['update-order']) ) {
        $link = $db->db_connect();
        $id = $_POST['update-order'];
        $addit = $_POST['addit'];
        $edit = $_POST['edit'];
        $del = $_POST['del'];
        $date = date("Y-m-d");
        $query = "UPDATE `orders` SET `order_date`='$date',`addit`='$addit',`edit`='$edit',`del`='$del',`viewed`='1' WHERE `order_id`='$id'";
        if ( mysqli_query($link, $query) ) exit( json_encode(["success"]) );
        exit( json_encode(["error"]) );
    }

    if (  isset($_POST['delete-order']) ) {
        $link = $db->db_connect();
        $id = $_POST['delete-order'];
        $query = "DELETE FROM `orders` WHERE `order_id`='$id'";
        if ( mysqli_query($link, $query) ) exit( json_encode(["success"]) );
        exit( json_encode(["error"]) );
    }

    if ( isset($_GET['logout']) ) {
        $_SESSION = [];
        session_destroy();
        exit( json_encode(["location" => 'login.php']) );
    }

    if ( isset($_POST['create-version']) ) {
        $msg_to_client = ["state" => 'Сервердегі қате'];

        $link = $db->db_connect();
        $content = $_POST['create-version'];
        $date = date("Y-m-d H:i:s");

        $query = "UPDATE `versions` SET `v_actual`=0";
        mysqli_query($link, $query);

        $query = "INSERT INTO `versions`(`v_user`, `v_date`, `v_content`, `v_actual`) VALUES ('$user', '$date', '$content', '1')";
        if (mysqli_query($link, $query)) $msg_to_client['state'] = 'Нұсқа жасалды';
        exit( json_encode( $msg_to_client ) );
    }

    if ( isset($_GET['get-versions']) ) {
        $link = $db->db_connect();
        $start_date = $_GET['start'];
        $finish_date = $_GET['finish'];
        $query = "SELECT `v_id`, `user_name`, `v_date`, `v_actual` FROM `versions` as t1 JOIN `users` as t2 WHERE t1.v_user=t2.user_id";
        if ( isset($_GET['start']) && isset($_GET['finish']) )
        $query .= " AND `v_date` BETWEEN '$start_date' AND '$finish_date'";
        $result = mysqli_query($link, $query);
        $result = mysqli_fetch_all($result, MYSQLI_ASSOC);
        exit( json_encode($result) );
    }

    if ( isset($_GET['set-version']) ) {
        $flag = true;
        $link = $db->db_connect();
        $v_id = $_GET['set-version'];

        $query = "SELECT `v_content` FROM `versions` WHERE `v_id`='$v_id'";
        $result = mysqli_query($link, $query);
        if ( $result->num_rows == 0 ) exit( json_encode(["Сервердегі қате"]) );
        $result_json = mysqli_fetch_all($result, MYSQLI_ASSOC)[0]['v_content'];  
        
        $query = "DELETE FROM `actual`";
        if ( !mysqli_query($link, $query) ) exit( json_encode(["Сервердегі қате"]) );

        $actual = json_decode($result_json, 1);
        $count = 0;
        foreach ($actual as $value) {
            $id = $value['id'];
            $parentId = $value['parentId'];
            $name = $value['name'];
            $men = $value['men'];
            $wed = $value['wed'];
            $history = $value['history'];
            $query = "INSERT INTO `actual`(`id`,`parentId`, `name`, `men`, `wed`, `history`, `creator`) ";
            $query .= "VALUES ('$id','$parentId','$name','$men','$wed','$history','1')";
            if ( mysqli_query($link, $query) ) $count++;
        }

        $query = "UPDATE `versions` SET `v_actual`='0'";
        if ( !mysqli_query($link, $query) ) $flag = false;
        $query = "UPDATE `versions` SET `v_actual`='1' WHERE `v_id`='$v_id'";
        if ( !mysqli_query($link, $query) ) $flag = false;

        if ( !$flag ) exit( json_encode(["Деректер қалпына келтірілмеген. Қалпына келтірілді ".$count." жазбалар."]) );
        exit( json_encode(["Деректер қалпына келтірілді. Қалпына келтірілді ".$count." жазбалар."]) );
    }

    if ( isset($_GET['get-attachments']) ) {
        $end_path = $_GET['get-attachments'];
        $files = @scandir("./attachments/".$end_path);
        if ( !$files ) exit( json_encode([]) );
        $msg_to_client = [];
        foreach ($files as $file) {
            if ( ($file == '.')||$file == '..' ) continue;
            array_push($msg_to_client, "./attachments/".$end_path."/".$file);
        }
        exit( json_encode($msg_to_client) );
    }

    if ( isset($_POST['send-attachments']) ) {
        $folder = $_POST['folder'];
        $path = "./attachments/".$folder;
        if ( !is_dir($path) )
        mkdir($path);
        foreach ($_FILES["pictures"]["error"] as $key => $error) {
            if ($error == UPLOAD_ERR_OK) {
                $tmp_name = $_FILES["pictures"]["tmp_name"][$key];
                $name = basename($_FILES["pictures"]["name"][$key]);
                move_uploaded_file($tmp_name, $path."/".$name);
            }
        }
        exit();
    }

    if ( isset($_GET['del-attac']) ) {
        unlink("./attachments/".$_GET['folder']."/".$_GET['del-attac']);
        exit();
    }