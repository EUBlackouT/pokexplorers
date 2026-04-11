const fs = require('fs');

const content = fs.readFileSync('/app/applet/App.tsx', 'utf8');
let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') {
      stack.push({ line: i + 1, col: j + 1 });
    } else if (char === '}') {
      if (stack.length === 0) {
        console.log(`Unexpected } at line ${i + 1}, col ${j + 1}`);
      } else {
        stack.pop();
      }
    }
  }
}

if (stack.length > 0) {
  console.log(`Unclosed { at:`);
  stack.forEach(s => console.log(`Line ${s.line}, col ${s.col}`));
} else {
  console.log('All braces are balanced.');
}
