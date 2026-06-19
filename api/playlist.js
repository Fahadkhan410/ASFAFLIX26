export default async function handler(req, res) {
  // আপনার আসল গিটহাবের JSON ডাটা লিংক
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';

  try {
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch source. Status: ${response.status}` });
    }
    
    const channels = await response.json();

    let m3uContent = '#EXTM3U\n';

    channels.forEach(channel => {
      const name = channel.name || 'Unknown Channel';
      const logo = channel.logo || '';
      const originalLink = channel.link || '';
      const cookieHeader = channel.cookie || '';

      if (originalLink) {
        // স্ট্যান্ডার্ড ইউজার এজেন্ট
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

        // ম্যাজিক পার্ট: M3U স্ট্যান্ডার্ড অনুযায়ী লিংকের সাথে হেডার জুড়ে দেওয়া
        // এটি PotPlayer, VLC, এবং ZalTV এর মতো প্লেয়ার সরাসরি বুঝতে পারে
        m3uContent += `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}",${name}\n`;
        
        // প্লেয়ারকে নির্দেশনা দেওয়া হচ্ছে যে এই লিংকে যাওয়ার সময় নিচের হেডারগুলো ব্যবহার করো
        m3uContent += `#EXTVLCOPT:http-user-agent=${userAgent}\n`;
        if (cookieHeader) {
          m3uContent += `#EXTVLCOPT:http-cookie=${cookieHeader}\n`;
        }
        
        // এখানে আপনার Vercel লিংক নয়, সরাসরি টফির মূল লিংকটিই থাকবে
        // কিন্তু প্লেয়ার এখন আপনার দেওয়া কুকি সাথে নিয়ে টফির কাছে যাবে, তাই টফি আর ব্লক করবে না
        m3uContent += `${originalUrl}|User-Agent=${userAgent}&Cookie=${encodeURIComponent(cookieHeader)}\n`;
      }
    });

    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); 
    
    return res.status(200).send(m3uContent);

  } catch (error) {
    return res.status(500).json({ error: 'Internal Error: ' + error.message });
  }
}
