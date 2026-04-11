const fs = require('fs');
const content = fs.readFileSync('App.tsx', 'utf8');
let balance = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') balance++;
  if (content[i] === '}') balance--;
  if (balance < 0) {
    console.log(`Negative balance at index ${i}, line ${content.substring(0, i).split('\n').length}`);
    balance = 0;
  }
}
console.log(`Final balance: ${balance}`);
