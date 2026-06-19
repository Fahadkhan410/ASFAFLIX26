<?php
// Set headers so IPTV players read this cleanly as an M3U stream
header('Content-Type: application/vnd.apple.mpegurl');
header('Access-Control-Allow-Origin: *');

// The live auto-updating M3U URL containing all your channels
$github_m3u_url = "https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u";

// Fetch the entire live playlist text from GitHub
$ch_main = curl_init();
curl_setopt($ch_main, CURLOPT_URL, $github_m3u_url);
curl_setopt($ch_main, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_main, CURLOPT_FOLLOWLOCATION, true);
$m3u_content = curl_exec($ch_main);
curl_close($ch_main);

// Check if a specific channel request is called (e.g., /?id=atn_bangla or /?id=1)
$id = isset($_GET['id']) ? $_GET['id'] : '';

// Parse the M3U content into lines
$lines = explode("\n", str_replace("\r", "", $m3u_content));
$channels = [];
$current_extinf = '';

// Loop through lines to structure channels, links, and cookies
foreach ($lines as $line) {
    if (strpos($line, '#EXTINF:') === 0) {
        $current_extinf = $line;
    } elseif (strpos($line, 'http') === 0) {
        // Extract channel identifier name/slug from the URL safely
        preg_match('/\/live\/([^\/]+)\//', $line, $matches);
        $slug = isset($matches[1]) ? $matches[1] : md5($line);
        
        // Check if the next line or current entry contains a cookie string
        $channels[$slug] = [
            'extinf' => $current_extinf,
            'link'   => trim($line),
            // Look for inline cookie data if your file appends it, or defaults to your specific Toffee token
            'cookie' => 'Edge-Cache-Cookie=URLPrefix=aHR0cHM6Ly9ibGRjbXByb2QtY2RuLnRvZmZlZWxpdmUuY29t:Expires=1782061882:KeyName=prod_linear:Signature=x4OhIfatfEytMuqTXo2ED6M7ti5UXykqlH85MLCjiyoUFgaawLqYdipQV93RF65lE9Z1DT8J3gjQWLEFWeTBCg'
        ];
    }
}

// IF NO ID IS PASSED: Output ALL channels converted to route through Vercel
if (empty($id)) {
    echo "#EXTM3U\n";
    foreach ($channels as $slug => $channel) {
        echo $channel['extinf'] . "\n";
        echo "https://" . $_SERVER['HTTP_HOST'] . "/?id=" . $slug . "\n";
    }
    exit;
}

// IF A CHANNEL ID IS PASSED: Stream that specific video link with active cookies
if (isset($channels[$id])) {
    $stream_url = $channels[$id]['link'];
    $cookie = $channels[$id]['cookie'];
    
    // Connect to the stream manifest directly with dynamic signatures
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

header("HTTP/1.1 404 Not Found");
echo "Channel Not Found";
?>
