// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { fetchGreekText, insertGreekText } = require('./greekTextService');

// Initialize the Express app
const app = express();

// Middleware to parse JSON requests
app.use(bodyParser.json());

// API endpoint to insert Greek text into the database
// It expects a JSON body with a 'filePath' key
app.post('/insert', async (req, res) => {
  try {
    const { filePath } = req.body;
    const result = await insertGreekText(filePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to fetch Greek text by book, chapter, and verse
// It expects these as query parameters
app.get('/greekText', async (req, res) => {
  try {
    const { book, chapter, verse } = req.query;
    
    // Fetch the Greek text from the database
    const greekTextData = await fetchGreekText(book, chapter, parseInt(verse));
    
    // Check if the data exists
    if (greekTextData.length === 0) {
      res.status(404).json({ message: 'Greek text not found.' });
      return;
    }
    
    // Return the fetched text as JSON
    res.json(greekTextData);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to fetch vector data for a list of words
// It expects a JSON body with a 'words' key containing an array of words
app.post('/wordVectors', async (req, res) => {
  const { words } = req.body;
  // TODO: Fetch vector data for these words from the database
  // TODO: Return the fetched data as JSON
});

// API endpoint to fetch other occurrences of a specific word in scriptures
// It expects the word as a query parameter
app.get('/otherOccurrences', async (req, res) => {
  const { word } = req.query;
  // TODO: Fetch other occurrences of the word from the database
  // TODO: Return the fetched data as JSON
});

// Start the Express server on port 3000 or the port defined in the environment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
