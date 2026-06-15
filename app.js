// CONFIG: Paste your .m3u playlist link or relative local file path here
const M3U_PLAYLIST_URL = 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us.m3u'; 

let channels = [];
const videoPlayer = document.getElementById('player');
const channelList = document.getElementById('channelList');
const searchBar = document.getElementById('searchBar');

// 1. Fetch and Parse the M3U Playlist file
async function loadPlaylist() {
    try {
        const response = await fetch(M3U_PLAYLIST_URL);
        if (!response.ok) throw new Error('Network response failure.');
        const m3uText = await response.text();
        
        channels = parseM3U(m3uText);
        displayChannels(channels);
        
        // Auto-play the first channel if available
        if (channels.length > 0) {
            playStream(channels[0].link);
        }
    } catch (error) {
        console.error('Error loading M3U playlist:', error);
        channelList.innerHTML = '<div class="no-match">Failed to load playlist. Check URL or CORS settings.</div>';
    }
}

// 2. Simple regex engine to extract #EXTINF titles and video stream URLs
function parseM3U(data) {
    const lines = data.split('\n');
    const result = [];
    let currentName = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('#EXTINF:')) {
            // Extract channel name after the last comma
            const commaIndex = line.lastIndexOf(',');
            if (commaIndex !== -1) {
                currentName = line.substring(commaIndex + 1).trim();
            } else {
                currentName = 'Unknown Channel';
            }
        } else if (line.length > 0 && !line.startsWith('#')) {
            // This line is the stream URL
            if (currentName === '') currentName = `Channel ${result.length + 1}`;
            result.push({
                name: currentName,
                link: line
            });
            currentName = ''; // Reset for next iteration
        }
    }
    return result;
}

// 3. Render Channels to UI List
function displayChannels(channelData) {
    channelList.innerHTML = '';
    
    if (channelData.length === 0) {
        channelList.innerHTML = '<div class="no-match">No channels found.</div>';
        return;
    }

    channelData.forEach(channel => {
        const channelDiv = document.createElement('div');
        channelDiv.className = 'channel';
        channelDiv.innerText = channel.name;

        channelDiv.addEventListener('click', () => {
            playStream(channel.link);
        });

        channelList.appendChild(channelDiv);
    });
}

// 4. Stream Player Handler (Uses Hls.js fallback for raw live streams)
function playStream(url) {
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(videoPlayer);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            videoPlayer.play();
        });
    } 
    // Fallback native support for Safari/Mobile devices
    else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        videoPlayer.src = url;
        videoPlayer.addEventListener('loadedmetadata', function() {
            videoPlayer.play();
        });
    } else {
        alert('Your browser does not support HLS stream playback.');
    }
}

// 5. Live Search Input Filter
searchBar.addEventListener('input', function() {
    const searchTerm = searchBar.value.toLowerCase();
    const filteredChannels = channels.filter(channel =>
        channel.name.toLowerCase().includes(searchTerm)
    );
    displayChannels(filteredChannels);
});

// Run application
loadPlaylist();
