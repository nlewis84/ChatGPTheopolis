## ChatGPTheopolis
### Description

This is a simple program that takes an input of a Bible Scripture and returns an analysis of the original Greek/Roman text, the context of that scripture, and any other pertinent information. This program is intended to be used as a tool for Bible study and research.

### Project Setup

1. Clone the repository
2. Install the dependencies
3. Create a local database
4. Run `prisma migrate dev` to create the tables
5. Run `node index.js` to start the server

### Initialize the database

Eventually we will want to seed this data, but I'm still tweaking the schema, so for now we can add data manually.

`curl -X POST -H "Content-Type: application/json" -d '{"filePath": "GreekTexts/1_Corinthians_Greek.txt"}' http://localhost:3000/insert`