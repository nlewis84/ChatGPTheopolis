# Import necessary libraries
from gensim.models import Word2Vec
import sys

# Load the Word2Vec model
model = Word2Vec.load("word2vec.model")

# Specify the word for which you want to find similar words
target_word = sys.argv[1]

# Find most similar words
similar_words = model.wv.most_similar(target_word)

# Print the similar words
for word, similarity in similar_words:
    print(f"Word: {word}, Similarity: {similarity}")
