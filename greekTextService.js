const { PrismaClient } = require('@prisma/client');
const { preprocessGreekText } = require('./greekTextPreprocessor');
const path = require('path');
const fs = require('fs').promises;

// Function to fetch verse text from a file
async function fetchVerseText(fileName, chapter, verse) {
  try {
    // Construct the path to the file
    const filePath = `./GreekTexts/${fileName}`;

    // Read the file content
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Check if the fileContent is a non-empty string
    if (typeof fileContent !== 'string' || fileContent.trim() === '') {
      throw new Error(`Verse text not found in ${fileName}`);
    }

    // Split the content into verses (assuming each verse is separated by a newline)
    const verses = fileContent.split('\n');

    // Find the verse by chapter and verse number
    const targetVerse = verses.find(verseText => {
      // Assuming each verse has a format like "1:1" or "2:3"
      const [verseChapter, verseNumber] = verseText.split(':');
      return parseInt(verseChapter) === chapter && parseInt(verseNumber) === verse;
    });

    if (!targetVerse) {
      throw new Error(`Verse ${chapter}:${verse} not found in ${fileName}`);
    }

    // Initialize an array to store the related verses with book name
    const relatedVerses = [];

    // Prepend the book name to the related verse text
    const book = fileName.replace(/_/g, ' ').replace(' Greek.txt', '');
    const cleanedVerseText = // remove \r from the verse text
      targetVerse.includes('\r')
        ? targetVerse.replace('\r', '')
        : targetVerse;
    const relatedVerseText = `${book} ${cleanedVerseText}`;

    // Create an object with the book name, chapter, verse, and related verse text
    const relatedVerse = {
      bookName: book,
      chapter: chapter,
      verse: verse,
      relatedVerseText,
    };

    console.log(relatedVerse)

    // Push the related verse object to the array
    relatedVerses.push(relatedVerse);

    return cleanedVerseText.trim(); // Return the trimmed verse text
  } catch (error) {
    console.error('Error fetching verse text:', error);
    throw error;
  }
}

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
        WordPosition: {
          select: {
            position: true,
          },
        },
      },
    });

    // Iterate through the fetched data
    for (const data of greekTextData) {
      // Use the fetchVerseText function to get the verse text
      const verseText = await fetchVerseText(data.bookName, data.chapter, data.verse);
    }

    return relatedVerses;

  } catch (error) {
    // Handle the error accordingly
    console.error("Error fetching Greek text:", error);
    throw error;
  }
}

module.exports = {
  fetchGreekText,
  fetchVerseText,
  insertGreekText,
};
