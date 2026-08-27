-- Migration: 034_seed_custom_poster_product.sql
-- Description: Seeds the dynamic custom-photo-poster product base only. Variants will be added manually via Admin UI.

DO $$
DECLARE
    v_product_id UUID := gen_random_uuid();
    v_category_id UUID;
BEGIN
    -- 1. Try to find a 'Posters' category, otherwise pick the first category, or insert a generic one
    SELECT id INTO v_category_id FROM public.product_categories WHERE slug = 'posters' LIMIT 1;
    
    IF v_category_id IS NULL THEN
        SELECT id INTO v_category_id FROM public.product_categories LIMIT 1;
    END IF;

    -- If there are NO categories at all, create one
    IF v_category_id IS NULL THEN
        v_category_id := gen_random_uuid();
        INSERT INTO public.product_categories (id, name, slug, description, product_type) 
        VALUES (v_category_id, 'Posters', 'posters', 'Wall posters', 'poster');
    END IF;

    -- 2. Check if custom-photo-poster already exists
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'custom-photo-poster') THEN
        INSERT INTO public.products (
            id, slug, name, short_description, description, 
            price, cost_price, stock, sku, category_id, 
            is_active, is_featured, is_customizable, product_type, attributes
        ) VALUES (
            v_product_id, 'custom-photo-poster', 'Custom Photo Poster', 'Turn your memories into premium wall art.', 
            'Upload a high-resolution photo and get it printed on museum-grade gallery paper. Available in multiple sizes.',
            199, 100, 999, 'CP-BASE', v_category_id,
            true, true, true, 'poster', '{}'::jsonb
        );
    END IF;
END $$;
