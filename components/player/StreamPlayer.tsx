'use client';

import { useEffect, useRef } from 'react';
import videojs, { VideoJsPlayer } from 'video.js';
import 'video.js/dist/video-js.css';

interface SubtitleTrack {
  language: string;
  url: string;
}

interface StreamPlayerProps {
  source: string;
  poster?: string;
  subtitles: SubtitleTrack[];
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
}

export function StreamPlayer({ source, poster, subtitles, onEnded, onProgress }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const player = videojs(videoElement, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      fluid: true,
      poster,
      playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2]
    });

    player.src({ src: source, type: source.endsWith('.mpd') ? 'application/dash+xml' : 'application/x-mpegURL' });
    player.on('loadedmetadata', () => {
      player.currentTime(0);
    });
    player.on('ended', () => {
      onEnded?.();
    });
    player.on('timeupdate', () => {
      const duration = player.duration();
      if (duration > 0) {
        onProgress?.(player.currentTime() / duration);
      }
    });

    subtitles.forEach((track) => {
      player.addRemoteTextTrack(
        {
          kind: 'subtitles',
          src: track.url,
          srclang: track.language,
          label: track.language.toUpperCase(),
          default: track.language === 'fr'
        },
        false
      );
    });

    playerRef.current = player;

    return () => {
      const instance = playerRef.current;
      if (instance) {
        instance.pause();
        instance.src({ src: '', type: 'video/mp4' });
        instance.load();
        instance.dispose();
        playerRef.current = null;
      }
    };
  }, [source, poster, subtitles, onEnded]);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-big-play-centered" playsInline />
    </div>
  );
}
