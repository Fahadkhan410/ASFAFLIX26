export default async function handler(req, res) {
  const { channel, path } = req.query;
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u'; // আপনার গিটহাব লিংক দিন

  try {
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) throw new Error('GitHub fetch failed');
    const channels = await response.json();

    // চ্যানেল আইডি অনুযায়ী অবজেক্ট খুঁজে বের করা
    const foundChannel = channels.find(c => c.link && c.link.includes(`/${channel}/`));
    if (!foundChannel) return res.status(404).send('Channel Not Found');

    const cookieHeader = foundChannel.cookie || '';
    const originalUrl = foundChannel.link;
    
    // টফির বেস ইউআরএল রুট বের করা (যেমন: https://.../cdn/live/channel_i/)
    const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);

    // কমন রিকোয়েস্ট হেডারস
    const customHeaders = {
      'Cookie': cookieHeader,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://toffeelive.com',
      'Referer': 'https://toffeelive.com/'
    };

    // ১. যদি কোনো সাব-পাথ বা ভিডিও সেগমেন্ট (.ts বা সাব-m3u8) রিকোয়েস্ট করা হয়
    if (path) {
      const fullPath = Array.isArray(path) ? path.join('/') : path;
      const targetUrl = `${baseUrl}${fullPath}`;

      const segmentResponse = await fetch(targetUrl, { headers: customHeaders });
      if (!segmentResponse.ok) return res.status(segmentResponse.status).send('Segment fetch failed');

      // যদি সেগমেন্টটি আরেকটি সাব-m3u8 ফাইল হয় (যেমন কোয়ালিটি ট্র্যাকস)
      const contentType = segmentResponse.headers.get('content-type') || '';
      if (contentType.includes('mpegurl') || contentType.includes('mpegURL')) {
        let textData = await segmentResponse.text();
        const lines = textData.split('\n');
        
        // সাব-ফাইলের ভেতরের পাথগুলোকেও রি-রাইট করা
        const updatedLines = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            return `https://asfaflix.vercel.app/play/${channel}/${fullPath.substring(0, fullPath.lastIndexOf('/') + 1)}${trimmed}`;
          }
          return line;
        });
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(updatedLines.join('\n'));
      }

      // যদি এটি সরাসরি ভিডিওর টুকরো (.ts ফাইল) হয়
      const arrayBuffer = await segmentResponse.arrayBuffer();
      res.setHeader('Content-Type', contentType || 'video/mp2t');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(Buffer.from(arrayBuffer));
    }

    // ২. মূল মাস্টার .m3u8 ফাইলের রিকোয়েস্ট হ্যান্ডেল করা
    const toffeeResponse = await fetch(originalUrl, { headers: customHeaders });
    if (!toffeeResponse.ok) return res.status(toffeeResponse.status).send('Master M3U8 fetch failed');
    
    let m3u8Text = await toffeeResponse.text();
    const lines = m3u8Text.split('\n');
    
    const updatedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        // প্রতিটি রিলেটিভ ট্র্যাককে আমাদের Vercel গেটওয়েতে রি-রাইট করা
        return `https://asfaflix.vercel.app/play/${channel}/${trimmed}`;
      }
      return line;
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(updatedLines.join('\n'));

  } catch (error) {
    return res.status(500).send('Streaming Gate Error: ' + error.message);
  }
}
