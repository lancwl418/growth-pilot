import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const res = await fetch(
    `https://instagram-looter2.p.rapidapi.com/search?query=${encodeURIComponent(query)}`,
    {
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "instagram-looter2.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
      },
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
