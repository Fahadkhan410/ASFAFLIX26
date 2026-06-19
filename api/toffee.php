<?php
// Set headers so IPTV players read this cleanly as an M3U stream
header('Content-Type: application/vnd.apple.mpegurl');
header('Access-Control-Allow-Origin: *');

// The live auto-updating data URL containing your JSON layout
$github_data_url = "https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u";

// Fetch the raw JSON content from GitHub
$ch_main = curl_init();
curl_setopt($ch_main, CURLOPT_URL, $github_data_url);
curl_setopt($ch_main, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_main, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch_main, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch_main, CURLOPT_HTTPHEADER, array(
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
));
$raw_content = curl_exec($ch_main);
curl_close($ch_main);

// Fallback alternative file reader if curl encounters cross-origin platform blocks
if (empty($raw_content)) {
    $options = array(
        'http' => array(
            'method' => "GET",
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n"
        )
    );
    $context = stream_context_create($options);
    $raw_content = @file_get_contents($github_data_url, false, $context);
}

// Decode the JSON list safely into clean arrays
$channels_array = json_decode($raw_content, true);

// Handle formatting discrepancies if the raw content needs wrapper correction
if (empty($channels_array) && !empty($raw_content)) {
    // If your file has missing bounding brackets, fix it on the fly
    if (substr(trim($raw_content), 0, 1) !== '[') {
        $fixed_json = '[' . rtrim(trim($raw_content), ',') . ']';
        $channels_array = json_decode($fixed_json, true);
    }
}

// Map channels array with numerical ID indexes
$channels = [];
if (is_array($channels_array)) {
    $index = 1;
    foreach ($channels_array as $channel) {
        if (isset($channel['link'])) {
            $channels[$index] = [
                'name'   => isset($channel['name']) ? $channel['name'] : "Channel " . $index,
                'logo'   => isset($channel['logo']) ? $channel['logo'] : "",
                'link'   => trim($channel['link']),
                'cookie' => isset($channel['cookie']) ? trim($channel['cookie']) : ""
            ];
            $index++;
        }
    }
}

$id = isset($_GET['id']) ? $_GET['id'] : '';

// IF NO ID IS PASSED: Loop and export the whole M3U playlist structure to your player
if (empty($id)) {
    echo "#EXTM3U\n";
    foreach ($channels as $idx => $channel) {
        echo '#EXTINF:-1 tvg-logo="' . $channel['logo'] . '" group-title="Toffee Live",' . $channel['name'] . "\n";
        echo "https://" . $_SERVER['HTTP_HOST'] . "/?id=" . $idx . "\n";
    }
    exit;
}

// IF A CHANNEL ID IS PASSED: Intercept streaming headers and proxy authorization token keys
if (isset($channels[$id])) {
    $stream_url = $channels[$id]['link'];
    $cookie = $channels[$id]['cookie'];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $stream_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        "Cookie: " . $cookie,
        "User-Agent: Toffee (Linux; AndroidXMedia3/1.1.1)"
    ));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    echo $response;
    exit;
}

header("HTTP/1.1 404 Not Found");
echo "Channel Not Found";
?>
