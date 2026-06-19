export default async function handler(req, res) {
  // আপনার আসল গিটহাবের JSON ডাটা লিংক (xxxxxxxxxx এর জায়গায় সঠিক লিংকটি বসান)
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';
  const targetDomain = 'https://asfaflix.vercel.app/play/';

  try {
    // ১. গিটহাব থেকে ডাটা ফেচ করা
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch source. Status: ${response.status}` });
    }
    
    // ২. ডাটাটিকে JSON হিসেবে পার্স (Parse) করা
    const channels = await response.json();

    // ৩. M3U প্লেলিস্টের হেডার শুরু করা
    let m3uContent = '#EXTM3U\n';

    // ৪. লুপ চালিয়ে প্রতিটি চ্যানেলকে M3U এবং আপনার নিজস্ব ফরম্যাটে রূপান্তর করা
    channels.forEach(channel => {
      const name = channel.name || 'Unknown Channel';
      const logo = channel.logo || '';
      const originalLink = channel.link || '';

      // আসল লিংক (যেমন: .../atn_bangla/playlist.m3u8) থেকে ফোল্ডারের নাম (atn_bangla) বের করা
      // এটি করার কারণ হলো লিংকের শেষে সবারই 'playlist.m3u8' থাকে, তাই তার আগের অংশটিই আসল আইডি
      let channelId = '';
      if (originalLink.includes('/')) {
        const urlParts = originalLink.split('/');
        // 'playlist.m3u8' এর ঠিক আগের অংশটি নেওয়া হচ্ছে
        channelId = urlParts[urlParts.length - 2]; 
      }

      // যদি কোনো কারণে আইডি না পাওয়া যায়, তবে নামের ছোট হাতের রূপ ব্যবহার করবে
      if (!channelId || channelId === 'live') {
        channelId = name.toLowerCase().replace(/\s+/g, '_');
      }

      // আপনার কাঙ্ক্ষিত ফাইনাল লিংক ফরম্যাট তৈরি
      const finalLink = `${targetDomain}${channelId}.m3u8`;

      // M3U ফরম্যাটে লাইনগুলো সাজানো
      m3uContent += `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}",${name}\n`;
      m3uContent += `${finalLink}\n`;
    });

    // ৫. প্লেয়ারদের (VLC/PotPlayer) জন্য সঠিক হেডার সেট করে রেসপন্স পাঠানো
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u"');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate'); 
    
    return res.status(200).send(m3uContent);

  } catch (error) {
    return res.status(500).json({ error: 'Internal Error: ' + error.message });
  }
}
