export default async function handler(req, res) {
  // আসল গিটহাব m3u লিংকটি এখানে বসান (xxxxxxxxxx এর জায়গায় আপনার সঠিক লিংক দিন)
  const sourceM3uUrl = 'https://raw.githubusercontent.com/hasanhabibmottakin/xxxxxxxxxxxxxxxxxx/refs/heads/main/ns.m3u';
  const targetDomain = 'https://asfaflix.vercel.app/play/';

  try {
    // Node.js এর বিল্ট-ইন fetch ব্যবহার করা হচ্ছে, তাই কোনো এক্সট্রা প্যাকেজ লাগবে না
    const response = await fetch(sourceM3uUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch source M3U. Status: ${response.status}` });
    }
    
    const m3uText = await response.text();

    // মেইন লজিক: ম্যাপ করে লিংক পরিবর্তন
    const lines = m3uText.split('\n');
    const updatedLines = lines.map(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('http')) {
        // লিংকের শেষের ফাইলের নাম বের করা (যেমন: atn_bangla.m3u8)
        const urlParts = trimmedLine.split('/');
        const fileName = urlParts[urlParts.length - 1]; 
        
        return `${targetDomain}${fileName}`;
      }
      
      return line;
    });

    // সঠিক হেডার সেট করা যাতে আইপিটিভি প্লেয়ার বা ব্রাউজার এটিকে ফাইল হিসেবে চেনে
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate'); 
    
    return res.status(200).send(updatedLines.join('\n'));

  } catch (error) {
    return res.status(500).json({ error: 'Internal Error: ' + error.message });
  }
}
