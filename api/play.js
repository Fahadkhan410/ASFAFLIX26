export default async function handler(req, res) {
  const { channel } = req.query; // লিংকের ভেতরের চ্যানেলের নাম বা আইডি (যেমন: channel_i)
  
  // আপনার আসল গিটহাবের JSON ডাটা লিংক (xxxxxxxxxx এর জায়গায় সঠিক লিংকটি বসান)
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';

  try {
    // ১. গিটহাব থেকে ডাটা ফেচ করা
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) throw new Error('Source fetch failed');
    const channels = await response.json();

    // ২. অনুরোধ করা চ্যানেলটি JSON ডাটার সাথে ম্যাচ করানো
    const foundChannel = channels.find(c => {
      if (!c.link) return false;
      const urlParts = c.link.split('/');
      const id = urlParts[urlParts.length - 2];
      return id === channel;
    });

    if (!foundChannel) {
      return res.status(404).send('#EXTM3U\n#ERROR: Channel Not Found in Source JSON');
    }

    const originalUrl = foundChannel.link;
    const cookieHeader = foundChannel.cookie || '';

    // ৩. টফি সার্ভার থেকে ভিডিও ডেটা রিডাইরেক্ট করা
    // এখানে আসল সিক্রেট: প্লেয়ারকে টফির সিকিউর কুকি হেডারসহ রিডাইরেক্ট করা হচ্ছে
    res.setHeader('Location', originalUrl);
    
    // যদি আপনার প্লেয়ার কুকি সাপোর্ট করে, তবে নিচের হেডারটি কাজ সহজ করবে
    if (cookieHeader) {
      res.setHeader('Set-Cookie', cookieHeader + '; Path=/; HttpOnly; Secure; SameSite=None');
    }
    
    // HTTP 302 এর মাধ্যমে প্লেয়ারকে মূল লাইভ লিংকে পাঠিয়ে দেওয়া
    return res.status(302).end();

  } catch (error) {
    return res.status(500).send('#EXTM3U\n#ERROR: ' + error.message);
  }
}
