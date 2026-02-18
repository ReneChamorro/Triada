'use client'

import { useState, useEffect } from 'react'
import { Play, AlertCircle } from 'lucide-react'

interface VideoPlayerProps {
  videoUrl?: string | null
  youtubeVideoId?: string | null
  title?: string
  className?: string
  autoplay?: boolean
}

/**
 * Video Player Component
 * Supports:
 * - YouTube videos (via youtube_video_id or extracting from videoUrl)
 * - Direct video URLs (MP4, etc.)
 * - Supabase Storage URLs
 */
export default function VideoPlayer({ 
  videoUrl, 
  youtubeVideoId,
  title = 'Video',
  className = '',
  autoplay = false
}: VideoPlayerProps) {
  const [extractedYoutubeId, setExtractedYoutubeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If we have a direct YouTube ID, use it
    if (youtubeVideoId) {
      setExtractedYoutubeId(youtubeVideoId)
      return
    }

    // Try to extract YouTube ID from URL
    if (videoUrl) {
      const id = extractYouTubeId(videoUrl)
      if (id) {
        setExtractedYoutubeId(id)
      }
    }
  }, [videoUrl, youtubeVideoId])

  // Extract YouTube video ID from various URL formats
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct ID
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  // If we have YouTube ID, render YouTube player
  if (extractedYoutubeId || youtubeVideoId) {
    const videoId = extractedYoutubeId || youtubeVideoId
    // Parameters to minimize YouTube UI and branding
    const params = new URLSearchParams({
      rel: '0',                    // No related videos at end
      modestbranding: '1',         // Minimal YouTube branding
      fs: '1',                     // Allow fullscreen
      disablekb: '0',              // Enable keyboard controls
      playsinline: '1',            // Play inline on iOS
      enablejsapi: '1',            // Enable JS API for tracking
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      ...(autoplay && { autoplay: '1' })
    })
    const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`

    return (
      <div className={`relative w-full ${className}`}>
        <div className="relative pt-[56.25%]"> {/* 16:9 Aspect Ratio */}
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    )
  }

  // If we have a direct video URL (non-YouTube)
  if (videoUrl) {
    return (
      <div className={`relative w-full ${className}`}>
        <video
          controls
          controlsList="nodownload"
          className="w-full rounded-lg shadow-lg"
          onError={() => setError('Error al cargar el video')}
        >
          <source src={videoUrl} type="video/mp4" />
          Tu navegador no soporta la reproducción de videos.
        </video>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                Verifica que la URL del video sea correcta y accesible.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // No video available
  return (
    <div className={`relative w-full ${className}`}>
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Play className="h-16 w-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay video disponible</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Helper function to validate YouTube URL/ID
 */
export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct ID
  ]
  return patterns.some(pattern => pattern.test(url))
}

/**
 * Helper function to get YouTube thumbnail
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'hq' | 'mqdefault' | 'maxres' = 'hq'): string {
  const qualityMap = {
    'default': 'default.jpg',
    'hq': 'hqdefault.jpg',
    'mqdefault': 'mqdefault.jpg',
    'maxres': 'maxresdefault.jpg'
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`
}
