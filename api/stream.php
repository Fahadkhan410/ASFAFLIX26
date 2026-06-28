<?php
// Ensure errors are hidden from the browser but don't halt compiling
error_reporting(0);
ini_set('display_errors', 0);

// 1. Target URL setup
$baseUrl = "http://180.94.28.28:8097/PTV-Sports/index.m3u8";
$currentToken = "YOUR_ACTIVE_TOKEN_HERE"; // Make sure this is updated!
$targetUrl = $baseUrl . "?token=" . $currentToken;

// 2. Standard HLS Response Headers
header('Content-Type: application/x-mpegURL');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// 3. Simple stream fetch
$playlistContent = file_get_contents($targetUrl);

if ($playlistContent === FALSE) {
    echo "#EXTM3U\n#EXT-X-ERROR: Source stream unavailable or token expired.";
    exit;
}

// 4. Rewrite absolute chunk URLs
$streamPath = "http://180.94.28.28:8097/PTV-Sports/";
$rewrittenContent = preg_replace('/^(?!http)(.+)$/m', $streamPath . '$1?token=' . $currentToken, $playlistContent);

// 5. Return output
echo $rewrittenContent;
exit;
