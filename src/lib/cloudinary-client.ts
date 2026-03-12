/**
 * Generates an optimized Cloudinary URL with transformations
 * Example: f_auto,q_auto,w_800
 */
export function getOptimizedImageUrl(url: string, width: number = 800) {
    if (!url || !url.includes('cloudinary.com')) return url;
  
    // Split URL to inject transformations
    // Standard URL: https://res.cloudinary.com/<cloud>/image/upload/<version>/<public_id>
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;
  
    return `${parts[0]}/upload/f_auto,q_auto,w_${width}/${parts[1]}`;
  }
