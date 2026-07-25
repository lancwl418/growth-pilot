import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const candidates = await prisma.influencerCandidate.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(candidates);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const existing = await prisma.influencerCandidate.findUnique({
    where: { igUserId: body.igUserId },
  });

  if (existing) {
    return NextResponse.json({ error: "Already in candidates" }, { status: 409 });
  }

  const candidate = await prisma.influencerCandidate.create({
    data: {
      igUserId: body.igUserId,
      username: body.username,
      fullName: body.fullName || null,
      profilePicUrl: body.profilePicUrl || null,
      biography: body.biography || null,
      isVerified: body.isVerified || false,
      categoryName: body.categoryName || null,
      externalUrl: body.externalUrl || null,
      followers: body.followers || 0,
      following: body.following || 0,
      mediaCount: body.mediaCount || 0,
      engagementRate: body.engagementRate || 0,
    },
  });

  return NextResponse.json(candidate);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.influencerCandidate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
