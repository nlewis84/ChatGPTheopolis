const { PrismaClient } = require('@prisma/client');
const { preprocessGreekText } = require('./greekTextPreprocessor');

const prisma = new PrismaClient();
const CHAPTER_VERSE_REGEX = /^\d+:\d+$/;

async function createOrUpdateBowVector(word, chapter, verse) {
  let bowVector = await prisma.bowVector.findFirst({ where: { word } });
  let wordOccurrence;

  if (!bowVector) {
    bowVector = await prisma.bowVector.create({
      data: { word, totalOccurrences: 1 },
    });
    wordOccurrence = await prisma.wordOccurrence.create({
      data: { bowVectorId: bowVector.id, chapter, verse, frequency: 1 },
    });
  } else {
    wordOccurrence = await prisma.wordOccurrence.findFirst({
      where: { bowVectorId: bowVector.id, chapter, verse },
    });

    wordOccurrence
      ? await prisma.wordOccurrence.update({ where: { id: wordOccurrence.id }, data: { frequency: { increment: 1 } } })
      : (wordOccurrence = await prisma.wordOccurrence.create({
          data: { bowVectorId: bowVector.id, chapter, verse, frequency: 1 },
        }));

    await prisma.bowVector.update({ where: { id: bowVector.id }, data: { totalOccurrences: { increment: 1 } } });
  }

  return { bowVector, wordOccurrence };
}

async function insertGreekText(filePath) {
  try {
    const words = preprocessGreekText(filePath);
    const context = {
      chapter: 1,
      verse: 1,
      wordPositionInVerse: 1,
      wordOccurrence: null,
      bowVector: null,
    };

    for (const word of words) {
      if (word.match(CHAPTER_VERSE_REGEX)) {
        [context.chapter, context.verse] = word.split(':').map(Number);
        context.wordPositionInVerse = 1;
        continue;
      }

      const result = await createOrUpdateBowVector(word, context.chapter, context.verse);
      context.bowVector = result.bowVector;
      context.wordOccurrence = result.wordOccurrence;

      if (!context.wordOccurrence) {
        console.log(`Error inserting wordOccurrence for word ${word} in chapter ${context.chapter}, verse ${context.verse}`);
        continue;
      }

      try {
        await prisma.wordPosition.create({
          data: {
            wordOccurrenceId: context.wordOccurrence.id,
            position: context.wordPositionInVerse,
            bowVectorId: context.bowVector.id,
          },
        });
      } catch (err) {
        console.log("Error inserting wordPosition: ", err);
      }

      context.wordPositionInVerse++;
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
