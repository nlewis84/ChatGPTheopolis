import argparse
from gensim.models import Word2Vec

def find_similar_words(model_file, target_word, topn=10):
    # Load the Word2Vec model
    model = Word2Vec.load(model_file)

    try:
        # Find most similar words to the target word
        similar_words = model.wv.most_similar(target_word, topn=topn)
        print(f"Words similar to '{target_word}':")
        for word, score in similar_words:
            print(f"{word}: {score}")
    except KeyError:
        print(f"'{target_word}' not found in the vocabulary.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Find similar words using a Word2Vec model.")
    parser.add_argument("model_file", type=str, help="Path to the Word2Vec model file")
    parser.add_argument("target_word", type=str, help="Word to find similar words for")
    parser.add_argument("--topn", type=int, default=10, help="Number of similar words to display (default: 10)")
    args = parser.parse_args()

    find_similar_words(args.model_file, args.target_word, args.topn)
