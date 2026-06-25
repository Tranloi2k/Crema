"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-violet-500 text-white",
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-600 text-white",
  "bg-orange-500 text-white",
  "bg-indigo-500 text-white",
] as const;

function getAvatarLetter(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  return source.charAt(0).toUpperCase();
}

function getAvatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Google avatars block hotlinking unless referrer is stripped. */
function normalizeAvatarUrl(url?: string | null) {
  if (!url?.trim()) return null;
  return url.trim();
}

const sizeClasses = {
  sm: "h-9 w-9 text-sm",
  lg: "h-16 w-16 text-2xl",
} as const;

function FallbackAvatar({
  letter,
  colorClass,
  size,
  className,
}: {
  letter: string;
  colorClass: string;
  size: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        sizeClasses[size],
        colorClass,
        className
      )}
      aria-hidden
    >
      {letter}
    </div>
  );
}

export function UserAvatar({
  name,
  email,
  image,
  size = "sm",
  className,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const seed = name?.trim() || email?.trim() || "?";
  const letter = getAvatarLetter(name, email);
  const colorClass = getAvatarColor(seed);
  const avatarUrl = normalizeAvatarUrl(image);
  const [failed, setFailed] = useState(false);

  if (!avatarUrl || failed) {
    return (
      <FallbackAvatar letter={letter} colorClass={colorClass} size={size} className={className} />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
        sizeClasses[size],
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
