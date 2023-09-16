const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const { insertGreekText } = require('./greekTextService');

app.use(bodyParser.json());

// API endpoint to insert Greek text
app.post('/insert', async (req, res) => {
  try {
    const { filePath } = req.body;
    const result = await insertGreekText(filePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
