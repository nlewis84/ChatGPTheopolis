import argparse
from gensim.models import Word2Vec
from nltk.tokenize import word_tokenize
import re
import os

def train_word2vec(input_folder, output_model):
    # Get a list of all text files in the input folder
    text_files = [os.path.join(input_folder, filename) for filename in os.listdir(input_folder) if filename.endswith(".txt")]

    # Tokenize sentences from all text files
    tokenized_sentences = []

    for text_file in text_files:
        with open(text_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for line in lines:
            # Remove verse reference (e.g., "1:1")
            verse_text = re.sub(r'^\d+:\d+\s+', '', line)
            # Tokenize the cleaned verse text
            tokenized_sentences.append(word_tokenize(verse_text.lower()))

    # Initialize and train a Word2Vec model
    model = Word2Vec(tokenized_sentences, vector_size=100, window=5, min_count=1, workers=4)
    model.save(output_model)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Word2Vec model on Greek text files.")
    parser.add_argument("input_folder", type=str, help="Path to the folder containing input text files")
    parser.add_argument("output_model", type=str, help="Path to save the Word2Vec model")

    args = parser.parse_args()

    train_word2vec(args.input_folder, args.output_model)
