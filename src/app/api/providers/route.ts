import { NextResponse } from "next/server";

export async function GET() {
  const groq = Boolean(process.env.GROQ_API_KEY?.trim());
  const openrouter = Boolean(process.env.OPENROUTER_API_KEY?.trim());
  return NextResponse.json({ groq, openrouter });
}