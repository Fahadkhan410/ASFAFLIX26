export default async function handler(req, res) {
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u'; // আপনার সঠিক গিটহাব লিংক দিন
  const targetDomain = 'https://asfaflix.vercel.app/play/';

  try {
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) throw new Error('Source fetch failed');
    const channels = await response.json();

    let m3uContent = '#EXTM3U\n';

    channels.forEach(channel => {
      const name = channel.name || 'Unknown';
      const logo = channel.logo || '';
      const originalLink = channel.link || '';

      if (originalLink) {
        // মূল লিংক থেকে চ্যানেলের ইউনিক আইডি বের করা
        const urlParts = originalLink.split('/');
        const channelId = urlParts[urlParts.length - 2]; 

        m3uContent += `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}",${name}\n`;
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
