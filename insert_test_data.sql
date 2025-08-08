-- 测试数据插入脚本
-- 用于创建测试用户和示例数据

-- 插入测试用户
INSERT IGNORE INTO users (
    id, 
    email, 
    username, 
    password_hash,
    first_name,
    last_name,
    is_email_verified,
    is_two_factor_enabled,
    role,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@quantconsole.dev',
    'test_user',
    '$2b$12$dummy.hash.for.testing.only.not.real.password.hash',
    'Test',
    'User',
    1,
    0,
    'user',
    NOW(),
    NOW()
);

-- 插入测试监控代币数据
INSERT IGNORE INTO watchlist_tokens (
    user_id,
    symbol,
    exchange,
    is_active,
    notes,
    created_at,
    updated_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'BTC',
    'binance',
    1,
    '比特币 - 加密货币之王',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000001',
    'ETH',
    'binance',
    1,
    '以太坊 - 智能合约平台',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000001',
    'BNB',
    'binance',
    1,
    '币安币 - 交易所代币',
    NOW(),
    NOW()
);

-- 插入测试价格提醒数据  
INSERT IGNORE INTO price_alerts (
    user_id,
    symbol,
    exchange,
    alert_type,
    target_value,
    comparison_value,
    condition,
    is_active,
    is_triggered,
    notification_channels,
    created_at,
    updated_at
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'BTC',
    'binance', 
    'price',
    50000.00,
    NULL,
    '{"operator": "above", "description": "价格突破50000美元"}',
    1,
    0,
    '["email", "push"]',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000001',
    'ETH',
    'binance',
    'price', 
    3000.00,
    NULL,
    '{"operator": "below", "description": "价格跌破3000美元"}',
    1,
    0,
    '["email"]',
    NOW(),
    NOW()
);

-- 插入测试价格历史数据
INSERT IGNORE INTO price_history (
    symbol,
    exchange,
    price,
    volume,
    market_cap,
    change_24h,
    timestamp
) VALUES
(
    'BTC',
    'binance',
    45123.45,
    1234567890.00,
    875000000000.00,
    2.34,
    NOW()
),
(
    'ETH', 
    'binance',
    2876.89,
    987654321.00,
    345000000000.00,
    -1.23,
    NOW()
),
(
    'BNB',
    'binance',
    312.45,
    456789123.00,
    51000000000.00,
    0.89,
    NOW()
);

SELECT 'Test data inserted successfully!' as result;
