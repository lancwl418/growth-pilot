"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/hooks/use-language";
import {
  ArrowLeft,
  Search,
  Hash,
  AtSign,
  Type,
  Loader2,
  ExternalLink,
  UserPlus,
  Check,
  Link as LinkIcon,
  Trash2,
  Play,
  Users,
} from "lucide-react";

function proxyImg(url: string) {
  if (!url) return "";
  return `/api/instagram/proxy-image?url=${encodeURIComponent(url)}`;
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

type SearchMode = "username" | "hashtag" | "keyword";
type Tab = "search" | "candidates";

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  biography: string;
  profile_pic_url: string;
  is_verified: boolean;
  is_business_account: boolean;
  is_professional_account: boolean;
  category_name: string | null;
  external_url: string | null;
  followers: number;
  following: number;
  media_count: number;
  engagement_rate: number;
  recent_posts: {
    id: string;
    shortcode: string;
    display_url: string;
    is_video: boolean;
    like_count: number;
    comment_count: number;
  }[];
}

interface SearchUser {
  username: string;
  full_name: string;
  profile_pic_url: string;
  is_verified: boolean;
  pk: string;
}

interface Candidate {
  id: string;
  igUserId: string;
  username: string;
  fullName: string | null;
  profilePicUrl: string | null;
  biography: string | null;
  isVerified: boolean;
  categoryName: string | null;
  externalUrl: string | null;
  followers: number;
  following: number;
  mediaCount: number;
  engagementRate: number;
  status: string;
  createdAt: string;
}

export default function InfluencerManagementPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("search");
  const [searchMode, setSearchMode] = useState<SearchMode>("username");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Profile view (username search)
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Keyword/hashtag search results
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);

  const [searched, setSearched] = useState(false);
  const [addingCandidate, setAddingCandidate] = useState(false);
  const [isCandidate, setIsCandidate] = useState(false);

  // Followers
  const [followers, setFollowers] = useState<{ pk: string; username: string; full_name: string; profile_pic_url: string; is_verified: boolean; is_private: boolean }[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [followersNextMaxId, setFollowersNextMaxId] = useState<string | null>(null);
  const [followersHasMore, setFollowersHasMore] = useState(false);
  const [followersLoadingMore, setFollowersLoadingMore] = useState(false);
  const [selectedFollowers, setSelectedFollowers] = useState<Set<string>>(new Set());
  const [addingFollowers, setAddingFollowers] = useState(false);

  // Candidates list
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateIds, setCandidateIds] = useState<Set<string>>(new Set());

  const loadCandidates = useCallback(async () => {
    setCandidatesLoading(true);
    try {
      const res = await fetch("/api/instagram/candidates");
      const data = await res.json();
      setCandidates(data);
      setCandidateIds(new Set(data.map((c: Candidate) => c.igUserId)));
    } catch { /* ignore */ }
    finally { setCandidatesLoading(false); }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setProfile(null);
    setSearchUsers([]);

    try {
      if (searchMode === "username") {
        const res = await fetch(`/api/instagram/profile?username=${encodeURIComponent(query.replace("@", ""))}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setIsCandidate(candidateIds.has(data.id));
        }
      } else {
        const res = await fetch(`/api/instagram/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchUsers(
          (data.users || []).map((u: { user: SearchUser }) => ({
            username: u.user.username,
            full_name: u.user.full_name,
            profile_pic_url: u.user.profile_pic_url,
            is_verified: u.user.is_verified,
            pk: u.user.pk,
          }))
        );
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const viewProfile = async (username: string) => {
    setSearchMode("username");
    setQuery(username);
    setLoading(true);
    setSearchUsers([]);
    setProfile(null);
    setSearched(true);
    setShowFollowers(false);
    setFollowers([]);
    try {
      const res = await fetch(`/api/instagram/profile?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setIsCandidate(candidateIds.has(data.id));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const addToCandidate = async () => {
    if (!profile) return;
    setAddingCandidate(true);
    try {
      const res = await fetch("/api/instagram/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igUserId: profile.id,
          username: profile.username,
          fullName: profile.full_name,
          profilePicUrl: profile.profile_pic_url,
          biography: profile.biography,
          isVerified: profile.is_verified,
          categoryName: profile.category_name,
          externalUrl: profile.external_url,
          followers: profile.followers,
          following: profile.following,
          mediaCount: profile.media_count,
          engagementRate: profile.engagement_rate,
        }),
      });
      if (res.ok) {
        setIsCandidate(true);
        loadCandidates();
      }
    } catch { /* ignore */ }
    finally { setAddingCandidate(false); }
  };

  const removeCandidate = async (id: string) => {
    try {
      await fetch(`/api/instagram/candidates?id=${id}`, { method: "DELETE" });
      loadCandidates();
      if (profile) setIsCandidate(false);
    } catch { /* ignore */ }
  };

  const parseFollowers = (users: { pk: string; username: string; full_name: string; profile_pic_url: string; is_verified: boolean; is_private: boolean }[]) =>
    users.map((u) => ({
      pk: u.pk,
      username: u.username,
      full_name: u.full_name,
      profile_pic_url: u.profile_pic_url,
      is_verified: u.is_verified,
      is_private: u.is_private,
    }));

  const viewFollowers = async (userId: string) => {
    setShowFollowers(true);
    setFollowersLoading(true);
    setFollowers([]);
    setFollowersNextMaxId(null);
    setFollowersHasMore(false);
    try {
      const res = await fetch(`/api/instagram/followers?userId=${userId}`);
      const data = await res.json();
      setFollowers(parseFollowers(data.users || []));
      setFollowersHasMore(data.has_more || false);
      setFollowersNextMaxId(data.next_max_id || null);
    } catch { /* ignore */ }
    finally { setFollowersLoading(false); }
  };

  const loadMoreFollowers = async () => {
    if (!profile || !followersNextMaxId) return;
    setFollowersLoadingMore(true);
    try {
      const res = await fetch(`/api/instagram/followers?userId=${profile.id}&maxId=${followersNextMaxId}`);
      const data = await res.json();
      setFollowers((prev) => {
        const existing = new Set(prev.map((f) => f.pk));
        const newFollowers = parseFollowers(data.users || []).filter((f) => !existing.has(f.pk));
        return [...prev, ...newFollowers];
      });
      setFollowersHasMore(data.has_more || false);
      setFollowersNextMaxId(data.next_max_id || null);
    } catch { /* ignore */ }
    finally { setFollowersLoadingMore(false); }
  };

  const toggleFollowerSelection = (pk: string) => {
    setSelectedFollowers((prev) => {
      const next = new Set(prev);
      if (next.has(pk)) next.delete(pk);
      else next.add(pk);
      return next;
    });
  };

  const toggleAllFollowers = () => {
    if (selectedFollowers.size === followers.filter((f) => !candidateIds.has(f.pk)).length) {
      setSelectedFollowers(new Set());
    } else {
      setSelectedFollowers(new Set(followers.filter((f) => !candidateIds.has(f.pk)).map((f) => f.pk)));
    }
  };

  const addSelectedFollowersToCandidates = async () => {
    if (selectedFollowers.size === 0) return;
    setAddingFollowers(true);
    const selected = followers.filter((f) => selectedFollowers.has(f.pk));
    for (const f of selected) {
      try {
        await fetch("/api/instagram/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            igUserId: f.pk,
            username: f.username,
            fullName: f.full_name,
            profilePicUrl: f.profile_pic_url,
            isVerified: f.is_verified,
          }),
        });
      } catch { /* ignore duplicates */ }
    }
    setSelectedFollowers(new Set());
    await loadCandidates();
    setAddingFollowers(false);
  };

  const modes: { key: SearchMode; icon: typeof Search; label: string }[] = [
    { key: "username", icon: AtSign, label: t.socialMedia.searchUsername },
    { key: "hashtag", icon: Hash, label: t.socialMedia.searchHashtag },
    { key: "keyword", icon: Type, label: t.socialMedia.searchKeyword },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/social-media" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">{t.socialMedia.influencerManagement}</h1>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 border-b pb-0">
        <button
          onClick={() => setTab("search")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "search" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          {t.socialMedia.search}
        </button>
        <button
          onClick={() => { setTab("candidates"); loadCandidates(); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "candidates" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          {t.socialMedia.candidatesList} ({candidates.length})
        </button>
      </div>

      {/* ========== SEARCH TAB ========== */}
      {tab === "search" && (
        <>
          {/* Search Controls */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-2">
                {modes.map((mode) => (
                  <Button
                    key={mode.key}
                    variant={searchMode === mode.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSearchMode(mode.key);
                      setSearched(false);
                      setProfile(null);
                      setSearchUsers([]);
                    }}
                  >
                    <mode.icon className="h-4 w-4 mr-1" />
                    {mode.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {searchMode === "username" && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  )}
                  <Search className={`absolute ${searchMode === "username" ? "left-7" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
                  <input
                    type="text"
                    placeholder={
                      searchMode === "username" ? t.socialMedia.placeholderUsername
                        : searchMode === "hashtag" ? t.socialMedia.placeholderHashtag
                        : t.socialMedia.placeholderKeyword
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className={`w-full rounded-md border ${searchMode === "username" ? "pl-12" : "pl-10"} pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring`}
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading || !query.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.socialMedia.search}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}

          {/* Profile Card (username search) */}
          {!loading && profile && (
            <Card className="bg-gray-50/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <img
                    src={proxyImg(profile.profile_pic_url)}
                    alt={profile.username}
                    className="h-16 w-16 rounded-full shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold">{profile.full_name}</h2>
                      <span className="text-gray-500">@{profile.username}</span>
                      {profile.is_verified && (
                        <span className="text-blue-500 font-bold">✓</span>
                      )}
                      {profile.category_name && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                          {profile.category_name}
                        </span>
                      )}
                      {profile.is_business_account && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          Business
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line line-clamp-3">
                      {profile.biography}
                    </p>
                    {/* Stats */}
                    <div className="flex gap-6 mt-3">
                      <button
                        className="text-center hover:bg-gray-100 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
                        onClick={() => viewFollowers(profile.id)}
                      >
                        <p className="text-lg font-bold">{formatCount(profile.followers)}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="h-3 w-3" /> Followers
                        </p>
                      </button>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatCount(profile.following)}</p>
                        <p className="text-xs text-gray-500">Following</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{formatCount(profile.media_count)}</p>
                        <p className="text-xs text-gray-500">Posts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{profile.engagement_rate.toFixed(2)}%</p>
                        <p className="text-xs text-gray-500">Eng. Rate</p>
                      </div>
                    </div>
                    {/* Website */}
                    {profile.external_url && (
                      <a
                        href={profile.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        {profile.external_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    )}
                  </div>
                  {/* Add to Candidates button */}
                  <div className="shrink-0">
                    {isCandidate ? (
                      <Button variant="outline" size="sm" disabled>
                        <Check className="h-4 w-4 mr-1" />
                        {t.socialMedia.added}
                      </Button>
                    ) : (
                      <Button
                        onClick={addToCandidate}
                        disabled={addingCandidate}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      >
                        {addingCandidate ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-1" />
                        )}
                        {t.socialMedia.addToCandidate}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Recent Posts */}
                {profile.recent_posts.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">{t.socialMedia.recentPosts}</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {profile.recent_posts.map((post) => (
                        <a
                          key={post.id}
                          href={`https://instagram.com/p/${post.shortcode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square rounded-lg overflow-hidden border bg-gray-100"
                        >
                          <img
                            src={proxyImg(post.display_url)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          {post.is_video && (
                            <div className="absolute top-1.5 right-1.5">
                              <Play className="h-4 w-4 text-white drop-shadow" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-2">
                            <span>&#x2764; {formatCount(post.like_count)}</span>
                            <span>&#x1F4AC; {formatCount(post.comment_count)}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Followers Section */}
                {showFollowers && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {t.socialMedia.followersOf} @{profile.username}
                      </h3>
                      <div className="flex items-center gap-2">
                        {followers.length > 0 && (
                          <>
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedFollowers.size > 0 && selectedFollowers.size === followers.filter((f) => !candidateIds.has(f.pk)).length}
                                onChange={toggleAllFollowers}
                                className="rounded"
                              />
                              {t.socialMedia.selectAll}
                            </label>
                            {selectedFollowers.size > 0 && (
                              <Button
                                size="sm"
                                onClick={addSelectedFollowersToCandidates}
                                disabled={addingFollowers}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                              >
                                {addingFollowers ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                ) : (
                                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                                )}
                                {t.socialMedia.addSelected} ({selectedFollowers.size})
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setShowFollowers(false); setSelectedFollowers(new Set()); }}
                          className="text-xs text-gray-400"
                        >
                          {t.socialMedia.hideFollowers}
                        </Button>
                      </div>
                    </div>
                    {followersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : followers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">{t.socialMedia.noResults}</p>
                    ) : (
                      <>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {followers.map((f) => {
                            const alreadyAdded = candidateIds.has(f.pk);
                            return (
                            <div key={f.pk} className={`flex items-center gap-3 rounded-lg border p-3 ${selectedFollowers.has(f.pk) ? "bg-purple-50 border-purple-200" : ""}`}>
                              <input
                                type="checkbox"
                                checked={selectedFollowers.has(f.pk)}
                                disabled={alreadyAdded}
                                onChange={() => toggleFollowerSelection(f.pk)}
                                className="rounded shrink-0"
                              />
                              <img
                                src={proxyImg(f.profile_pic_url)}
                                alt={f.username}
                                className="h-10 w-10 rounded-full shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate flex items-center gap-1">
                                  @{f.username}
                                  {f.is_verified && <span className="text-blue-500">✓</span>}
                                  {f.is_private && <span className="text-gray-400">🔒</span>}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{f.full_name}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => viewProfile(f.username)}
                                  title={t.socialMedia.searchUsername}
                                >
                                  <Search className="h-3.5 w-3.5" />
                                </Button>
                                <a
                                  href={`https://instagram.com/${f.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="ghost" size="sm">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </a>
                              </div>
                              {alreadyAdded && (
                                <span className="text-xs text-green-600 shrink-0">✓</span>
                              )}
                            </div>
                            );
                          })}
                        </div>
                        {followersHasMore && (
                          <div className="flex justify-center mt-4">
                            <Button
                              variant="outline"
                              onClick={loadMoreFollowers}
                              disabled={followersLoadingMore}
                            >
                              {followersLoadingMore ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : null}
                              {t.socialMedia.loadMore}
                            </Button>
                          </div>
                        )}
                        <p className="text-xs text-center text-gray-400 mt-2">
                          {followers.length} {t.socialMedia.loaded}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Keyword/Hashtag search user results */}
          {!loading && searchUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.socialMedia.usersFound} ({searchUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {searchUsers.map((user) => (
                    <button
                      key={user.pk}
                      onClick={() => viewProfile(user.username)}
                      className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={proxyImg(user.profile_pic_url)}
                        alt={user.username}
                        className="h-12 w-12 rounded-full shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate flex items-center gap-1">
                          @{user.username}
                          {user.is_verified && <span className="text-blue-500">✓</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {!loading && searched && !profile && searchUsers.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">{t.socialMedia.noResults}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ========== CANDIDATES TAB ========== */}
      {tab === "candidates" && (
        <Card>
          <CardContent className="pt-6">
            {candidatesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : candidates.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t.socialMedia.noCandidates}</p>
            ) : (
              <div className="space-y-3">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-4 rounded-lg border p-4 hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={c.profilePicUrl ? proxyImg(c.profilePicUrl) : ""}
                      alt={c.username}
                      className="h-12 w-12 rounded-full shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {c.fullName || c.username}
                        </p>
                        <span className="text-sm text-gray-500">@{c.username}</span>
                        {c.isVerified && <span className="text-blue-500">✓</span>}
                        {c.categoryName && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            {c.categoryName}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500 mt-0.5">
                        <span>{formatCount(c.followers)} followers</span>
                        <span>{formatCount(c.mediaCount)} posts</span>
                        <span>{c.engagementRate.toFixed(2)}% eng.</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewProfile(c.username).then(() => setTab("search"))}
                      >
                        <Search className="h-3.5 w-3.5" />
                      </Button>
                      <a href={`https://instagram.com/${c.username}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeCandidate(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
