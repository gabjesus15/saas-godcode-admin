"use client";

import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface LandingVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  subtitle?: string;
}

export function LandingVideoPlayer({
  src,
  poster,
  title = "Video demo del producto",
  subtitle = "Versión de demo privada disponible para reuniones comerciales y partners.",
}: LandingVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(
        (videoRef.current.currentTime / videoRef.current.duration) * 100 || 0
      );
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (videoRef.current && containerRef.current) {
      const rect = containerRef.current.querySelector('[data-progress-bar]')?.getBoundingClientRect();
      if (rect) {
        const percent = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = percent * videoRef.current.duration;
      }
    }
  };

  const handlePlayEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-inner"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.35),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))]" />

      {/* Video */}
      <video
        ref={videoRef}
        className="relative z-10 h-full w-full object-cover"
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handlePlayEnded}
        playsInline
        onClick={togglePlay}
      />

      {/* Overlay when not playing */}
      {!isPlaying && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/20 px-6 text-center transition-opacity"
          onClick={togglePlay}
        >
          <button
            onClick={togglePlay}
            className="mb-6 flex h-18 w-18 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-indigo-200 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/20 hover:text-indigo-100"
            aria-label="Reproducir video"
          >
            <Play className="h-7 w-7 fill-current" />
          </button>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-300">
            {subtitle}
          </p>
        </div>
      )}

      {/* Controls (visible when playing or hovering) */}
      {isPlaying && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-200 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {/* Progress Bar */}
          <div
            data-progress-bar
            onClick={handleProgressClick}
            className="h-1 w-full cursor-pointer overflow-hidden rounded-full bg-white/20 hover:h-1.5"
          >
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label={isMuted ? "Activar volumen" : "Silenciar"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
