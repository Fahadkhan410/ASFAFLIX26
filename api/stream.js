// api/stream.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
    // 1. Define your base URL and token
    const baseUrl = "http://180.94.28.28:8097/PTV-Sports/index.m3u8";
    const currentToken = "YOUR_ACTIVE_TOKEN_HERE"; // 👈 Update this with a fresh token!
    const targetUrl = `${baseUrl}?token=${currentToken}`;

    // 2. Set strict headers so the player reads it correctly
    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    try {
        // 3. Fetch the original .m3u8 text
        const response = await fetch(targetUrl, { timeout: 15000 });
        
        if (!response.ok) {
            return res.status(500).send("#EXTM3U\n#EXT-X-ERROR: Token expired or source server down.");
        }

        const playlistContent = await response.text();

        // 4. Rewrite absolute chunk paths
        const streamPath = "http://180.94.28.28:8097/PTV-Sports/";
        const rewrittenContent = playlistContent.replace(/^(?!http)(.+)$/gm, `${streamPath}$1?token=${currentToken}`);

        // 5. Send back the updated text
        return res.status(200).send(rewrittenContent);

    } catch (error) {
        return res.status(500).send("#EXTM3U\n#EXT-X-ERROR: Connection timed out.");
    }
}
