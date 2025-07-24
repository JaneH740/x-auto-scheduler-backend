require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/read-sheet', async (req, res) => {
  const { url, numberPosts } = req.body;

  if (!url || !numberPosts) {
    return res.status(400).send("Missing required fields.");
  }

  try {
    // Extract sheet ID from URL
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return res.status(400).send("Invalid Google Sheet URL.");
    }
    const sheetId = match[1];

    const creds = require('./service-account.json'); // service account key

    const doc = new GoogleSpreadsheet(sheetId);
    await doc.useServiceAccountAuth(creds);

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const posts = rows.map(r => r._rawData[0]).filter(Boolean).slice(0, numberPosts);
    return res.json(posts);

  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
