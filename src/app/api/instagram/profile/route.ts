import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const res = await fetch(
    `https://instagram-looter2.p.rapidapi.com/profile?username=${encodeURIComponent(username)}`,
    {
      headers: {
        "x-rapidapi-host": "instagram-looter2.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
      },
    }
  );

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const followers = data.edge_followed_by?.count || 0;
  const mediaCount = data.edge_owner_to_timeline_media?.count || 0;
  const posts = (data.edge_owner_to_timeline_media?.edges || []).map(
    (edge: Record<string, Record<string, unknown>>) => {
      const node = edge.node;
      return {
        id: node.id,
        shortcode: node.shortcode,
        display_url: node.display_url,
        is_video: node.is_video,
        like_count: (node.edge_liked_by as Record<string, number>)?.count || 0,
        comment_count: (node.edge_media_to_comment as Record<string, number>)?.count || 0,
      };
    }
  );

  // Calculate engagement rate: avg(likes+comments) / followers * 100
  let engagementRate = 0;
  if (posts.length > 0 && followers > 0) {
    const totalEngagement = posts.reduce(
      (sum: number, p: { like_count: number; comment_count: number }) =>
        sum + p.like_count + p.comment_count,
      0
    );
    engagementRate = (totalEngagement / posts.length / followers) * 100;
  }

  return NextResponse.json({
    id: data.id,
    username: data.username,
    full_name: data.full_name,
    biography: data.biography,
    profile_pic_url: data.profile_pic_url,
    is_verified: data.is_verified,
    is_business_account: data.is_business_account,
    is_professional_account: data.is_professional_account,
    category_name: data.category_name || null,
    external_url: data.external_url || null,
    followers,
    following: data.edge_follow?.count || 0,
    media_count: mediaCount,
    engagement_rate: engagementRate,
    recent_posts: posts.slice(0, 12),
  });
}
