export async function compressBase64Image(
  dataUrl: string,
  maxDimension: number = 256,
  quality: number = 0.8
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl || '';
  
  // If not base64 data url (e.g. http:// or /logo.svg), return as is
  if (!dataUrl.startsWith('data:image/')) return dataUrl;

  // Small SVG under 40KB can be kept as SVG vector
  if (dataUrl.includes('image/svg+xml') && dataUrl.length < 40000) {
    return dataUrl;
  }

  // If image is already reasonably small (< 30KB), return as is
  if (dataUrl.length < 30000) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width <= 0 || height <= 0) {
          return resolve(dataUrl);
        }

        // Calculate aspect ratio scale down to maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(dataUrl);
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for optimal compression with transparency support
        let result = canvas.toDataURL('image/webp', quality);
        
        // Fallback to PNG if browser doesn't export webp
        if (!result.startsWith('data:image/webp')) {
          result = canvas.toDataURL('image/png');
        }

        // Return compressed version if smaller
        if (result.length < dataUrl.length) {
          resolve(result);
        } else {
          resolve(dataUrl);
        }
      } catch (err) {
        console.warn('Error compressing image:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

/**
  Compresses all image properties in GeneralSettings before persisting to Firestore.
 */
export async function sanitizeGeneralSettingsImages<T extends Record<string, any>>(settings: T): Promise<T> {
  const result = { ...settings };
  const imageFields = [
    'logoURL',
    'logoFoundationURL',
    'stampURL',
    'appIconURL',
    'faviconURL',
    'principalSignatureURL'
  ];

  for (const field of imageFields) {
    if (result[field] && typeof result[field] === 'string' && result[field].startsWith('data:image/')) {
      // Icon/Favicon/Logo: 256px max, Stamp/Sig: 320px max
      const maxDim = (field === 'stampURL' || field === 'principalSignatureURL') ? 320 : 256;
      result[field as keyof T] = (await compressBase64Image(result[field], maxDim, 0.8)) as any;
    }
  }

  return result;
}
