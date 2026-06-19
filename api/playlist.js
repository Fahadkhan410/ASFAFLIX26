import fetch from 'node-fetch'; // যদি পুরনো Node সংস্করণ হয়, নতুবা বিল্ট-ইন fetch কাজ করবে

export default async function handler(req, res) {
  const sourceM3uUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';
  const targetDomain = 'https://asfaflix.vercel.app/play/';

  try {
    // ১. প্রথম লিংক থেকে লেটেস্ট m3u ডাটা ফেচ করা হচ্ছে (অটো-আপডেট)
    const response = await fetch(sourceM3uUrl);
    if (!response.ok) throw new Error('Source M3U fetch failed');
    const m3uText = await response.text();

    // ২. মেইন লজিক: লাইনের ভেতরের চ্যানেল আইডি বা নাম বের করে আপনার ডোমেইনে রূপান্তর
    const lines = m3uText.split('\n');
    const updatedLines = lines.map(line => {
      line = line.trim();
      
      // যদি লাইনটি কোনো লিংকের হয় (http দিয়ে শুরু হয়)
      if (line.startsWith('http')) {
        // লিংকের একদম শেষের অংশ (যেমন: atn_bangla.m3u8) আলাদা করা হচ্ছে
        const urlParts = line.split('/');
        const fileName = urlParts[urlParts.length - 1]; 
        
        // আপনার নতুন লিংক ফরম্যাট রিটার্ন করছে
        return `${targetDomain}${fileName}`;
      }
      
      // #EXTM3U বা #EXTINF লাইনে কোনো পরিবর্তন হবে না
      return line;
    });

    // ৩. রেসপন্সটিকে M3U প্লেলিস্ট হিসেবে ব্রাউজারে পাঠানো
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // ক্যাশ কন্ট্রোল (যাতে বারবার লোড হতে সময় না নেয়)
    res.status(200).send(updatedLines.join('\n'));

  } catch (error) {
    res.status(500).send('Error generating live playlist: ' + error.message);
  }
}
