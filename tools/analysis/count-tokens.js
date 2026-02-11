const fs = require('fs');
const path = require('path');
const { encoding_for_model } = require('tiktoken');

// Choose a model (e.g., 'gpt-3.5-turbo' or 'gpt-4')
const encoding = encoding_for_model('gpt-3.5-turbo');

function getAllFiles(dir, extList = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, extList));
    } else if (extList.includes(path.extname(file))) {
      results.push(filePath);
    }
  });
  return results;
}

function countTokensInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return encoding.encode(content).length;
}

const projectDir = __dirname;
const files = getAllFiles(projectDir);

let totalTokens = 0;
console.log('Token count per file:');
files.forEach(file => {
  const tokens = countTokensInFile(file);
  totalTokens += tokens;
  console.log(`${file}: ${tokens}`);
});

console.log(`\nTotal tokens in project: ${totalTokens}`);