export default async function handler(req, res) {
  // আপনার গিটহাবের আসল JSON লিংক (xxxxxxxxxx এর জায়গায় সঠিক মান দিন)
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';
  const targetDomain = 'https://asfaflix.vercel.app/play/';

  try {
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const channels = await response.json();

    let m3uContent = '#EXTM3U\n';

    channels.forEach(channel => {
      const name = channel.name || 'Unknown';
      const logo = channel.logo || '';
      const originalLink = channel.link || '';

      if (originalLink) {
        // লিংক থেকে চ্যানেলের ইউনিক আইডি বের করা
        const urlParts = originalLink.split('/');
        const channelId = urlParts[urlParts.length - 2]; 

        m3uContent += `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}",${name}\n`;
        // প্লেয়ারের জন্য আপনার কাঙ্ক্ষিত লোকাল ডোমেইন লিংক
        m3uContent += `${targetDomain}${channelId}.m3u8\n`;
      }
    });

    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u"');
    return res.status(200).send(m3uContent);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
