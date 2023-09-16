const { PrismaClient } = require('@prisma/client');
const { preprocessGreekText } = require('./greekTextPreprocessor');

const prisma = new PrismaClient();

async function insertGreekText(filePath) {
  try {
    const words = preprocessGreekText(filePath);
    let chapter = 1;
    let verse = 1;
    let wordPositionInVerse = 1;
    let wordOccurrence;
    let bowVector;

    for (const word of words) {
      if (word.match(/^\d+:\d+$/)) {
        const [newChapter, newVerse] = word.split(':').map(Number);
        chapter = newChapter;
        verse = newVerse;
        wordPositionInVerse = 1;
        continue;
      }

      // Explicitly check if BowVector already exists
      bowVector = await prisma.bowVector.findFirst({
        where: {
          word: word,
        },
      });


      if (!bowVector) {
        // Create new BowVector if it doesn't exist
        bowVector = await prisma.bowVector.create({
          data: {
            word: word,
            totalOccurrences: 1,
          },
        });

        // Create a new wordOccurrence as well
        wordOccurrence = await prisma.wordOccurrence.create({
          data: {
            bowVectorId: bowVector.id,
            chapter: chapter,
            verse: verse,
            frequency: 1,
          },
        });
      } else {
        wordOccurrence = await prisma.wordOccurrence.findFirst({
          where: {
            bowVectorId: bowVector.id,
            chapter: chapter,
            verse: verse,
          },
        });

        if (!wordOccurrence) {
          // Create new WordOccurrence for the existing BowVector
          wordOccurrence = await prisma.wordOccurrence.create({
            data: {
              bowVectorId: bowVector.id,
              chapter: chapter,
              verse: verse,
              frequency: 1,
            },
          });
        } else {
          // Update the frequency of the existing WordOccurrence
          await prisma.wordOccurrence.update({
            where: {
              id: wordOccurrence.id,
            },
            data: {
              frequency: {
                increment: 1,
              },
            },
          });
        }

        // Update totalOccurrences of the existing BowVector
        await prisma.bowVector.update({
          where: {
            id: bowVector.id,
          },
          data: {
            totalOccurrences: {
              increment: 1,
            },
          },
        });
      }

      if (!wordOccurrence) {
        console.log(
          `Error inserting wordOccurrence for word ${word} in chapter ${chapter}, verse ${verse}`
        );
        continue;
      }

      try {
        await prisma.wordPosition.create({
          data: {
            wordOccurrenceId: wordOccurrence.id,
            position: wordPositionInVerse,
            bowVectorId: bowVector.id,
          },
        });
      } catch (err) {
        console.log("Error inserting wordPosition: ", err);
      }

      wordPositionInVerse++;
    }

    return { message: 'Greek text inserted successfully.' };
  } catch (error) {
    console.error('Error inserting Greek text:', error);
    throw error;
  }
}

module.exports = {
  insertGreekText,
};
