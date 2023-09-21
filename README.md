# 📜 ChatGPTheopolis 📜

<div align="center">

![Status](https://img.shields.io/badge/status-active-success.svg)
[![GitHub Issues](https://img.shields.io/github/issues/nlewis84/ChatGPTheopolis.svg)](https://github.com/nlewis84/ChatGPTheopolis/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/nlewis84/ChatGPTheopolis.svg)](https://github.com/nlewis84/ChatGPTheopolis/pulls)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

---

## 📑 Table of Contents
- [Description](#description)
- [Project Setup](#project-setup)
- [Initialize the Database](#initialize-the-database)

---

## 📋 Description

📖 **ChatGPTheopolis** is a tool that provides insights into Bible Scriptures. It examines the original Greek/Hebrew text, puts the scripture into its historical and textual context, and generates pertinent data for researchers and scholars. Perfect for Bible studies, research, and gaining a better understanding of the holy text.

---

## ⚙️ Project Setup

1. **Clone the Repository**
    ```bash
    git clone https://github.com/nlewis84/ChatGPTheopolis.git
    ```

2. **Install the Dependencies**
    Make sure you have Python3 and Pip installed on your machine. Then run the following command:
    ```bash
    cd ChatGPTheopolis
    yarn install
    pip install -r requirements.txt
    ```

3. **Create a Local Database**
    - Create a local database using [PostgreSQL](https://www.postgresql.org/download/).
    - Set the `DATABASE_URL` in the `.env` file to the connection string of your local database.

4. **Initialize the Database Tables**
    ```bash
    yarn prisma:migrate
    ```

5. **Start the Server**
    ```bash
    yarn dev
    ```

---

## 🌱 Initialize the Database

📘 **Seeding an Individual Book**

You can seed an individual book of the Bible by running the following command, substituting the appropriate path to the text file:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"filePath": "GreekTexts/1_Corinthians_Greek.txt"}' http://localhost:3000/insert
```

📚 **Seeding the Entire Greek Bible**

You can seed the entire Greek Bible by running the following command:

```bash
yarn seed:greek
```

> ⏰ **Note:** This will take a few minutes to complete. Please be patient. The Synoptic Gospels (Matthew, Mark, Luke, and John) take the longest.

## Commands we need to remember for testing

```bash
  curl -X POST -H "Content-Type: application/json" -d '{"filePath": "EnglishTexts/1_Corinthians_English.txt"}' http://localhost:3000/insert
```

```bash
  python3 ./scipts/train_word2vec_greek_bible.py ./EnglishTexts word2vec.model
```