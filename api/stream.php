<?php
// api/stream.php

// Disable execution time limits for the serverless function
set_time_limit(0);

// 1. Define your base stream URL (without the token)
$baseUrl = "http://180.94.28.28:8097/PTV-Sports/index.m3u8";

// 2. Insert your active token
$currentToken = "YOUR_ACTIVE_TOKEN_HERE"; 
$targetUrl = $baseUrl . "?token=" . $currentToken;

// 3. Set standard HLS headers
header('Content-Type: application/x-mpegURL');
header('Cache-Control: no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *'); 

// 4. Fetch the stream using cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
$playlistContent = curl_exec($ch);
curl_close($ch);

if ($playlistContent === FALSE) {
    header("HTTP/1.0 500 Internal Server Error");
    echo "#EXTM3U\n#EXT-X-ERROR: Unable to fetch stream source.";
    exit;
}

// 5. Rewrite chunk paths to point back to the original source with the token appended
$streamPath = "http://180.94.28.28:8097/PTV-Sports/";
$rewrittenContent = preg_replace('/^(?!http)(.+)$/m', $streamPath . '$1?token=' . $currentToken, $playlistContent);

// 6. Output the updated playlist
echo $rewrittenContent;
?>
