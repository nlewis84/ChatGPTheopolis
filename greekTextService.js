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
        bowVector = await prisma.bowVector.create({
          data: {
            word: word,
            totalOccurrences: 1,
            WordOccurrence: {
              create: {
                chapter: chapter,
                verse: verse,
                frequency: 1,
              },
            },
          },
          include: {
            WordOccurrence: true,
          },
        });
      } else {
        const existingWordOccurrenceInVerse = bowVector.WordOccurrence.find(
          (wo) => wo.chapter === chapter && wo.verse === verse
        );

        if (!existingWordOccurrenceInVerse) {
          wordOccurrence = await prisma.wordOccurrence.create({
            data: {
              bowVectorId: bowVector.id,
              chapter: chapter,
              verse: verse,
              frequency: 1,
            },
          });
        } else {
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

      await prisma.wordPosition.create({
        data: {
          wordOccurrenceId: wordOccurrence.id,
          position: wordPositionInVerse,
          bowVectorId: bowVector.id,
        },
      });

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
