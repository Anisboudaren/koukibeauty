"use client";

import { useEffect, useRef, useState } from "react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { RectangleVertical, RectangleHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  courseId: string;
  lessonId: string;
  title: string;
  className?: string;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; message?: string };
  return (
    e.name === "AbortError" ||
    (typeof e.message === "string" && e.message.toLowerCase().includes("aborted"))
  );
}

export function VideoPlayer({
  courseId,
  lessonId,
  title,
  className,
}: VideoPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isAbortError(event.reason)) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setIsPortrait(false);

    async function load() {
      try {
        const res = await fetch(
          `/api/courses/${courseId}/lessons/${lessonId}/video`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (!data.videoId) throw new Error("missing video");
        setVideoId(data.videoId);
        setError(false);
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(true);
        setVideoId(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => {
      controller.abort("cleanup");
    };
  }, [courseId, lessonId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !videoId) return;

    const updateOrientation = () => {
      const width = player.state.mediaWidth;
      const height = player.state.mediaHeight;
      if (width > 0 && height > 0 && height > width * 1.05) {
        setIsPortrait(true);
      }
    };

    player.addEventListener("loaded-metadata", updateOrientation);
    player.addEventListener("can-play", updateOrientation);
    updateOrientation();

    return () => {
      player.removeEventListener("loaded-metadata", updateOrientation);
      player.removeEventListener("can-play", updateOrientation);
    };
  }, [videoId, lessonId]);

  if (error) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-xl bg-black text-white",
          className
        )}
      >
        <p className="text-sm text-white/70">لا يوجد فيديو لهذا الدرس حالياً</p>
      </div>
    );
  }

  if (!videoId) {
    return (
      <div
        className={cn(
          "aspect-video animate-pulse rounded-xl bg-muted",
          className
        )}
      />
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "kouki-player relative overflow-hidden rounded-xl bg-black",
          isPortrait ? "mx-auto w-full max-w-sm sm:max-w-md" : "w-full"
        )}
        onContextMenu={(e) => e.preventDefault()}
      >
        {loading && (
          <div className="pointer-events-none absolute inset-0 z-10 animate-pulse bg-black/40" />
        )}
        <MediaPlayer
          ref={playerRef}
          className={cn(
            "w-full overflow-hidden rounded-xl bg-black",
            isPortrait
              ? "aspect-[9/16] max-h-[min(78vh,720px)]"
              : "aspect-video"
          )}
          title={title}
          src={`youtube/${videoId}`}
          playsInline
          viewType="video"
          streamType="on-demand"
          aspectRatio={isPortrait ? "9/16" : "16/9"}
          load="visible"
        >
          <MediaProvider>
            <Poster
              className="absolute inset-0 block h-full w-full object-contain opacity-0 transition-opacity data-[visible]:opacity-100"
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt={title}
            />
          </MediaProvider>
          <DefaultVideoLayout icons={defaultLayoutIcons} colorScheme="dark" />
        </MediaPlayer>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsPortrait((v) => !v)}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-xs font-medium text-black/70 transition hover:border-accent hover:text-accent"
        >
          {isPortrait ? (
            <>
              <RectangleHorizontal className="h-4 w-4" />
              عرض أفقي
            </>
          ) : (
            <>
              <RectangleVertical className="h-4 w-4" />
              عرض عمودي
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/** Full-bleed local hero media — muted autoplay video with responsive posters. */
export function HeroVideoBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <video
        className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
        autoPlay
        muted
        loop
        playsInline
        poster="/hero/desktop-hero-fallback.jpeg"
        aria-hidden
      >
        <source src="/hero/vertical-hero.mp4" type="video/mp4" />
      </video>

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(8,6,6,0.75) 0%, rgba(8,6,6,0.32) 45%, rgba(8,6,6,0.5) 100%)",
        }}
      />
    </div>
  );
}
