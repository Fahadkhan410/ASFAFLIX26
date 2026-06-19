<?php
header('Content-Type: application/vnd.apple.mpegurl');
header('Access-Control-Allow-Origin: *');

// The live auto-updating M3U URL containing all your channels
$github_m3u_url = "https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u";

// Fetch the entire live playlist text from GitHub (with User-Agent to avoid blocks)
$ch_main = curl_init();
curl_setopt($ch_main, CURLOPT_URL, $github_m3u_url);
curl_setopt($ch_main, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_main, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch_main, CURLOPT_SSL_VERIFYPEER, false); // Bypasses SSL handshake blocks
curl_setopt($ch_main, CURLOPT_HTTPHEADER, array(
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
));
$m3u_content = curl_exec($ch_main);
curl_close($ch_main);

// If curl fails or returns nothing, fall back to simple file_get_contents
if (empty($m3u_content)) {
    // Create custom header context to mimic a browser
    $options = array(
        'http' => array(
            'method' => "GET",
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n"
        )
    );
    $context = stream_context_create($options);
    $m3u_content = @file_get_contents($github_m3u_url, false, $context);
}

// Parse the M3U content into lines
$lines = explode("\n", str_replace("\r", "", trim($m3u_content)));
$channels = [];
$current_extinf = '';
$index = 1;

// A robust loop that pairs any #EXTINF line directly with its following link
foreach ($lines as $line) {
    $line = trim($line);
    if (empty($line)) continue;

    if (strpos($line, '#EXTINF:') === 0) {
        $current_extinf = $line;
    } elseif (strpos($line, 'http') === 0 && !empty($current_extinf)) {
        // Create a unique numbered ID for each channel to make routing foolproof
        $channels[$index] = [
            'extinf' => $current_extinf,
            'link'   => $line,
            'cookie' => 'Edge-Cache-Cookie=URLPrefix=aHR0cHM6Ly9ibGRjbXByb2QtY2RuLnRvZmZlZWxpdmUuY29t:Expires=1782061882:KeyName=prod_linear:Signature=x4OhIfatfEytMuqTXo2ED6M7ti5UXykqlH85MLCjiyoUFgaawLqYdipQV93RF65lE9Z1DT8J3gjQWLEFWeTBCg'
        ];
        $index++;
        $current_extinf = ''; // Reset for next channel
    }
}

$id = isset($_GET['id']) ? $_GET['id'] : '';

// IF NO ID IS PASSED: Output ALL channels with index numbers mapped to Vercel URLs
if (empty($id)) {
    echo "#EXTM3U\n";
    foreach ($channels as $idx => $channel) {
        echo $channel['extinf'] . "\n";
        echo "https://" . $_SERVER['HTTP_HOST'] . "/?id=" . $idx . "\n";
    }
    exit;
}

// IF A CHANNEL ID IS PASSED: Stream that specific video link with active cookies
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
