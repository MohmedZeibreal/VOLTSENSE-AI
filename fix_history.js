import fs from 'fs';

const history = JSON.parse(fs.readFileSync('./history.json', 'utf8'));

const fixedHistory = history.map((entry, index) => {
  const date = new Date(entry.date);
  // Ensure we use the correct timestamp for the date string
  const timestamp = date.getTime();
  
  // Keep only the necessary fields as per App.tsx interface
  return {
    day: index + 1,
    date: entry.date,
    reading_kwh: entry.reading_kwh,
    units_used: entry.units_used,
    timestamp: timestamp
  };
});

fs.writeFileSync('./history.json', JSON.stringify(fixedHistory, null, 2));
console.log('Fixed history.json');
