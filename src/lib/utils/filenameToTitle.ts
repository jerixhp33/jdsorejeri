export function cleanFilename(filename: string): { title: string; isGeneric: boolean } {
  // Remove extension
  let name = filename.replace(/\.[^/.]+$/, "");
  
  // Generic patterns to check BEFORE heavy cleanup
  const genericPatterns = [
    /^IMG_?[0-9]+/i,
    /^DSC_?[0-9]+/i,
    /^WhatsApp Image/i,
    /^Untitled/i,
    /^Screenshot/i,
    /^Image\s*[0-9]+/i,
    /^[0-9_-]+$/, // Just numbers, dashes, underscores
  ];

  const isGeneric = genericPatterns.some(pattern => pattern.test(name));

  // Clean up the string (replace dashes/underscores with spaces)
  name = name.replace(/[-_]/g, ' ');
  
  // Title case it
  name = name.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );

  // Trim extra spaces
  name = name.replace(/\s+/g, ' ').trim();

  // If it's generic, we just return the cleaned up name but flag it
  if (isGeneric || name.length < 2) {
    return { title: name || "Untitled Poster", isGeneric: true };
  }

  // Add " Poster" suffix if it doesn't have it
  if (!name.toLowerCase().includes('poster')) {
    name += " Poster";
  }

  return { title: name, isGeneric: false };
}
