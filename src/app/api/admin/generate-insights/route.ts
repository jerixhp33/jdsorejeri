import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { requireAdmin } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'mock_key',
});

export async function POST() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createAdminClient();

    // 1. Gather Business Data Context
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Revenue & Orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('status, subtotal, grand_total, created_at')
      .gte('created_at', thirtyDaysAgo);

    let grossRevenue = 0;
    let returns = 0;
    let totalOrders = 0;

    recentOrders?.forEach(o => {
      if (o.status !== 'cancelled') {
        grossRevenue += (o.subtotal || 0);
        totalOrders++;
        if (o.status === 'returned') returns++;
      }
    });

    const returnRate = totalOrders > 0 ? (returns / totalOrders) * 100 : 0;

    // Inventory
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('name, stock')
      .lte('stock', 5)
      .limit(10);
      
    // 2. Build the Prompt Context
    const dataContext = `
      Data from the last 30 days:
      - Total Orders: ${totalOrders}
      - Gross Revenue: ₹${grossRevenue}
      - Return Rate: ${returnRate.toFixed(1)}%
      - Low Stock Products: ${lowStockProducts?.map(p => `${p.name} (Stock: ${p.stock})`).join(', ') || 'None'}
    `;

    const prompt = `
      You are the AI Business Assistant for JD Store (an e-commerce brand).
      Analyze the following data and generate a highly concise, professional business insight report.
      Use Markdown formatting.

      Structure your response EXACTLY with these headings:
      ### Weekly Summary
      (1-2 sentences summarizing the overall business health)
      
      ### Opportunities
      (Bullet points highlighting positive trends or areas to double down on)
      
      ### Risks
      (Bullet points highlighting negative metrics, low stock, or high returns)
      
      ### Recommendations
      (Bullet points with direct, actionable advice for the store owner)
      
      Context Data:
      ${dataContext}
    `;

    if (!process.env.GROQ_API_KEY) {
      // Mock response if no key is configured
      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json({ 
        result: `
### Weekly Summary
JD Store is maintaining steady operations with solid revenue, though return rates require attention.

### Opportunities
* Revenue indicates strong customer purchasing intent.
* High engagement in new collections.

### Risks
* Return rate is currently ${returnRate.toFixed(1)}%.
* Several key items are running low on stock.

### Recommendations
* Restock the following immediately: ${lowStockProducts?.[0]?.name || 'Top products'}.
* Investigate reasons for the return rate to minimize future losses.
        ` 
      });
    }

    // 3. Call Groq
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.5,
      max_tokens: 512,
    });

    return NextResponse.json({ result: completion.choices[0]?.message?.content || '' });
    
  } catch (error: any) {
    console.error('AI Insights Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate insights' }, { status: 500 });
  }
}
