"use client";

import Link from "next/link";
import { useT } from "@/hooks/use-language";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Video, UserCheck } from "lucide-react";

export default function SocialMediaPage() {
  const t = useT();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.nav.socialMedia}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/social-media/ugc">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Video className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t.socialMedia.ugc}</CardTitle>
                  <CardDescription>{t.socialMedia.ugcDesc}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/social-media/influencer-management">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-pink-100 p-2">
                  <UserCheck className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t.socialMedia.influencerManagement}</CardTitle>
                  <CardDescription>{t.socialMedia.influencerManagementDesc}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
