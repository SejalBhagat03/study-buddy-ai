const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\HP\\Documents\\study-buddy-ai\\client\\src';

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('from "@/integrations/supabase/client"')) {
                content = content.replace(/import\s*\{\s*supabase\s*\}\s*from\s*["']@\/integrations\/supabase\/client["'];?/g, '// Removed Supabase');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Cleaned imports from \${file}`);
            }
        }
    });
}

replaceInDir(srcDir);
console.log("Global imports cleanup finished.");
