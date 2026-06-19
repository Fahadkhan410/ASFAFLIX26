<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// সার্ভার ব্লক এড়াতে ডাটা সরাসরি কোডের ভেতরেই রেখে দেওয়া হলো
$channels = [
    1 => [
        "name" => "Somoy TV",
        "logo" => "https://assets-prod.services.toffeelive.com//f_webp,w_1600,q_75/Xi_Ga5oBNnOkwJLWkhKP/posters/ef2899daee5-45f9b0b3ba80.png",
        "link" => "https://bldcmprod-cdn.toffeelive.com/cdn/live/somoy_tv/playlist.m3u8",
        "cookie" => "Edge-Cache-Cookie=URLPrefix=aHR0cHM6Ly9ibWRjbXByb2QtY2RuLnRvZmZlZWxpdmUuY29tL2NkbC9saXZlLw==:Expires=1782061882:KeyName=prod_linear:Signature=x40HifatfytMuqTXo2ED6M7ti5UXykqlH8SMLCjiyoUfgaawLqydipQV9JRF651e9Z1DT8JGjQWLEfMeT8Cg"
    ],
    2 => [
        "name" => "Channel i",
        "logo" => "https://assets-prod.services.toffeelive.com//qnv835oBcqunFHJBuQcB/posters/348dfac3-c1e0-485d-a72b-3d282c9e2c73.png",
        "link" => "https://bldcmprod-cdn.toffeelive.com/cdn/live/channel_i/playlist.m3u8",
        "cookie" => "Edge-Cache-Cookie=URLPrefix=aHR0cHM6Ly9ibWRjbXByb2QtY2RuLnRvZmZlZWxpdmUuY29tL2NkbC9saXZlLw==:Expires=1782061882:KeyName=prod_linear:Signature=x40HifatfytMuqTXo2ED6M7ti5UXykqlH8SMLCjiyoUfgaawLqydipQV9JRF651e9Z1DT8JGjQWLEfMeT8Cg"
    ],
    3 => [
        "name" => "ATN Bangla",
        "logo" => "https://assets-prod.services.toffeelive.com//NCLx35oBEef-9-uVh-Dg/posters/af9773c7-7971-41a2-9b78-121fcb240c48.png",
        "link" => "https://bldcmprod-cdn.toffeelive.com/cdn/live/atn_bangla/playlist.m3u8",
        "cookie" => "Edge-Cache-Cookie=URLPrefix=aHR0cHM6Ly9ibWRjbXByb2QtY2RuLnRvZmZlZWxpdmUuY29tL2NkbC9saXZlLw==:Expires=1782061002:KeyName=prod_linear:Signature=x40HifatfytMuqTXo2ED6M7ti5UXykqlH8SMLCjiyoUfgaawLqydipQV9JRF651e9Z1DT8JGjQWLEfMeT8Cg"
    ],
    4 => [
        "name" => "ATN News",
        "logo" => "https://assets-prod.services.toffeelive.com//w_320,q_75,f_webp/NCLx35oBEef-9-uVh-Dg/posters/af9773c7-7971-41a2-9b78-121fcb240c48.png",
        "link" => "https://bldcmprod-cdn.toffeelive.com/cdn/live/atn_news/playlist.m3u8",
        "cookie" => "Edge-Cache-Cookie=URLPrefix=aHR0cHM6Ly9ibWRjbXByb2QtY2RuLnRvZmZlZWxpdmUuY29tL2NkbC9saXZlLw==:Expires=1782061882:KeyName=prod_linear:Signature=x40HifatfytMuqTXo2ED6M7ti5UXykqlH8SMLCjiyoUfgaawLqydipQV9JRF651e9Z1DT8JGjQWLEfMeT8Cg"
    ],
    5 => [
        "name" => "Ekhon TV",
        "logo" => "https://assets-prod.services.toffeelive.com//w_320,q_75,f_webp/o3v235oBcqunFHJBkAdC/posters/159af631-796d-4342-a2a7-c272f32bcd32.png",
        "link" => "https://bldcmprod-cdn.toffeelive.com/cdn/live/ekhon_tv/playlist.m3u8",
        "cookie" => "Edge-Cache-Cookie=URLPrefix=aHR0cHM6Ly9ibWRjbXByb2QtY2RuLnRvZmZlZWxpdmUuY29tL2NkbC9saXZlLw==:Expires=1782061882:KeyName=prod_linear:Signature=x40HifatfytMuqTXo2ED6M7ti5UXykqlH8SMLCjiyoUfgaawLqydipQV9JRF651e9Z1DT8JGjQWLEfMeT8Cg"
    ]
];

$id = isset($_GET['id']) ? $_GET['id'] : '';

// --- রুট ১: প্রধান M3U প্লেলিস্ট জেনারেট করা ---
if (empty($id)) {
    header('Content-Type: application/vnd.apple.mpegurl');
    echo "#EXTM3U\n";
    foreach ($channels as $idx => $channel) {
        echo '#EXTINF:-1 tvg-logo="' . $channel['logo'] . '" group-title="Toffee Live" user-agent="Toffee (Linux; AndroidXMedia3/1.1.1)",' . $channel['name'] . "\n";
        echo "https://" . $_SERVER['HTTP_HOST'] . "/?id=" . $idx . "\n";
    }
    exit;
}

// --- রুট ২: প্লেয়ার রিডাইরেক্ট করা ---
if (isset($channels[$id])) {
    $stream_url = $channels[$id]['link'];
    $cookie = $channels[$id]['cookie'];
    
    header("Set-Cookie: " . $cookie . "; path=/; domain=toffeelive.com; Secure; HttpOnly");
    header("Location: " . $stream_url, true, 302);
    exit;
}

header("HTTP/1.1 404 Not Found");
header('Content-Type: text/plain');
echo "Channel Not Found";
?>
