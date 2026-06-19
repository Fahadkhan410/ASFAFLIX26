export default async function handler(req, res) {
  const { channel } = req.query; // যেমন: channel_i

  // আপনার আসল গিটহাবের JSON ডাটা লিংক (xxxxxxxxxx এর জায়গায় সঠিক লিংকটি বসান)
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';

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
      return res.status(404).send('Channel Not Found in Source JSON');
    }

    const originalUrl = foundChannel.link;
    const cookieHeader = foundChannel.cookie || '';

    // ৩. রিভার্স প্রক্সি লজিক: টফির কাছে কুকি এবং সঠিক User-Agent সহ রিকোয়েস্ট পাঠানো
    const toffeeResponse = await fetch(originalUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://toffeelive.com',
        'Referer': 'https://toffeelive.com/'
      }
    });

    if (!toffeeResponse.ok) {
      return res.status(toffeeResponse.status).send(`Failed to stream from Toffee. Status: ${toffeeResponse.status}`);
    }

    // ৪. টফি থেকে প্রাপ্ত লাইভ ডাটা বা m3u8 টেক্সট রিড করা
    const streamData = await toffeeResponse.text();

    // ৫. প্লেয়ারকে সরাসরি ডাটা ডেলিভারি দেওয়া (কোনো রিডাইরেক্ট ছাড়া)
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl'); // m3u8 এর অফিশিয়াল হেডার
    res.setHeader('Access-Control-Allow-Origin', '*'); // যাতে সব প্লেয়ারে সাপোর্ট করে
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    return res.status(200).send(streamData);

  } catch (error) {
    return res.status(500).send('Proxy Error: ' + error.message);
  }
}
