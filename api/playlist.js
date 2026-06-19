export default async function handler(req, res) {
  // আপনার আসল গিটহাবের JSON ডাটা লিংক
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';

  try {
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `GitHub fetch failed. Status: ${response.status}` });
    }
    
    const channels = await response.json();

    // M3U প্লেলিস্টের হেডার শুরু
    let m3uContent = '#EXTM3U\n';
    
    // টফির জন্য স্ট্যান্ডার্ড রিকোয়েস্ট ইউজার-এজেন্ট
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    channels.forEach(channel => {
      const name = channel.name || 'Unknown Channel';
      const logo = channel.logo || '';
      const originalLink = channel.link || '';
      const cookieHeader = channel.cookie || '';

      if (originalLink) {
        // ১. সাধারণ ইনফরমেশন (নাম এবং লোগো)
        m3uContent += `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}",${name}\n`;
        
        // ২. PotPlayer, VLC এবং ZalTV এর জন্য গ্লোবাল অপশন হেডার ইনজেকশন
        // এই ট্যাগগুলো প্লেয়ারকে বাধ্য করে টফির লিংকে যাওয়ার সময় সঠিক কুকি সাথে নিয়ে যেতে
        m3uContent += `#EXTVLCOPT:http-user-agent=${userAgent}\n`;
        if (cookieHeader) {
          m3uContent += `#EXTVLCOPT:http-cookie=${cookieHeader}\n`;
        }
        
        // ৩. চ্যানেল স্ট্রিম করার মূল ইউআরএল
        m3uContent += `${originalLink}\n`;
      }
    });

    // সঠিক কন্টেন্ট টাইপ সেট করা যাতে প্লেয়ার ফাইলটি চিনতে পারে
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); 
    
    return res.status(200).send(m3uContent);

  } catch (error) {
    return res.status(500).json({ error: 'Internal Error: ' + error.message });
  }
}
