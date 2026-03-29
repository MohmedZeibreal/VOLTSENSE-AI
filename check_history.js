import fs from 'fs';

const history = JSON.parse(fs.readFileSync('./history.json', 'utf8'));

const dates = new Set();
history.forEach((entry, index) => {
  if (dates.has(entry.date)) {
    console.log(`Duplicate date at index ${index}: ${entry.date}`);
  }
  dates.add(entry.date);
});
