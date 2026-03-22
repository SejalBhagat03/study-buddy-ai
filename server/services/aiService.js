const { GoogleGenAI } = require('@google/genai');

const generateQuizFromAI = async (content, count = 5) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in server/.env. Please add it to generate real AI quizzes.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Generate ${count} multiple choice questions from the following content.
Each question must include:
* One correct answer
* Three realistic incorrect options

Return JSON format:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "..."
  }
]

Content:
${content}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });

    try {
        const text = response.text;
        // Strip markdown if AI returned it despite responseMimeType
        const cleanedText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        throw new Error("AI returned invalid JSON. Please try again.");
    }
};

const generateFlashcardsFromAI = async (content, count = 10) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in server/.env. Please add it to generate real AI flashcards.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Generate ${count} study flashcards from the following content.
Each flashcard must include:
* front: A question or concept cue
* back: A detailed answer or explanation

Return JSON format:
[
  {
    "front": "...",
    "back": "..."
  }
]

Content:
${content}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });

    try {
        const text = response.text;
        const cleanedText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        throw new Error("AI returned invalid JSON. Please try again.");
    }
};

const generateChatFromAI = async (messages, studyContent) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in server/.env. Please add it to generate real AI responses.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const contextPrefix = studyContent 
        ? `You are an AI Study Assistant. Use this uploaded material to help accurately:\n--- START CONTENT ---\n${studyContent}\n--- END CONTENT ---\n\n`
        : `You are an AI Study Assistant focused on helping students learn.\n`;

    const chatHistory = messages.map(m => `${m.sender === 'user' || m.sender === 'student' ? 'Student' : 'AI'}: ${m.text}`).join('\n');
    
    const prompt = `${contextPrefix}Here is the conversation history:\n${chatHistory}\n\nAI Response:`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text;
};

const generateSuggestionsFromAI = async (content) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in server/.env. Please add it to generate suggestions.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Based on the following study content, suggest 4 short, interesting questions a student would ask an AI bot to help learn this material.
Return JSON array format containing purely strings:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]

Content:
${content}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });

    try {
        const text = response.text;
        const cleanedText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        throw new Error("AI returned invalid JSON for suggestions.");
    }
};

const generateSummaryFromAI = async (content, title) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in server/.env");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Create a structured summary for the chapter "${title || 'Study Material'}" based on the following content.
The summary must be divided into 4-6 sequential logical "slides".
Each slide must have:
* A short, descriptive title
* 3-4 key bullet points summarizing the concept

Return JSON format:
{
  "slides": [
    {
      "title": "Slide Title",
      "points": ["Key point 1", "Key point 2"]
    }
  ]
}

Content:
${content}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
    });

    try {
        const text = response.text;
        const cleanedText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        throw new Error("AI returned invalid JSON for summary.");
    }
};

module.exports = {
    generateQuizFromAI,
    generateFlashcardsFromAI,
    generateChatFromAI,
    generateSuggestionsFromAI,
    generateSummaryFromAI
};





