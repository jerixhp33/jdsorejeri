import { ProductFormData } from '@/components/admin/ProductWorkspaceV2/types';

const getProductContext = (product: ProductFormData) => {
  return `
Product Name: ${product.name || 'Unknown'}
Category: ${product.category_id || 'Uncategorized'}
Product Type: ${product.product_type || 'Unknown'}
Price: ₹${product.price}
Tags: ${product.tags.join(', ')}
Attributes: ${Object.entries(product.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
`;
};

export const generateDescriptionPrompt = (product: ProductFormData) => {
  return `
You are a world-class e-commerce copywriter for a premium brand called "JD Store". 
Write a highly engaging, luxurious, and persuasive product description for the following product.
It should highlight the materials, design, and ideal use cases.
Keep it between 100-150 words. Do not use markdown headers, just return the text paragraphs.

Context:
${getProductContext(product)}
`;
};

export const generateShortDescriptionPrompt = (product: ProductFormData) => {
  return `
You are a world-class e-commerce copywriter. Write a punchy, 1-2 sentence short description (max 150 characters) for a product card.
Focus on the aesthetic and emotional appeal of the product. Do NOT include the price in the description. Do NOT use quotation marks.

Context:
${getProductContext(product)}
`;
};

export const generateSEOPrompt = (product: ProductFormData) => {
  return `
You are an SEO expert. Generate an optimized SEO Title (max 60 characters) and SEO Meta Description (max 160 characters) for this product.
Return ONLY a JSON object with two keys: "title" and "description". Do not include markdown formatting or backticks, just the raw JSON.

Context:
${getProductContext(product)}
`;
};

export const generateTagsPrompt = (product: ProductFormData) => {
  return `
You are an SEO expert. Generate 5-8 highly relevant tags for this product to improve searchability.
Tags should be short, punchy keywords (1-2 words max, e.g., "Bollywood", "Vintage", "A5 Poster").
Do NOT generate long descriptive phrases.
Return ONLY the comma-separated string of tags. Do NOT use quotation marks or bullet points.

Context:
${getProductContext(product)}
`;
};
