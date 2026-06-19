<?php
// Enforce headers immediately to prevent Vercel lifecycle errors
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// Try your primary database filename first
$github_data_url = "https://raw.githubusercontent.com/hasanhabibmottakin/ASFAFLIX26/refs/heads/main/ns.m3u";

// Fetch the raw data cleanly from GitHub using cURL
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

// FALLBACK: If ns.m3u is empty, automatically try your alternative json filename
if (empty(trim($raw_content))) {
    $github_data_url = "https://raw.githubusercontent.com/hasanhabibmottakin/ASFAFLIX26/refs/heads/main/toffee_channel_data.json";
    $ch_alt = curl_init();
    curl_setopt($ch_alt, CURLOPT_URL, $github_data_url);
    curl_setopt($ch_alt, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch_alt, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch_alt, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch_alt, CURLOPT_ENCODING, '');
    $raw_content = curl_exec($ch_alt);
    curl_close($ch_alt);
}

// Map the continuous, un-wrapped {} blocks into indexed entries using global regex matching
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

// --- ROUTE 1: MAIN LANDING M3U PLAYLIST GENERATION ---
if (empty($id)) {
    header('Content-Type: application/vnd.apple.mpegurl');
    echo "#EXTM3U\n";
    foreach ($channels as $idx => $channel) {
        // Enforce the strict AndroidXMedia3 agent tag inside the playlist line natively
        echo '#EXTINF:-1 tvg-logo="' . $channel['logo'] . '" group-title="Toffee Live" user-agent="Toffee (Linux; AndroidXMedia3/1.1.1)",' . $channel['name'] . "\n";
        echo "https://" . $_SERVER['HTTP_HOST'] . "/?id=" . $idx . "\n";
    }
    exit;
}

// --- ROUTE 2: REDIRECT PLAYBACK WITH PERSISTENT HEADERS ---
if (isset($channels[$id])) {
    $stream_url = $channels[$id]['link'];
    $cookie = $channels[$id]['cookie'];
    
    // Inject streaming token straight into the browser context response header
    header("Set-Cookie: " . $cookie . "; path=/; domain=toffeelive.com; Secure; HttpOnly");
    
    // Use a 302 redirect sequence to push third-party players right to the destination content
    header("Location: " . $stream_url, true, 302);
    exit;
}

// --- ROUTE 3: ERROR HANDLING ---
header("HTTP/1.1 404 Not Found");
header('Content-Type: text/plain');
echo "Channel Not Found";
?>
