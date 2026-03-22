const fs = require('fs');

const filePath = 'c:\\Users\\HP\\Documents\\study-buddy-ai\\client\\src\\components\\KnowledgeBasePanel.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix accidental literal \n
content = content.replace('<div className="p-3 space-y-2">\\n                {items.length === 0', '<div className="p-3 space-y-2">\n                {items.length === 0');

fs.writeFileSync(filePath, content, 'utf8');
console.log("KnowledgeBasePanel.jsx literal line fixed");
