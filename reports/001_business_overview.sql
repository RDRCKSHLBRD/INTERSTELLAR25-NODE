-- Business Overview Report
-- Total transactions, revenue, customers

SELECT 
    COUNT(DISTINCT p.id) as total_transactions,
    COUNT(DISTINCT p.user_id) as unique_customers,
    ROUND(SUM(p.total_amount)::numeric, 2) as total_revenue,
    ROUND(AVG(p.total_amount)::numeric, 2) as avg_order_value,
    MIN(p.purchased_at) as first_sale,
    MAX(p.purchased_at) as latest_sale
FROM purchases p
WHERE p.status = 'completed';
