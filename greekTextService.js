const { PrismaClient } = require('@prisma/client');
const { preprocessGreekText } = require('./greekTextPreprocessor');
const path = require('path');

const prisma = new PrismaClient();
const CHAPTER_VERSE_REGEX = /^\d+:\d+$/;

// Function to extract the book name from the file path
function extractBookName(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));

  if (isNaN(parseInt(fileName[0]))) {
    const [bookName] = fileName.split('_');
    
    console.log("Processing book: ", bookName)
    return bookName;
  } else {
    const parts = fileName.split('_');

    console.log("Processing book: ", parts.slice(0, 2).join(' '))
    return parts.slice(0, 2).join(' ');
  }
}

async function createOrUpdateBowVector(word, bookName, chapter, verse) {
  let bowVector = await prisma.bowVector.findFirst({ where: { word } });
  let wordOccurrence;
  let verseScore;

  // Check if the VerseScore record exists
  verseScore = await prisma.verseScore.findFirst({
    where: { bookName, chapter, verse },
  });

  // If not, create one
  if (!verseScore) {
    // Generate a similarityIndex for the verse based on the words in the verse

    verseScore = await prisma.verseScore.create({
      data: { bookName, chapter, verse, similarityIndex: 0 },
    });
  }

  if (!bowVector) {
    bowVector = await prisma.bowVector.create({
      data: { word, totalOccurrences: 1 },
    });

    wordOccurrence = await prisma.wordOccurrence.create({
      data: {
        bowVector: {
          connect: {
            id: bowVector.id,
          }
        },
        frequency: 1,
        verseScore: {
          connect: {
            id: verseScore.id,
          }
        },
      },
    });
  } else {
    wordOccurrence = await prisma.wordOccurrence.findFirst({
      where: {
        bowVector: {
          id: bowVector.id,
        },
        verseScore: {
          id: verseScore.id,
        }
      },
    });
  
    wordOccurrence
      ? await prisma.wordOccurrence.update({
          where: { id: wordOccurrence.id },
          data: { frequency: { increment: 1 } },
        })
      : (wordOccurrence = await prisma.wordOccurrence.create({
          data: {
            bowVector: {
              connect: {
                id: bowVector.id,
              }
            },
            frequency: 1,
            verseScore: {
              connect: {
                id: verseScore.id,
              }
            },
          },
        }
      ));

    await prisma.bowVector.update({
      where: { id: bowVector.id },
      data: { totalOccurrences: { increment: 1 } },
    });
  }

  return { bowVector, wordOccurrence };
}

async function insertGreekText(filePath) {
  try {
    const words = preprocessGreekText(filePath);
    const bookName = extractBookName(filePath);
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

      const result = await createOrUpdateBowVector(word, bookName, context.chapter, context.verse);
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

    console.log(`Book ${bookName} inserted successfully.`)
    return { message: 'Greek text inserted successfully.' };
  } catch (error) {
    console.error('Error inserting Greek text:', error);
    throw error;
  }
}

async function fetchGreekText(book, chapter, verse) {
  try {
    // Convert chapter and verse to integers
    const chapterInt = parseInt(chapter, 10);
    const verseInt = parseInt(verse, 10);

    // Verify if the chapter and verse strings were successfully converted to integers
    if (isNaN(chapterInt) || isNaN(verseInt)) {
      throw new Error('Invalid chapter or verse number');
    }

    // Query database for the Greek text with matching book, chapter, and verse
    const greekTextData = await prisma.wordOccurrence.findMany({
      where: {
        bookName: book,
        chapter: chapterInt,
        verse: verseInt,
      },
      select: {
        id: true,
        bookName: true,
        chapter: true,
        verse: true,
        frequency: true,
        bowVector: {
          select: {
            word: true,
            totalOccurrences: true,
          },
        },
        WordPosition: {  // Select WordPositions related to this WordOccurrence
          select: {
            position: true,
          },
        },
      },
    });

    return greekTextData;

  } catch (error) {
    // Handle the error accordingly
    console.error("Error fetching Greek text:", error);
    throw error;
  }
}

module.exports = {
  fetchGreekText,
  insertGreekText,
};
