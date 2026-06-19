export default async function handler(req, res) {
  const { channel, ts } = req.query; 

  // আপনার আসল গিটহাবের JSON ডাটা লিংক
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';
  const targetDomain = 'https://asfaflix.vercel.app/play/';

  try {
    // ১. গিটহাব থেকে ডাটা নিয়ে আসা
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) throw new Error('Source fetch failed');
    const channels = await response.json();

    // ২. চ্যানেল ম্যাচ করানো
    const foundChannel = channels.find(c => {
      if (!c.link) return false;
      const urlParts = c.link.split('/');
      const id = urlParts[urlParts.length - 2];
      return id === channel;
    });

    if (!foundChannel) {
      return res.status(404).send('Channel Not Found');
    }

    const cookieHeader = foundChannel.cookie || '';
    
    // টফির বেস ইউআরএল বের করা (লিংক রি-রাইট করার সুবিধার্থে)
    const originalUrl = foundChannel.link;
    const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);

    // ৩. যদি কোনো ভিডিও সেগমেন্ট (.ts ফাইল) এর রিকোয়েস্ট আসে
    if (ts) {
      const tsUrl = `${baseUrl}${ts}`;
      const tsResponse = await fetch(tsUrl, {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Origin': 'https://toffeelive.com',
          'Referer': 'https://toffeelive.com/'
        }
      });

      if (!tsResponse.ok) return res.status(tsResponse.status).send('TS error');
      
      // সরাসরি বাইনারি ভিডিও ডেটা প্লেয়ারে পাস করা
      const arrayBuffer = await tsResponse.arrayBuffer();
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(Buffer.from(arrayBuffer));
    }

    // ৪. মূল m3u8 ফাইলের রিকোয়েস্ট হ্যান্ডেল করা
    const toffeeResponse = await fetch(originalUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://toffeelive.com',
        'Referer': 'https://toffeelive.com/'
      }
    });

    if (!toffeeResponse.ok) return res.status(toffeeResponse.status).send('M3U8 fetch failed');
    let m3u8Text = await toffeeResponse.text();

    // ৫. ম্যাজিক পার্ট: m3u8 এর ভেতরের প্রতিটা .ts লিংকের আগে আপনার Vercel প্রক্সি লিংক বসানো
    // উদাহরণ: "tracks-v1a1/mono.js" হয়ে যাবে "https://asfaflix.vercel.app/play/channel_i.m3u8?ts=tracks-v1a1/mono.js"
    const lines = m3u8Text.split('\n');
    const updatedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        // যদি রিলেটিভ পাথ থাকে, সেটিকে আপনার সার্ভারের প্যারামিটার বানিয়ে দেওয়া
        return `${targetDomain}${channel}.m3u8?ts=${trimmed}`;
      }
      return line;
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    return res.status(200).send(updatedLines.join('\n'));

  } catch (error) {
    return res.status(500).send('Proxy Deep Error: ' + error.message);
  }
}
