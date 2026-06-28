export default async function handler(req, res) {
    // 1. Base URL config
    const baseUrl = "http://180.94.28.28:8097/PTV-Sports/index.m3u8?token=";
    
    // ⚠️ CRITICAL: Replace this string with your current, working token!
    const currentToken = "?token="; 
    
    const targetUrl = `${baseUrl}?token=${currentToken}`;

    // 2. Set necessary CORS and streaming header options
    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    try {
        // 3. Fetching data using native runtime fetch (No node-fetch package required)
        const response = await fetch(targetUrl, {
            signal: AbortSignal.timeout(15000) // 15-second connection timeout guard
        });
        
        if (!response.ok) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(200).send("#EXTM3U\n#EXT-X-ERROR: Original server rejected the token.");
        }

        const playlistContent = await response.text();

        // 4. Translate segment chunk links to include token authentication
        const streamPath = "http://180.94.28.28:8097/PTV-Sports/";
        const rewrittenContent = playlistContent.replace(/^(?!http)(.+)$/gm, `${streamPath}$1?token=${currentToken}`);

        // 5. Send playlist response
        return res.status(200).send(rewrittenContent);

    } catch (error) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send("#EXTM3U\n#EXT-X-ERROR: Proxy request timed out.");
    }
}
