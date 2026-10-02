import { NextResponse } from 'next/server';

export async function POST() {
  const prompt = `You an architectural color designer. Generate a beautiful color palette for a house floorplan. 

Return ONLY a valid JSON object matching this exact schema:
{
  "colors": {
    "background": "#hex",
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex"
  },
  "explanation": "A 2-sentence rationale for why these harsh color combinations work across the living, kitchen, and private zones."
}

Do not include markdown code block formatting, notes, or extra text.`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3:4b', // Using e2b for fast CPU execution
        prompt: prompt,
        stream: false,
        format: 'json'
      })
    });

    const data = await response.json();
    const parsedData = JSON.parse(data.response);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate brutalist palette' }, 
      { status: 500 }
    );
  }
}