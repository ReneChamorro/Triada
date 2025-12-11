import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function generateSignedUrl(
  videoUrl: string,
  userId: string,
  expiresIn: number = 7200 // 2 hours in seconds
): string {
  // This is a placeholder - in production, implement proper signed URL generation
  // with HMAC or use your video provider's signed URL generation
  const expiresAt = Date.now() + expiresIn * 1000
  const token = btoa(`${userId}:${expiresAt}`)
  return `${videoUrl}?token=${token}&expires=${expiresAt}`
}

export function validateSignedUrl(url: string, userId: string): boolean {
  try {
    const urlObj = new URL(url)
    const token = urlObj.searchParams.get('token')
    const expires = urlObj.searchParams.get('expires')
    
    if (!token || !expires) return false
    
    const decoded = atob(token)
    const [tokenUserId, tokenExpires] = decoded.split(':')
    
    if (tokenUserId !== userId) return false
    if (Date.now() > parseInt(tokenExpires)) return false
    
    return true
  } catch {
    return false
  }
}
