const fs = require('fs');

// Function to read and preprocess a text file
function preprocessGreekText(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    
    // Split the text into words or tokens, assuming words are separated by spaces
    const words = text.split(/\s+/);
    
    return words;
  } catch (error) {
    console.error('Error reading or processing the file:', error);
    return null;
  }
}

module.exports = {
  preprocessGreekText,
};