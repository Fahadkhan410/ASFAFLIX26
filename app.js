// Anti-inspection Layer
(function() {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) || (e.ctrlKey && e.key.toLowerCase() === 'u')) {
            e.preventDefault();
            return false;
        }
    });
})();

const player = document.getElementById('live-tv-player');
let currentHls = null;
const DEFAULT_LOGO = 'https://images.unsplash.com/photo-1595624871930-6e8537998592?w=100&auto=format&fit=crop&q=60';
let allChannels = [];

// Base64 Obfuscated Playlists & Fallback CORS Proxies
const _0x4f2a = [
    "aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0ZhaGFka2hhbjQxMC9iZHRlc3QvcmVmcy9oZWFkcy9tYWluL2NoYS5tM3U=",
    "aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0FidXNhZWVpZHgvQkR4VFYvcmVmcy9oZWFkcy9tYWluL2NoYW5uZWxzX3BsMi5tM3U=",
    "aHR0cHM6Ly9hcGkuYWxsb3JpZ2lucy53aW4vcmF3P3VybD0=" 
];

const PLAYLIST_URLS = [atob(_0x4f2a[0]), atob(_0x4f2a[1])];

window.onload = () => {
    loadAllPlaylists();
    document.getElementById('search-input').addEventListener('input', filterChannels);
};

// HLS.js Performance Playback Configurations
const config = {
    maxBufferLength: 30,
    maxMaxBufferLength: 600,
    manifestLoadingTimeOut: 15000,
    manifestLoadingMaxRetry: 6,
    levelLoadingTimeOut: 15000,
    levelLoadingMaxRetry: 6,
    enableWorker: true,
    lowLatencyMode: true,
    xhrSetup: function (xhr) { xhr.withCredentials = false; }
};

function playChannel(url, useProxy = false) {
    if (currentHls) {
        currentHls.destroy();
        currentHls = null;
    }

    // Dynamic Secure Reverse-Proxy Injector for Mixed-Content/CORS
    if ((window.location.protocol === 'https:' && url.startsWith('http://')) || useProxy) {
        console.warn("Routing stream through secure proxy resolver...");
        url = atob(_0x4f2a[2]) + encodeURIComponent(url);
    }

    if (Hls.isSupported()) {
        currentHls = new Hls(config);
        currentHls.loadSource(url);
        currentHls.attachMedia(player);
        currentHls.on(Hls.Events.MANIFEST_PARSED, () => player.play().catch(() => {}));
        
        currentHls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        if (!useProxy) {
                            console.log("Network failure. Trying Proxy Server Tunnel...");
                            playChannel(url, true);
                        } else {
                            currentHls.startLoad();
                        }
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        currentHls.recoverMediaError();
                        break;
                    default:
                        currentHls.destroy();
                        break;
                }
            }
        });
    } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Apple iOS/Safari handling Architecture
        player.src = url;
        player.addEventListener('loadedmetadata', () => player.play().catch(() => {}));
    }
}

async function fetchPlaylist(url) {
    try {
        let response = await fetch(url);
        if (!response.ok) response = await fetch(atob(_0x4f2a[2]) + encodeURIComponent(url));
        if (!response.ok) throw new Error();
        
        const playlistText = await response.text();
        
        // Direct RAW link extraction handling
        if (!playlistText.includes('#EXTM3U')) {
            if (url.startsWith('http')) {
                let fallbackTitle = 'DIRECT CHANNEL';
                try {
                    let parts = url.split('/');
                    let file = parts[parts.length - 1].split('?')[0];
                    if (file.length > 4) fallbackTitle = file.replace('.m3u8','').toUpperCase();
                } catch(e){}
                return [{ name: fallbackTitle, url: url, logo: DEFAULT_LOGO }];
            }
            return [];
        }

        const lines = playlistText.split('\n').map(l => l.trim());
        const channels = [];

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#EXTINF')) {
                const currentLine = lines[i];
                const logoMatch = currentLine.match(/tvg-logo="([^"]*)"/) || currentLine.match(/logo="([^"]*)"/);
                const tvgNameMatch = currentLine.match(/tvg-name="([^"]*)"/);
                
                let name = 'Live Channel Stream';
                const commaIndex = currentLine.lastIndexOf(',');
                if (commaIndex !== -1) name = currentLine.substring(commaIndex + 1).trim();
                else if (tvgNameMatch) name = tvgNameMatch[1].trim();
                
                const logo = logoMatch ? logoMatch[1].trim() : DEFAULT_LOGO;
                
                let j = i + 1;
                while (j < lines.length && (lines[j].length === 0 || lines[j].startsWith('#'))) {
                    j++;
                }
                
                if (j < lines.length && lines[j].startsWith('http')) {
                    channels.push({ name, url: lines[j], logo });
                    i = j;
                }
            }
        }
        return channels;
    } catch (error) {
        return url.startsWith('http') ? [{ name: 'Direct Stream Line', url: url, logo: DEFAULT_LOGO }] : [];
    }
}

async function loadAllPlaylists() {
    const results = await Promise.all(PLAYLIST_URLS.map(url => fetchPlaylist(url)));
    const seenUrls = new Set();
    
    // Aggregating lists & stripping structural duplicates 
    allChannels = results.flat().filter(channel => {
        if (seenUrls.has(channel.url)) return false;
        seenUrls.add(channel.url);
        return true;
    });

    renderChannels(allChannels, true);
}

function renderChannels(channels, isInitialLoad = false) {
    const channelList = document.getElementById('channel-list');
    channelList.innerHTML = '';
    
    if (channels.length === 0) {
        channelList.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">No channels found</div>';
        return;
    }

    channels.forEach((channel, index) => {
        const item = document.createElement('div');
        item.className = 'channel-item';
        item.innerHTML = `
            <img src="${channel.logo}" alt="${channel.name}" onerror="this.src='${DEFAULT_LOGO}'">
            <span>${channel.name}</span>
        `;
        item.onclick = () => playChannel(channel.url);
        channelList.appendChild(item);

        if (index === 0 && isInitialLoad) {
            playChannel(channel.url);
        }
    });
}

function filterChannels() {
    const searchInput = document.getElementById('search-input').value.toLowerCase().trim();
    if (!searchInput) {
        renderChannels(allChannels, false);
        return;
    }
    const filtered = allChannels.filter(channel => 
        channel.name.toLowerCase().includes(searchInput)
    );
    renderChannels(filtered, false);
}
