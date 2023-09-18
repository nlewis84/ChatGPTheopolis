// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { fetchGreekText, fetchVerseText, insertGreekText } = require('./greekTextService');
const { exec } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Initialize the Express app
const app = express();

const prisma = new PrismaClient();

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

// New endpoint to find similar words
app.get('/similarWords', async (req, res) => {
  try {
    const { word } = req.query;

    // Define the Python script to execute
    const pythonScript = './scripts/calculate_similarity.py';

    // Execute the Python script with the specified word as an argument
    exec(`python3 ${pythonScript} ${word}`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Parse the output from the Python script
      const similarWords = stdout
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const [word, similarity] = line.split(', ');
          return { word: word.split(': ')[1], similarity: parseFloat(similarity.split(': ')[1]) };
        });

      // Use the similar words data to query your database (e.g., VerseScore records)
      const similarWordStrings = similarWords.map(sw => sw.word);

     // Query the database for WordOccurrences that match the similar words
     const relevantWordOccurrences = await prisma.wordOccurrence.findMany({
      where: {
        bowVector: {
          word: {
            in: similarWordStrings,
          },
        },
      },
      include: {
        verseScore: true,
      },
    });

    // Extract unique verseScore records from the relevant WordOccurrences
    const relevantVerseScores = [...new Set(relevantWordOccurrences.map(wo => wo.verseScore))];

    // Get the related verses based on VerseScore records
    const relatedVerses = await Promise.all(
      relevantVerseScores.map(async verseScore => {
        const { bookName, chapter, verse } = verseScore;
        // Construct the filename based on bookName
        const fileName = bookName.replace(/ /g, '_') + '_Greek.txt';

        // Fetch the text of the related verse from the file
        const relatedVerseText = await fetchVerseText(fileName, chapter, verse);

        return {
          bookName,
          chapter,
          verse,
          relatedVerseText,
        };
      })
    );

    // Return the related verses as JSON
    res.json(relatedVerses);
  });
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
