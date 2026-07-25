import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const maxId = req.nextUrl.searchParams.get("maxId");
  let url = `https://flashapi1.p.rapidapi.com/ig/followers/?id_user=${encodeURIComponent(userId)}&nocors=false`;
  if (maxId) {
    url += `&max_id=${encodeURIComponent(maxId)}`;
  }

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": "flashapi1.p.rapidapi.com",
      "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
    },
  });

  const data = await res.json();
return NextResponse.json({
    users: data.users || [],
    has_more: data.has_more || false,
    next_max_id: data.next_max_id || null,
  });
}
