const fs = require('fs');

const filePath = 'c:\\Users\\HP\\Documents\\study-buddy-ai\\client\\src\\pages\\Flashcards.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace handleDifficulty
content = content.replace(/await supabase\.from\("flashcards"\)\.update\([\s\S]*?\}\)\.eq\("id", card\.id\);/, 
`await api.put(\`/flashcards/\${card._id || card.id}\`, { difficulty: newDifficulty, next_review: nextReview.toISOString(), review_count: card.review_count + 1 });`);

// 2. Replace deleteDeck
content = content.replace(/await supabase\.from\("flashcards"\)\.delete\(\)\.eq\("user_id", user\.id\)\.eq\("deck_name", deckName\);/, 
`await api.delete(\`/flashcards/deck?deckName=\${encodeURIComponent(deckName)}\`);`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Flashcards.jsx fully migrated successfully");
