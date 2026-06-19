<?php
// Force proper M3U8 headers so streaming players read it cleanly
header('Content-Type: application/vnd.apple.mpegurl');
header('Access-Control-Allow-Origin: *');

$json_file = __DIR__ . '/../toffee_channel_data.json'; 
if (!file_exists($json_file)) {
    $json_file = __DIR__ . '/toffee_channel_data.json';
}

if (file_exists($json_file)) {
    $json_data = file_get_contents($json_file);
    $data = json_decode($json_data, true);
} else {
    $data = array('channels' => array());
}

$id = isset($_GET['id']) ? $_GET['id'] : '';

if (empty($id)) {
    echo "#EXTM3U\n";
    foreach ($data['channels'] as $slug => $channel) {
        $name = isset($channel['name']) ? $channel['name'] : $slug;
        $logo = isset($channel['logo']) ? $channel['logo'] : '';
        echo '#EXTINF:-1 tvg-logo="' . $logo . '",' . $name . "\n";
        echo "https://" . $_SERVER['HTTP_HOST'] . "/?id=" . $slug . "\n";
    }
    exit;
}

if (isset($data['channels'][$id])) {
    $stream_url = $data['channels'][$id]['link'];
    $cookie = $data['channels'][$id]['cookie'];

    // Use CURL to fetch the adaptive streaming manifest map safely
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $stream_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        "Cookie: " . $cookie,
        "User-Agent: Toffee (Linux; AndroidXMedia3/1.1.1)"
    ));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    echo $response;
    exit;
}

echo "Channel Not Found";
?>
