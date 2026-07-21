export function extractYouTubeId(url: string | undefined | null): string | null {
  if (!url || typeof url !== "string") return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function buildEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    ...(autoplay ? { autoplay: "1", mute: "1" } : {}),
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
