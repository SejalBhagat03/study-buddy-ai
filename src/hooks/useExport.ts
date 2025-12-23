import { toast } from "sonner";

interface ExportNote {
  title: string;
  content: string;
  chapter?: string;
  updated_at: string;
}

interface ExportFlashcard {
  front: string;
  back: string;
  deck_name: string;
}

export function useExport() {
  const exportNotesAsMarkdown = (notes: ExportNote[]) => {
    if (notes.length === 0) {
      toast.error("No notes to export");
      return;
    }

    let markdown = "# Study Notes\n\n";
    
    notes.forEach((note) => {
      markdown += `## ${note.title}\n\n`;
      if (note.chapter) {
        markdown += `*Chapter: ${note.chapter}*\n\n`;
      }
      markdown += `${note.content}\n\n`;
      markdown += `---\n*Last updated: ${new Date(note.updated_at).toLocaleDateString()}*\n\n`;
    });

    downloadFile(markdown, "study_notes.md", "text/markdown");
    toast.success("Notes exported as Markdown!");
  };

  const exportFlashcardsAsMarkdown = (flashcards: ExportFlashcard[]) => {
    if (flashcards.length === 0) {
      toast.error("No flashcards to export");
      return;
    }

    // Group by deck
    const decks: Record<string, ExportFlashcard[]> = {};
    flashcards.forEach((card) => {
      if (!decks[card.deck_name]) {
        decks[card.deck_name] = [];
      }
      decks[card.deck_name].push(card);
    });

    let markdown = "# Flashcards\n\n";

    Object.entries(decks).forEach(([deckName, cards]) => {
      markdown += `## ${deckName}\n\n`;
      cards.forEach((card, i) => {
        markdown += `### Card ${i + 1}\n\n`;
        markdown += `**Q:** ${card.front}\n\n`;
        markdown += `**A:** ${card.back}\n\n`;
        markdown += "---\n\n";
      });
    });

    downloadFile(markdown, "flashcards.md", "text/markdown");
    toast.success("Flashcards exported as Markdown!");
  };

  const exportNotesAsHTML = (notes: ExportNote[]) => {
    if (notes.length === 0) {
      toast.error("No notes to export");
      return;
    }

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Study Notes</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .chapter { color: #6b7280; font-style: italic; font-size: 0.9em; }
    .content { white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 8px; }
    .date { color: #9ca3af; font-size: 0.8em; margin-top: 10px; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    @media print { body { max-width: 100%; } }
  </style>
</head>
<body>
  <h1>Study Notes</h1>
`;

    notes.forEach((note) => {
      html += `  <article>
    <h2>${escapeHtml(note.title)}</h2>
    ${note.chapter ? `<p class="chapter">Chapter: ${escapeHtml(note.chapter)}</p>` : ""}
    <div class="content">${escapeHtml(note.content)}</div>
    <p class="date">Last updated: ${new Date(note.updated_at).toLocaleDateString()}</p>
  </article>
  <hr>\n`;
    });

    html += `</body>
</html>`;

    downloadFile(html, "study_notes.html", "text/html");
    toast.success("Notes exported as HTML (print to PDF)!");
  };

  const exportFlashcardsAsHTML = (flashcards: ExportFlashcard[]) => {
    if (flashcards.length === 0) {
      toast.error("No flashcards to export");
      return;
    }

    // Group by deck
    const decks: Record<string, ExportFlashcard[]> = {};
    flashcards.forEach((card) => {
      if (!decks[card.deck_name]) {
        decks[card.deck_name] = [];
      }
      decks[card.deck_name].push(card);
    });

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flashcards</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .question { font-weight: 600; color: #1f2937; }
    .answer { color: #4b5563; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #d1d5db; }
    @media print { body { max-width: 100%; } .card { break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>Flashcards</h1>
`;

    Object.entries(decks).forEach(([deckName, cards]) => {
      html += `  <section>
    <h2>${escapeHtml(deckName)}</h2>\n`;
      cards.forEach((card) => {
        html += `    <div class="card">
      <p class="question">Q: ${escapeHtml(card.front)}</p>
      <p class="answer">A: ${escapeHtml(card.back)}</p>
    </div>\n`;
      });
      html += `  </section>\n`;
    });

    html += `</body>
</html>`;

    downloadFile(html, "flashcards.html", "text/html");
    toast.success("Flashcards exported as HTML (print to PDF)!");
  };

  return {
    exportNotesAsMarkdown,
    exportNotesAsHTML,
    exportFlashcardsAsMarkdown,
    exportFlashcardsAsHTML,
  };
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
