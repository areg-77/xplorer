const fs = require('fs');

const folderPath = process.argv[2];

fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
  console.log(eventType, filename);
});
