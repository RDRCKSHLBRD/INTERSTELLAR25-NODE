-- Album Catalog Report
-- Complete album listing with sales data

SELECT 
    al.id as album_id,
    al.catalogue as catalogue_number,
    al.name as album_name,
    ar.name as artist_name,
    al.release_date,
    al.tracks as track_count,
    pr.price as album_price,
    COALESCE(sales.times_sold, 0) as times_sold,
    ROUND(COALESCE(sales.revenue, 0)::numeric, 2) as total_revenue
FROM albums al
JOIN artists ar ON al.artist_id = ar.id
LEFT JOIN products pr ON al.catalogue = pr.catalogue_id
LEFT JOIN (
    SELECT 
        pi.product_id,
        COUNT(*) as times_sold,
        SUM(pi.price::numeric) as revenue
    FROM purchase_items pi
    JOIN purchases p ON pi.purchase_id = p.id
    WHERE p.status = 'completed'
    GROUP BY pi.product_id
) sales ON pr.id = sales.product_id
ORDER BY al.release_date DESC;
