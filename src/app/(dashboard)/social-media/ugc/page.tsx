"use client";

import Link from "next/link";
import { useT } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Video } from "lucide-react";

export default function UgcPage() {
  const t = useT();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/social-media" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">{t.socialMedia.ugc}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-600" />
            {t.socialMedia.ugc}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t.socialMedia.comingSoon}</p>
        </CardContent>
      </Card>
    </div>
  );
}
