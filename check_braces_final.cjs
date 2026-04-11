const fs = require('fs');
const content = fs.readFileSync('App.tsx', 'utf8');
let balance = 0;
let lines = content.split('\n');
let currentLine = 1;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') balance++;
  if (content[i] === '}') balance--;
  if (content[i] === '\n') currentLine++;
}
console.log(`Final balance: ${balance}`);
