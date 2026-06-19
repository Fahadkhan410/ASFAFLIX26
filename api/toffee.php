<?php
// হেডারগুলো সেট করা হচ্ছে যেন প্লেয়ার সহজে পড়তে পারে
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// আপনার গিটহাবের রJson ফাইলের সঠিক লিংক
$github_data_url = "https://raw.githubusercontent.com/hasanhabibmottakin/ASFAFLIX26/refs/heads/main/ns.m3u";

// ব্রাউজারের মতো করে ডাটা রিড করার জন্য ইউজার এজেন্ট সেটআপ
$opts = [
    "http" => [
        "method" => "GET",
        "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n" .
                    "Accept-Encoding: gzip, deflate\r\n"
    ],
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false,
    ]
];
$context = stream_context_create($opts);
$raw_content = @file_get_contents($github_data_url, false, $context);

// যদি ডাটা জিপ (Gzip) করা থাকে, তা ডিকোড করার ব্যবস্থা
if (function_exists('gzdecode') && !empty($raw_content)) {
    $decoded = @gzdecode($raw_content);
    if ($decoded !== false) {
        $raw_content = $decoded;
    }
}

// ডাটা থেকে চ্যানেলগুলো আলাদা করার রেগুলার এক্সপ্রেশন
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

// --- ১ নম্বর রুট: মেইন প্লেলিস্ট জেনারেট করা (কোনো ID না থাকলে) ---
if (empty($id)) {
    header('Content-Type: application/vnd.apple.mpegurl');
    echo "#EXTM3U\n";
    foreach ($channels as $idx => $channel) {
        echo '#EXTINF:-1 tvg-logo="' . $channel['logo'] . '" group-title="Toffee Live" user-agent="Toffee (Linux; AndroidXMedia3/1.1.1)",' . $channel['name'] . "\n";
        echo "https://" . $_SERVER['HTTP_HOST'] . "/?id=" . $idx . "\n";
    }
    exit;
}

// --- ২ নম্বর রুট: চ্যানেল প্লে করার জন্য রিডাইরেক্ট করা ---
if (isset($channels[$id])) {
    $stream_url = $channels[$id]['link'];
    $cookie = $channels[$id]['cookie'];
    
    // টফির রিকোয়েস্ট কুকি এবং ইউজার এজেন্ট রিডাইরেক্টে পাঠানো
    header("Set-Cookie: " . $cookie . "; path=/; domain=toffeelive.com; Secure; HttpOnly");
    header("Location: " . $stream_url, true, 302);
    exit;
}

// --- ৩ নম্বর রুট: এরর হ্যান্ডেলিং ---
header("HTTP/1.1 404 Not Found");
header('Content-Type: text/plain');
echo "Channel Not Found";
?>
