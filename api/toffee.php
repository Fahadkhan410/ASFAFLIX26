<?php
// 1. Tell the player it is receiving an M3U stream
header('Content-Type: application/x-mpegurl');

// 2. Fetch the JSON file containing your auto-updated links and cookies
// Change this link to your repository's raw JSON if you use a unique file
$json_url = "https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/toffee_channel_data.json";
$json_data = file_get_contents($json_url);
$data = json_decode($json_data, true);

// 3. Check what channel the player requested (e.g., toffee.php?id=atn_bangla)
$id = isset($_GET['id']) ? $_GET['id'] : '';

// 4. Default playlist view if no channel ID is requested
if (empty($id)) {
    echo "#EXTM3U\n";
    foreach ($data['channels'] as $slug => $channel) {
        $name = isset($channel['name']) ? $channel['name'] : $slug;
        $logo = isset($channel['logo']) ? $channel['logo'] : '';
        echo '#EXTINF:-1 tvg-logo="' . $logo . '",' . $name . "\n";
        echo "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['SCRIPT_NAME'] . "?id=" . $slug . "\n";
    }
    exit;
}

// 5. If a channel ID matches, fetch the active cookie & stream link dynamically
if (isset($data['channels'][$id])) {
    $stream_url = $data['channels'][$id]['link'];
    $cookie = $data['channels'][$id]['cookie'];

    // Proxy the stream chunks using curl with proper Toffee headers
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