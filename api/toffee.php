<?php
// Set explicit headers so video engines interpret this as a real live stream
header('Content-Type: application/vnd.apple.mpegurl');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');

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

$channels_array = json_decode($raw_content, true);

if (empty($channels_array) && !empty($raw_content)) {
    if (substr(trim($raw_content), 0, 1) !== '[') {
        $fixed_json = '[' . rtrim(trim($raw_content), ',') . ']';
        $channels_array = json_decode($fixed_json, true);
    }
}

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

// IF NO ID IS PASSED: Output the master M3U file cleanly
if (empty($id)) {
    echo "#EXTM3U\n";
    foreach ($channels as $idx => $channel) {
        // Embed the specific custom Toffee user-agent tag parameters natively inside the playlist block
        echo '#EXTINF:-1 tvg-logo="' . $channel['logo'] . '" group-title="Toffee Live" user-agent="Toffee (Linux; AndroidXMedia3/1.1.1)",' . $channel['name'] . "\n";
        echo "https://" . $_SERVER['HTTP_HOST'] . "/?id=" . $idx . "\n";
    }
    exit;
}

// IF A CHANNEL ID IS PASSED: Serve as a reverse proxy, embedding cookies securely inside the stream download request
if (isset($channels[$id])) {
    $stream_url = $channels[$id]['link'];
    $cookie = $channels[$id]['cookie'];
    
    // Extract base URL directory structure to rewrite relative manifest tracks later
    $base_url = substr($stream_url, 0, strrpos($stream_url, '/') + 1);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $stream_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        "Cookie: " . $cookie,
        "User-Agent: Toffee (Linux; AndroidXMedia3/1.1.1)",
        "Origin: https://toffeelive.com",
        "Referer: https://toffeelive.com/"
    ));
    
    $manifest_data = curl_exec($ch);
    curl_close($ch);
    
    // CRITICAL: Reconstruct relative .m3u8 lines into absolute links so your player knows exactly where to request chunks
    if (!empty($manifest_data)) {
        $lines = explode("\n", $manifest_data);
        foreach ($lines as &$line) {
            $line = trim($line);
            if (!empty($line) && strpos($line, '#') !== 0 && strpos($line, 'http') !== 0) {
                // If it's a relative pathway (like ../slang/mono.m3u8), clean it up and append base URL
                if (strpos($line, '../') === 0) {
                    $cleaned_base = substr($base_url, 0, -1); 
                    $cleaned_base = substr($cleaned_base, 0, strrpos($cleaned_base, '/') + 1);
                    $line = $cleaned_base . str_replace('../', '', $line);
                } else {
                    $line = $base_url . $line;
                }
            }
        }
        $manifest_data = implode("\n", $lines);
    }
    
    echo $manifest_data;
    exit;
}

header("HTTP/1.1 404 Not Found");
echo "Channel Not Found";
?>
