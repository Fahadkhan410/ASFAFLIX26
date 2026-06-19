$json_url = "https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/toffee_channel_data.json";
$json_data = file_get_contents($json_url);
$data = json_decode($json_data, true);
