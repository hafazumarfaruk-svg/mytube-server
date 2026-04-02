const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());

// নতুন API এন্ডপয়েন্ট
app.get('/api/extract', (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ error: 'ভিডিওর লিংক দেওয়া হয়নি!' });
    }

    // সরাসরি সিস্টেমের yt-dlp কমান্ড কল করা হচ্ছে
    const command = `yt-dlp -j --no-warnings --no-check-certificate "${videoUrl}"`;

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error("yt-dlp Error:", stderr || error.message);
            // ব্রাউজারে আসল এরর মেসেজটি দেখানোর ব্যবস্থা করা হলো
            return res.status(500).json({ 
                error: 'ভিডিও এক্সট্রাক্ট করতে সমস্যা হচ্ছে।',
                youtube_error: stderr || error.message 
            });
        }

        try {
            const output = JSON.parse(stdout);
            
            // ভিডিও এবং অডিও একসাথে আছে এমন mp4 ফরম্যাট খোঁজা
            const format = output.formats.find(f => f.ext === 'mp4' && f.vcodec !== 'none' && f.acodec !== 'none') 
                           || output.formats.find(f => f.ext === 'mp4');

            if (format && format.url) {
                res.json({ 
                    success: true, 
                    title: output.title,
                    url: format.url,
                    thumbnail: output.thumbnail
                });
            } else {
                res.status(404).json({ error: 'ডিরেক্ট লিংক পাওয়া যায়নি।' });
            }
        } catch (parseError) {
            res.status(500).json({ error: 'ডেটা পার্স করতে সমস্যা হয়েছে।' });
        }
    });
});

app.get('/', (req, res) => {
    res.send("✅ SuperFast yt-dlp Server is Running!");
});

// Hugging Face Space ডিফল্টভাবে 7860 পোর্টে কাজ করে
const PORT = process.env.PORT || 7860;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port: ${PORT}`);
});
