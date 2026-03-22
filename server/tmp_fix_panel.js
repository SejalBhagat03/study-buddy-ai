const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\HP\\Documents\\study-buddy-ai\\client\\src\\components\\KnowledgeBasePanel.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add api import
if (!content.includes('import api from "@/api";')) {
    content = content.replace(/import { supabase } from "@\/integrations\/supabase\/client";/, 'import api from "@/api";');
}

// 2. Replace fetchKnowledgeBase body completely
content = content.replace(/const fetchKnowledgeBase = async \(\) => {[\s\S]*?fetchKnowledgeBase\(\);/m, 
`const fetchKnowledgeBase = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const [videosRes, chaptersRes] = await Promise.all([
          api.get("/videos"),
          api.get("/chapters")
        ]);

        const videos = videosRes.data.data || [];
        const chapters = chaptersRes.data.data || [];

        const knowledgeItems = [];

        videos.forEach((video) => {
          knowledgeItems.push({
            id: video._id || video.id,
            title: video.title,
            type: "video",
            hasContent: !!(video.transcript && video.transcript.trim().length > 0),
            contentLength: video.transcript?.length || 0,
            createdAt: video.createdAt || video.created_at,
          });
        });

        chapters.forEach((chapter) => {
          knowledgeItems.push({
            id: chapter._id || chapter.id,
            title: chapter.title,
            type: "pdf",
            hasContent: !!(chapter.content && chapter.content.trim().length > 0),
            contentLength: chapter.content?.length || 0,
            createdAt: chapter.createdAt || chapter.created_at,
          });
        });

        setItems(knowledgeItems);
      } catch (error) {
        console.error("Error fetching knowledge base:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKnowledgeBase();`);

// 3. Remove the base economics card item
const cardRegex = /<div className="flex items-center gap-3 p-2 bg-secondary\/30 rounded-lg">[\s\S]*?Base Economics Knowledge[\s\S]*?<\/div>/;
content = content.replace(cardRegex, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("KnowledgeBasePanel.jsx updated successfully");
