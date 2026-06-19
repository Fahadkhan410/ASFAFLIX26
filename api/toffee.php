<?php
// Enforce clean headers immediately before any payload outputs
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// 1. Point directly to your active repository asset stream
$github_data_url = "https://raw.githubusercontent.com/hasanhabibmottakin/ASFAFLIX26/refs/heads/main/toffee_channel_data.json";

// 2. Extract raw data safely using cURL
$ch_main = curl_init();
curl_setopt($ch_main, CURLOPT_URL, $github_data_url);
curl_setopt($ch_main, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_main, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch_main, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch_main, CURLOPT_ENCODING, ''); 
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

// 3. Process the un-wrapped object strings cleanly using global regex matching
$channels = [];
$index = 1;

if (!empty($raw_content)) {
    preg_match_all('/\{[^}]+\}/', $raw_content, $matches);
    if (!empty($matches[0])) {
        foreach ($matches[0] as $json_block) {
            $channel = json_decode($json_block, true);
            if (isset($channel['link'])) {
                $channels[$index] = [
                    'name'   => isset($channel['name']) ? trim($channel['name']) : "Channel " . $index,
                    'logo'   => isset($channel['logo']) ? trim($channel['logo']) : "",
                    'link'   => trim($channel['link']),
                    'cookie' => isset($channel['cookie']) ? trim($channel['cookie']) : ""
                ];
                $index++;
            }
        }
    }
}

$id = isset($_GET['id']) ? $_GET['id'] : '';

// --- ROUTE 1: OUTPUT UNIFORM MASTER M3U PLAYLIST MAP ---
if (empty($id)) {
    header('Content-Type: application/vnd.apple.mpegurl');
    echo "#EXTM3U\n";
    foreach ($channels as $idx => $channel) {
        // Embed the specific custom user-agent parameters to enforce it on downstream devices
        echo '#EXTINF:-1 tvg-logo="' . $channel['logo'] . '" group-title="Toffee Live" user-agent="Toffee (Linux; AndroidXMedia3/1.1.1)",' . $channel['name'] . "\n";
        echo "https://" . $_SERVER['HTTP_HOST'] . "/?id=" . $idx . "\n";
    }
    exit;
}

// --- ROUTE 2: DIRECT CHANNEL REDIRECT FOR MEDIA APP ENGINES ---
if (isset($channels[$id])) {
    $stream_url = $channels[$id]['link'];
    $cookie = $channels[$id]['cookie'];
    
    // Inject the exact authorization token payload directly into the active tracking window
    header("Set-Cookie: " . $cookie . "; path=/; domain=toffeelive.com; Secure; HttpOnly");
    
    // Fire a clean 302 stream location hop 
    header("Location: " . $stream_url, true, 302);
    exit;
}

// --- ROUTE 3: FALLBACK STANDARD EXCEPTION ---
header("HTTP/1.1 404 Not Found");
header('Content-Type: text/plain');
echo "Channel Not Found";
?>
