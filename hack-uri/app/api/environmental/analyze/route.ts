import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    if (!genAI) {
      throw new Error("GEMINI_API_KEY is missing from .env.local");
    }

    const { lat, lng } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    // UPDATED MODEL NAME: Use 2.0-flash for better JSON support in 2026
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    });

    const gemini_prompt = `
      You are a geospatial environmental expert. Analyze the coordinates (${lat}, ${lng}).
      Identify the specific city/neighborhood. 
      
      Provide a score from -5 to +5 for the following categories:
      1. "tree": Natural canopy/greenery.
      2. "road": Proximity to major highways/noise pollution.
      3. "lifestyle": Proximity to water (coasts/rivers) or significant public parks.

      Return ONLY a JSON object:
      {
        "regionName": "Neighborhood, City",
        "scores": {
          "tree": { "value": 2, "justification": "..." },
          "road": { "value": -1, "justification": "..." },
          "lifestyle": { "value": 4, "justification": "..." }
        }
      }
    `;

    const result = await model.generateContent(gemini_prompt);
    const response = await result.response;
    const text = response.text();

    // BULLETPROOF CLEANING: Find the first '{' and last '}' to extract only the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("No JSON found in response:", text);
      throw new Error("AI failed to return a valid JSON structure.");
    }

    const cleanedJson = jsonMatch[0];
    const parsedData = JSON.parse(cleanedJson);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("ENVIRONMENTAL_API_ERROR:", error.message);
    
    // Check for common errors to give better feedback to your frontend
    const status = error.message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { error: `Analysis failed: ${error.message}` }, 
      { status }
    );
  }
}