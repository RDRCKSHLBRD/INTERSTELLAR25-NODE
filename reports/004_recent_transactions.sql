-- Recent Transactions Report
-- Last 30 days of purchase activity

SELECT 
    p.id as purchase_id,
    p.purchased_at,
    u.user_name,
    u.email,
    p.total_amount,
    p.stripe_session_id,
    STRING_AGG(pr.name, ', ' ORDER BY pr.name) as items_purchased
FROM purchases p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
LEFT JOIN products pr ON pi.product_id = pr.id
WHERE p.purchased_at >= NOW() - INTERVAL '30 days'
  AND p.status = 'completed'
GROUP BY p.id, p.purchased_at, u.user_name, u.email, p.total_amount, p.stripe_session_id
ORDER BY p.purchased_at DESC;
