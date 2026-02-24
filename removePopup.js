const fs = require('fs');

const extractAndRemoveHTML = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const startIdx = content.indexOf('<!-- Website Under Development Popup -->');
    const endStr = '</template>';
    if (startIdx !== -1) {
        const endIdx = content.indexOf(endStr, startIdx);
        if (endIdx !== -1) {
            fs.writeFileSync(filePath, content.slice(0, startIdx) + content.slice(endIdx + endStr.length));
            console.log('Removed popup from ' + filePath);
        }
    }
};

['index.html', 'store.html', 'products.html'].forEach(extractAndRemoveHTML);

let mainJs = fs.readFileSync('js/main.js', 'utf8');
mainJs = mainJs.replace(/this\.devPopupOpen = true;\n?/g, '');
mainJs = mainJs.replace(/this\.initCountdown\(\);\n?/g, '');
fs.writeFileSync('js/main.js', mainJs);
console.log('Removed popup logic from main.js');
