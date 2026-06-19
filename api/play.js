export default async function handler(req, res) {
  const { channel } = req.query;
  // আপনার সঠিক গিটহাব লিংকটি বসান (xxxxxxxxxx এর জায়গায় আপনার সঠিক মান দিন)
  const sourceJsonUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';

  try {
    const response = await fetch(sourceJsonUrl);
    if (!response.ok) throw new Error('GitHub fetch failed');
    const channels = await response.json();

    // চ্যানেল আইডি অনুযায়ী অবজেক্ট খুঁজে বের করা
    const foundChannel = channels.find(c => c.link && c.link.includes(`/${channel}/`));
    if (!foundChannel) return res.status(404).send('Channel Not Found');

    const originalUrl = foundChannel.link;
    const cookieHeader = foundChannel.cookie || '';

    // প্লেয়ারের জন্য কুকি হেডার সেট করা
    if (cookieHeader) {
      res.setHeader('Set-Cookie', `${cookieHeader}; Path=/; HttpOnly; Secure; SameSite=None`);
    }

    // CORS এবং ক্যাশ কন্ট্রোল হেডার
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // HTTP 307 Temporary Redirect ব্যবহার করে প্লেয়ারকে মূল লিংকে পাঠানো হচ্ছে
    // এতে আপনার Vercel সার্ভার ব্লক হওয়ার কোনো সুযোগ নেই
    return res.redirect(307, originalUrl);

  } catch (error) {
    return res.status(500).send('Redirect Error: ' + error.message);
  }
}
