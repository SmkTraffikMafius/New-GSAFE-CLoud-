const fs = require('fs');
const path = require('path');

function getFiles(dir, ext) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(getFiles(file, ext));
        } else if (file.endsWith(ext)) {
            results.push(file);
        }
    });
    return results;
}

const files = getFiles('./components', '.tsx');
files.push(path.resolve('./App.tsx'));

const texts = new Set();
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const matches = content.match(/>([^<{}]+)</g);
    if (matches) {
        matches.forEach(m => {
            let t = m.substring(1, m.length - 1).trim();
            if (t && t.length > 1 && !/^[0-9]+$/.test(t)) {
                texts.add(t);
            }
        });
    }
});

fs.writeFileSync('texts.json', JSON.stringify(Array.from(texts), null, 2));
console.log(`Extracted ${texts.size} strings.`);
