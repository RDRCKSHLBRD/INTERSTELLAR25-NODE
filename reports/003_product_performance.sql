-- Product Performance Report
-- Sales by product with revenue

SELECT 
    pr.id as product_id,
    pr.name as product_name,
    pr.cat_id,
    pr.price,
    CASE 
        WHEN pr.song_id IS NOT NULL THEN 'Song'
        WHEN pr.catalogue_id IS NOT NULL THEN 'Album'
        ELSE 'Unknown'
    END as product_type,
    COALESCE(sales.times_sold, 0) as times_sold,
    ROUND(COALESCE(sales.total_revenue, 0)::numeric, 2) as total_revenue
FROM products pr
LEFT JOIN (
    SELECT 
        pi.product_id,
        COUNT(pi.id) as times_sold,
        SUM(pi.price::numeric * pi.quantity) as total_revenue
    FROM purchase_items pi
    JOIN purchases p ON pi.purchase_id = p.id
    WHERE p.status = 'completed'
    GROUP BY pi.product_id
) sales ON pr.id = sales.product_id
ORDER BY total_revenue DESC NULLS LAST;
