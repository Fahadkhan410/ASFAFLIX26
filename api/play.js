export default async function handler(req, res) {
  const { channel, segment } = req.query;

  // আপনার গিটহাবের আসল JSON লিংক (xxxxxxxxxx এর জায়গায় সঠিক মান দিন)
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';

  try {
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) throw new Error('Source fetch failed');
    const channels = await response.json();

    // চ্যানেল ডাটা খুঁজে বের করা
    const foundChannel = channels.find(c => c.link && c.link.includes(`/${channel}/`));
    if (!foundChannel) return res.status(404).send('Channel Not Found');

    const cookieHeader = foundChannel.cookie || '';
    const originalUrl = foundChannel.link;
    const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);

    // ১. যদি ভিডিওর কোনো ছোট টুকরো বা সাব-প্লেলিস্টের (.ts বা সাব-.m3u8) রিকোয়েস্ট আসে
    if (segment) {
      const segmentUrl = `${baseUrl}${Array.isArray(segment) ? segment.join('/') : segment}`;
      
      const segResponse = await fetch(segmentUrl, {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Origin': 'https://toffeelive.com',
          'Referer': 'https://toffeelive.com/'
        }
      });

      if (!segResponse.ok) return res.status(segResponse.status).send('Segment Error');

      // সরাসরি বাইনারি ডেটা প্লেয়ারে ট্রান্সফার করা
      const arrayBuffer = await segResponse.arrayBuffer();
      const contentType = segResponse.headers.get('content-type') || 'video/mp2t';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(Buffer.from(arrayBuffer));
    }

    // ২. মূল .m3u8 ফাইলের রিকোয়েস্ট হ্যান্ডেল করা
    const toffeeResponse = await fetch(originalUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://toffeelive.com',
        'Referer': 'https://toffeelive.com/'
      }
    });

    if (!toffeeResponse.ok) return res.status(toffeeResponse.status).send('Toffee Error');
    let m3u8Text = await toffeeResponse.text();

    // ৩. m3u8 টেক্সটের ভেতরের রিলেটিভ পাথগুলোকে আপনার Vercel পাথে রূপান্তর করা
    const lines = m3u8Text.split('\n');
    const updatedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        // সাব-পাথগুলোকে আপনার ডোমেইনের আন্ডারে রি-রাইট করা হচ্ছে
        return `https://asfaflix.vercel.app/play/${channel}/${trimmed}`;
      }
      return line;
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(updatedLines.join('\n'));

  } catch (error) {
    return res.status(500).send('Error: ' + error.message);
  }
}
