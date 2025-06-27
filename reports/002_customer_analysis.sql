-- Customer Analysis Report
-- Customer details with purchase history

SELECT 
    u.id as user_id,
    u.user_name,
    u.email,
    u.created_at as registration_date,
    u.last_login,
    COUNT(p.id) as total_purchases,
    ROUND(SUM(p.total_amount)::numeric, 2) as lifetime_value,
    MIN(p.purchased_at) as first_purchase,
    MAX(p.purchased_at) as latest_purchase
FROM users u
LEFT JOIN purchases p ON u.id = p.user_id AND p.status = 'completed'
GROUP BY u.id, u.user_name, u.email, u.created_at, u.last_login
ORDER BY lifetime_value DESC NULLS LAST;
