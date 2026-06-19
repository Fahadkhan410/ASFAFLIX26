<?php
// Set headers so IPTV players read this cleanly as an M3U stream
header('Content-Type: application/vnd.apple.mpegurl');
header('Access-Control-Allow-Origin: *');

// Locate your local json file in the repository layout
$json_file = __DIR__ . '/../toffee_channel_data.json'; 
if (!file_exists($json_file)) {
    $json_file = __DIR__ . '/toffee_channel_data.json';
}

// Parse the JSON data safely
if (file_exists($json_file)) {
    $json_data = file_get_contents($json_file);
    $data = json_decode($json_data, true);
} else {
    $data = array('channels' => array());
}

// Check if a specific channel stream request is called (e.g., /?id=atn_bangla)
$id = isset($_GET['id']) ? $_GET['id'] : '';

// IF NO ID IS PASSED: Loop and build the master auto-updating M3U list
if (empty($id)) {
    echo "#EXTM3U\n";
    
    if (isset($data['channels']) && is_array($data['channels'])) {
        foreach ($data['channels'] as $slug => $channel) {
            // Accommodate array variations (whether indexed numerically or via slug strings)
            $channel_slug = isset($channel['slug']) ? $channel['slug'] : $slug;
            $name = isset($channel['name']) ? $channel['name'] : $channel_slug;
            $logo = isset($channel['logo']) ? $channel['logo'] : '';
            
            echo '#EXTINF:-1 tvg-logo="' . $logo . '" group-title="Toffee Live",' . $name . "\n";
            echo "https://" . $_SERVER['HTTP_HOST'] . "/?id=" . $channel_slug . "\n";
        }
    }
    exit;
}

// IF A CHANNEL ID IS PASSED: Intercept, attach dynamic headers, and load stream manifest
if (isset($data['channels'])) {
    $target_channel = null;
    
    // Look up channel configuration details matching your requested ID
    if (isset($data['channels'][$id])) {
        $target_channel = $data['channels'][$id];
    } else {
        foreach ($data['channels'] as $channel) {
            if (isset($channel['slug']) && $channel['slug'] === $id) {
                $target_channel = $channel;
                break;
            }
        }
    }

    if ($target_channel) {
        $stream_url = $target_channel['link'];
        $cookie = $target_channel['cookie'];
        
        // Setup cURL proxy handshake to securely relay the streaming indices with required signatures
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $stream_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            "Cookie: " . $cookie,
            "User-Agent: Toffee (Linux; AndroidXMedia3/1.1.1)",
            "Host: bldcmprod-cdn.toffeelive.com"
        ));
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        echo $response;
        exit;
    }
}

// Error handling fallback
header("HTTP/1.1 404 Not Found");
echo "Channel Not Found or Cookie Expired.";
?>
