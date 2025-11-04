/**
 * Export data to JSON file
 */
export function exportToJson(data: any, filename: string = 'data.json') {
  try {
    // Convert data to JSON string with pretty formatting
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create blob
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('❌ Error exporting to JSON:', error);
    return false;
  }
}

/**
 * Export data to formatted text file
 */
export function exportToText(data: any, filename: string = 'data.txt') {
  try {
    // Convert data to formatted string
    const textContent = JSON.stringify(data, null, 2);
    
    // Create blob
    const blob = new Blob([textContent], { type: 'text/plain' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('❌ Error exporting to text:', error);
    return false;
  }
}

/**
 * Copy data to clipboard
 */
export async function copyToClipboard(data: any): Promise<boolean> {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(jsonString);
    return true;
  } catch (error) {
    console.error('❌ Error copying to clipboard:', error);
    return false;
  }
}
