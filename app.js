const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
const bodyParser = require('body-parser');

const { preprocessGreekText } = require('./greekTextPreprocessor');

app.use(bodyParser.json());

// Function to preprocess Greek text and insert into the database
async function insertGreekText(filePath) {
  try {
    const words = preprocessGreekText(filePath);
    let chapter = 1;
    let verse = 1;

    for (const word of words) {
      if (word.match(/^\d+:\d+$/)) {
        // If the word is in the format chapter:verse
        const [newChapter, newVerse] = word.split(':').map(Number);
        chapter = newChapter;
        verse = newVerse;
        continue; // Skip this word, it's just chapter:verse info
      }

      let bowVector = await prisma.bowVector.findFirst({
        where: {
          word: word,
        },
        include: {
          positions: {
            where: {
              chapter: chapter,
              verse: verse,
            },
          },
        },
      });

      if (!bowVector) {
        // If the word doesn't exist, create a new record with a position
        bowVector = await prisma.bowVector.create({
          data: {
            word: word,
            positions: {
              create: {
                chapter: chapter,
                verse: verse,
                position: 1, // Placeholder
                frequency: 1,
              },
            },
          },
        });
      } else {
        // If the word exists, update its positions and frequencies
        if (bowVector.positions.length > 0) {
          // If positions exist for this word
          await prisma.wordOccurrence.updateMany({
            where: {
              bowVectorId: bowVector.id,
              chapter: chapter,
              verse: verse,
            },
            data: {
              frequency: {
                increment: 1,
              },
            },
          });
        } else {
          // If no positions exist for this word, create a new position
          await prisma.wordOccurrence.create({
            data: {
              bowVectorId: bowVector.id,
              chapter: chapter,
              verse: verse,
              position: 1, // Placeholder
              frequency: 1,
            },
          });
        }
      }
    }

    return { message: 'Greek text inserted successfully.' };
  } catch (error) {
    console.error('Error inserting Greek text:', error);
    throw error;
  }
}

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
