const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('src/App.tsx', 'utf-8');
try {
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log('Parse successful');
} catch (e) {
  console.log(e);
}
