export default async function handler(req, res) {
  // আপনার আসল গিটহাবের JSON ডাটা লিংক (xxxxxxxxxx এর জায়গায় সঠিক মান দিন)
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';

  try {
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const channels = await response.json();

    let m3uContent = '#EXTM3U\n';
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    channels.forEach(channel => {
      const name = channel.name || 'Unknown';
      const logo = channel.logo || '';
      const originalLink = channel.link || '';
      const cookieHeader = channel.cookie || '';

      if (originalLink) {
        // M3U স্ট্যান্ডার্ড ফরম্যাটে প্লেয়ারের জন্য হেডার সাজানো হচ্ছে
        m3uContent += `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}",${name}\n`;
        m3uContent += `#EXTVLCOPT:http-user-agent=${userAgent}\n`;
        if (cookieHeader) {
          m3uContent += `#EXTVLCOPT:http-cookie=${cookieHeader}\n`;
        }
        // মূল লিংকটির সাথেও হেডার অ্যাপেন্ড করা হচ্ছে (যাতে সব প্লেয়ার সাপোর্ট করে)
        m3uContent += `${originalLink}|User-Agent=${userAgent}&Cookie=${encodeURIComponent(cookieHeader)}\n`;
      }
    });

    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); 
    return res.status(200).send(m3uContent);

  } catch (error) {
    return res.status(500).json({ error: 'Playlist Error: ' + error.message });
  }
}
