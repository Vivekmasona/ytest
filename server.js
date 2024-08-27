const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML directly
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Audio Downloader</title>
    </head>
    <body>
      <h1>Audio Downloader</h1>
      <input type="text" id="videoUrl" placeholder="Enter YouTube Video URL" />
      <input type="text" id="customTitle" placeholder="Enter Custom Title (Optional)" />
      <button onclick="downloadAudio()">Download Audio</button>
      <script>
        async function downloadAudio() {
          const videoUrl = document.getElementById('videoUrl').value;
          const customTitle = document.getElementById('customTitle').value;

          try {
            const response = await fetch('/download', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ videoUrl, customTitle }),
            });

            const result = await response.json();
            if (response.ok) {
              alert('Download Complete! Title: ' + result.title);
              console.log('Thumbnail URL:', result.thumbnail); // Display or use thumbnail URL as needed
            } else {
              alert('Error: ' + result.error);
            }
          } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while downloading the audio.');
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.use(express.json());

app.post('/download', async (req, res) => {
  const { videoUrl, customTitle } = req.body;

  try {
    // API call to get audio stream URL, title, and thumbnail
    const apiUrl = `https://vivekfy.vercel.app/vivekfy?url=${encodeURIComponent(videoUrl)}`;
    const response = await axios.get(apiUrl);
    const { audioUrl } = response.data;

    // Extract video ID from URL for thumbnail
    const videoId = new URL(videoUrl).searchParams.get('v') || videoUrl.split('/').pop().split('?')[0];
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

    // Set custom title or use default
    const modifiedTitle = customTitle || 'default-title'; // User defined title or default title

    // Download audio
    const audioResponse = await axios.get(audioUrl, { responseType: 'stream' });
    const filePath = path.resolve(__dirname, 'downloads', `${modifiedTitle}.mp3`);

    audioResponse.data.pipe(fs.createWriteStream(filePath));

    audioResponse.data.on('end', () => {
      res.json({
        message: 'Download complete',
        title: modifiedTitle,
        thumbnail: thumbnailUrl,
        filePath: filePath
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download audio' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
