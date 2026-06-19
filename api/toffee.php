<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// গিটহাবের ফাইল লিংক
$github_data_url = "https://raw.githubusercontent.com/hasanhabibmottakin/ASFAFLIX26/refs/heads/main/ns.m3u";

// ফাইল রিড করা
$opts = [
    "http" => [
        "method" => "GET",
        "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n"
    ],
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false
    ]
];
$context = stream_context_create($opts);
$raw_content = @file_get_contents($github_data_url, false, $context);

$channels = [];
$index = 1;

if (!empty($raw_content)) {
    // ১. ফাইলের ভেতরের স্পেস বা নতুন লাইন পরিষ্কার করা
    $clean_content = trim($raw_content);
    
    // ২. সবচেয়ে গুরুত্বপূর্ণ অংশ: কমা ছাড়া { }{ } থাকলে সেগুলোর মাঝে কমা ( , ) বসানো
    $clean_content = preg_replace('/\}\s*\{/', '},{', $clean_content);
    
    // ৩. দুই পাশে থার্ড ব্র্যাকেট বসিয়ে একটি ভ্যালিড JSON অ্যারে তৈরি করা
    if (substr($clean_content, 0, 1) !== '[') {
        $clean_content = '[' . $clean_content . ']';
    }

    // ৪. এবার ফ্রেশ JSON ডিকোড করা
    $channels_array = json_decode($clean_content, true);

    if (is_array($channels_array)) {
        foreach ($channels_array as $channel) {
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

// --- রুট ১: প্রধান M3U প্লেলিস্ট আউটপুট ---
if (empty($id)) {
    header('Content-Type: application/vnd.apple.mpegurl');
    echo "#EXTM3U\n";
    if (!empty($channels)) {
        foreach ($channels as $idx => $channel) {
            echo '#EXTINF:-1 tvg-logo="' . $channel['logo'] . '" group-title="Toffee Live" user-agent="Toffee (Linux; AndroidXMedia3/1.1.1)",' . $channel['name'] . "\n";
            echo "https://" . $_SERVER['HTTP_HOST'] . "/?id=" . $idx . "\n";
        }
    }
    exit;
}

// --- রুট ২: নির্দিষ্ট আইডিতে প্লেয়ার রিডাইরেক্ট করা ---
if (isset($channels[$id])) {
    $stream_url = $channels[$id]['link'];
    $cookie = $channels[$id]['cookie'];
    
    header("Set-Cookie: " . $cookie . "; path=/; domain=toffeelive.com; Secure; HttpOnly");
    header("Location: " . $stream_url, true, 302);
    exit;
}

// --- রুট ৩: এরর হ্যান্ডেলিং ---
header("HTTP/1.1 404 Not Found");
header('Content-Type: text/plain');
echo "Channel Not Found";
?>
