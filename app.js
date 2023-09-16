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
    let wordPositionInVerse = 1; // Initialize the position to 1 for the first word in the verse
    let wordOccurrence;
    let bowVector;
    const wordOccurrenceInVerse = {};

    for (const word of words) {
      if (word.match(/^\d+:\d+$/)) {
        // If the word is in the format chapter:verse
        const [newChapter, newVerse] = word.split(':').map(Number);
        chapter = newChapter;
        verse = newVerse;
        wordPositionInVerse = 1; // Reset the position to 1 for the first word in the verse
        continue; // Skip this word, it's just chapter:verse info
      }

      bowVector = await prisma.bowVector.findFirst({
        where: {
          word: word,
        },
        include: {
          WordOccurrence: {
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
            WordOccurrence: {
              create: {
                chapter: chapter,
                verse: verse,
                frequency: 1, // Initialize frequency to 1 for the first occurrence in the verse
              },
            },
          },
          include: {
            WordOccurrence: true,
          },
        });
      } else {
        // If the word exists, check if it already occurred in this verse
        const existingWordOccurrenceInVerse = bowVector.WordOccurrence.find(
          (wo) => wo.chapter === chapter && wo.verse === verse
        );
      
        if (!existingWordOccurrenceInVerse) {
          // If it's the first occurrence in this verse, increment the frequency
          await prisma.wordOccurrence.create({
            data: {
              bowVectorId: bowVector.id,
              chapter: chapter,
              verse: verse,
              frequency: 1, // Initialize frequency to 1 for the first occurrence in the verse
            },
          });
        } else {
          // If the word already occurred in this verse, increment its frequency
          wordOccurrence = await prisma.wordOccurrence.update({
            where: {
              id: existingWordOccurrenceInVerse.id,
            },
            data: {
              frequency: {
                increment: 1,
              },
            },
          });
        }
      }
            
      
      // Update the WordPosition table
      await prisma.wordPosition.create({
        data: {
          wordOccurrenceId: wordOccurrence.id,
          position: wordPositionInVerse,
          bowVectorId: bowVector.id,
        },
      });

      wordPositionInVerse++;
    }

  // Calculate the total occurrences of each bowVectorId
  const totalOccurrences = await prisma.wordOccurrence.groupBy({
    by: ['bowVectorId'],
    _count: {
      frequency: true,
    },
  });

  // Update the WordTotalOccurrence table
  for (const { bowVectorId, _count } of totalOccurrences) {
    await prisma.wordTotalOccurrence.upsert({
      where: { wordId: bowVectorId },
      update: { totalOccurrences: _count.frequency },
      create: {
        wordId: bowVectorId,
        totalOccurrences: _count.frequency,
      },
    });
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
