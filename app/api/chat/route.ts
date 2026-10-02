import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

// Vertex AI-г initialize хийх (Vertex AI нь apiKey ашигладаггүй, төсөл болон location-оор холбогдоно)
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0410335332',
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

const model = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `
Чи бол "GoldenHodl" цахим хуудасны алтны арилжаа, зах зээлийн судалгаа болон үнийн чиг хандлагын чиглэлээр мэргэшсэн хиймэл оюун ухаант хувийн туслах болон хэрэглэгчийн үйлчилгээний агент юм.
`;

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body as { message: string; history: HistoryItem[] };

    const formattedHistory = (history || []).map(item => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    }));

    const generativeModel = vertexAI.getGenerativeModel({
      model: model,
      systemInstruction: {
        role: 'system',
        parts: [{ text: SYSTEM_PROMPT }]
      },
    });

    const chat = generativeModel.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    const reply = response.candidates?.[0]?.content?.parts?.[0]?.text || 'Хариу олдсонгүй.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Vertex AI Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}