import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const hashtag = req.nextUrl.searchParams.get("hashtag");
  if (!hashtag) {
    return NextResponse.json({ error: "hashtag is required" }, { status: 400 });
  }

  const res = await fetch(
    `https://flashapi1.p.rapidapi.com/ig/hashtag/?hashtag=${encodeURIComponent(hashtag)}&tabs=recent&nocors=false`,
    {
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "flashapi1.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
      },
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
