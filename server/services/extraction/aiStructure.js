const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const EXTRACT_TOOL = {
  name: 'record_page_products',
  description: 'Records the structured product data visible on a single catalog PDF page.',
  input_schema: {
    type: 'object',
    properties: {
      isProductPage: {
        type: 'boolean',
        description: 'False for cover pages, section dividers, brand-story/lifestyle pages, or any page that does not describe a specific sellable product with a SKU table.'
      },
      products: {
        type: 'array',
        description: 'Usually one product per page. Only include a second entry if the page genuinely shows two unrelated products, not just size/color variants of the same product.',
        items: {
          type: 'object',
          properties: {
            name: { type: ['string', 'null'], description: 'The product/style name exactly as printed, e.g. "SEGNO VE".' },
            brand: { type: ['string', 'null'] },
            material: { type: ['string', 'null'], description: 'Text after "MATERIAL -" if present.' },
            description: { type: ['string', 'null'] },
            badges: {
              type: 'array',
              items: { type: 'string' },
              description: 'Short feature callout labels shown as icon badges, e.g. "TSA-approved Lock", "USB Type C Port". Omit the icon, keep just the label text.'
            },
            variants: {
              type: 'array',
              description: 'One entry per row of the SKU table at the bottom of the page. Read every column exactly as printed; use null for any cell that is blank or illegible. Never invent a value.',
              items: {
                type: 'object',
                properties: {
                  sku: { type: ['string', 'null'] },
                  description: { type: ['string', 'null'] },
                  dimensionsCm: { type: ['string', 'null'], description: 'L x H x W in cm, exactly as printed.' },
                  weightKg: { type: ['number', 'null'] },
                  volumeLtr: { type: ['number', 'null'] },
                  mrp: { type: ['number', 'null'], description: 'Numeric MRP with currency symbol/commas stripped, e.g. 5000 for "₹5,000".' }
                }
              }
            },
            colors: {
              type: 'array',
              description: 'Entries under "Available in:", if present.',
              items: {
                type: 'object',
                properties: {
                  name: { type: ['string', 'null'] },
                  code: { type: ['string', 'null'], description: 'The numeric/short code after the color name, e.g. "09" from "BLACK: 09".' }
                }
              }
            },
            confidence: {
              type: 'number',
              description: 'Your own confidence (0-1) that the fields above were read correctly from the page.'
            }
          },
          required: ['name', 'variants']
        }
      }
    },
    required: ['isProductPage', 'products']
  }
};

const SYSTEM_PROMPT = `You are extracting structured product data from a scanned page of a B2B product catalog PDF for an admin review tool. The page image is the ONLY source of truth.

Rules:
- Read only what is visibly printed on the page. Never guess, infer, or fill in a plausible-looking value.
- If a field is missing, blank, cut off, or unreadable, output null for it - do not invent a number, code, or name.
- Numeric fields (weightKg, volumeLtr, mrp) must be plain numbers with no currency symbols, commas, or units.
- Call the record_page_products tool exactly once with your findings.`;

async function structurePage(pageImagePath) {
  const anthropic = getClient();
  const imageBuffer = await fs.promises.readFile(pageImagePath);
  const base64 = imageBuffer.toString('base64');

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'tool', name: 'record_page_products' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
          { type: 'text', text: 'Extract the product data from this catalog page.' }
        ]
      }
    ]
  });

  const toolUse = response.content.find(block => block.type === 'tool_use');
  if (!toolUse) {
    throw new Error('AI response did not include the expected tool call');
  }
  return toolUse.input;
}

module.exports = { structurePage, MODEL };
