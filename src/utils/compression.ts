import pako from 'pako'

/**
 * Decompress base64 compressed data
 * @param compressedData Base64 encoded compressed string
 * @returns Decompressed object
 */
export function decompressData<T = any>(compressedData: string): T {
  try {
    // Decode base64
    const binaryString = atob(compressedData)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    // Decompress using pako (zlib)
    const decompressed = pako.inflate(bytes, { to: 'string' })
    
    // Parse JSON
    return JSON.parse(decompressed) as T
  } catch (error) {
    console.error('Failed to decompress data:', error)
    throw error
  }
}

/**
 * Compress and encode data to base64
 * @param data Object to compress
 * @returns Base64 encoded compressed string
 */
export function compressData(data: any): string {
  try {
    const jsonString = JSON.stringify(data)
    const compressed = pako.deflate(jsonString)
    
    // Convert to base64
    let binary = ''
    const len = compressed.byteLength
    for (let i = 0; i < len; i++) {
      const byte = compressed[i]
      if (byte !== undefined) {
        binary += String.fromCharCode(byte)
      }
    }
    
    return btoa(binary)
  } catch (error) {
    console.error('Failed to compress data:', error)
    throw error
  }
}
