export default async function handler(req, res) {
  const { channel, path } = req.query;
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u'; // আপনার সঠিক গিটহাব লিংক দিন

  try {
    // ১. গিটহাব থেকে ডাটা নিয়ে আসা
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) throw new Error('GitHub JSON fetch failed');
    const channels = await response.json();

    // ২. চ্যানেল আইডি ম্যাচিং করা
    const foundChannel = channels.find(c => c.link && c.link.includes(`/${channel}/`));
    if (!foundChannel) return res.status(404).send('Channel Not Found');

    const cookieHeader = foundChannel.cookie || '';
    const originalUrl = foundChannel.link;
    
    // টফির মূল ডিরেক্টরি পাথ বের করা
    const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);

    // ৩. টফির জন্য প্রয়োজনীয় রিকোয়েস্ট হেডারস
    const customHeaders = {
      'Cookie': cookieHeader,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://toffeelive.com',
      'Referer': 'https://toffeelive.com/'
    };

    // টার্গেট ইউআরএল নির্ধারণ করা (মেইন ফাইল নাকি সাব-ভিডিও সেগমেন্ট)
    let targetUrl = originalUrl;
    if (path) {
      const fullPath = Array.isArray(path) ? path.join('/') : path;
      targetUrl = `${baseUrl}${fullPath}`;
    }

    // ৪. টফি সার্ভার থেকে ডাটা রিকোয়েস্ট করা
    const toffeeResponse = await fetch(targetUrl, { headers: customHeaders });
    if (!toffeeResponse.ok) return res.status(toffeeResponse.status).send('Streaming server error');

    const contentType = toffeeResponse.headers.get('content-type') || '';

    // ৫. যদি এটি কোনো .m3u8 বা প্লেলিস্ট টেক্সট ফাইল হয়, তবে তার ভেতরের রিলেটিভ পাথগুলো রি-রাইট করা
    if (contentType.includes('mpegurl') || contentType.includes('mpegURL') || targetUrl.endsWith('.m3u8')) {
      let m3u8Text = await toffeeResponse.text();
      const lines = m3u8Text.split('\n');
      
      const updatedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          // রিলেটিভ পাথকে আপনার ডোমেইনের অধীনে প্রক্সি করা হচ্ছে
          if (path) {
            const currentDir = path.includes('/') ? path.substring(0, path.lastIndexOf('/') + 1) : '';
            return `https://asfaflix.vercel.app/play/${channel}/${currentDir}${trimmed}`;
          }
          return `https://asfaflix.vercel.app/play/${channel}/${trimmed}`;
        }
        return line;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).send(updatedLines.join('\n'));
    }

    // ৬. যদি এটি ভিডিও সেগমেন্ট (.ts ফাইল) হয়, তবে সরাসরি বাইনারি স্ট্রিম পাস করা
    const arrayBuffer = await toffeeResponse.arrayBuffer();
    res.setHeader('Content-Type', contentType || 'video/mp2t');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(Buffer.from(arrayBuffer));

  } catch (error) {
    return res.status(500).send('Proxy Connection Failed: ' + error.message);
  }
}
