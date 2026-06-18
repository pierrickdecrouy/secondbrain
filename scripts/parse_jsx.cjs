const fs = require('fs');
const parser = require('@babel/parser');

const code = fs.readFileSync('src/App.tsx', 'utf-8');

let pos = 0;
while (pos < code.length) {
    try {
        parser.parse(code.substring(0, code.length - pos), {
            sourceType: 'module',
            plugins: ['jsx', 'typescript']
        });
        console.log("Parsed correctly up to length", code.length - pos);
        break;
    } catch (e) {
        if (pos === 0) console.log("Full file fails:", e.message);
        pos += 100;
    }
}
