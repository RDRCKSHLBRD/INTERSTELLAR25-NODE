-- Cart Status Report
-- Current cart contents and abandoned carts

SELECT 
    c.id as cart_id,
    c.user_id,
    u.user_name,
    c.session_id,
    c.created_at as cart_created,
    c.updated_at as cart_updated,
    COUNT(ci.id) as current_items,
    COALESCE(SUM(p.price::numeric * ci.quantity), 0) as cart_value,
    CASE 
        WHEN c.user_id IS NOT NULL THEN 'User Cart'
        WHEN c.session_id IS NOT NULL THEN 'Session Cart'
        ELSE 'Unknown'
    END as cart_type
FROM carts c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN cart_items ci ON c.id = ci.cart_id
LEFT JOIN products p ON ci.product_id = p.id
GROUP BY c.id, c.user_id, u.user_name, c.session_id, c.created_at, c.updated_at
ORDER BY c.updated_at DESC;
