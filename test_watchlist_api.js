// 测试价格监控与提醒系统 API
const API_BASE = 'http://127.0.0.1:8080/api';

// 模拟认证令牌 - 在实际环境中应该通过登录获得
const AUTH_TOKEN = 'your-jwt-token-here';

async function testWatchlistAPI() {
    console.log('🚀 开始测试价格监控与提醒系统 API...\n');

    try {
        // 测试获取监控列表
        console.log('1. 测试获取代币监控列表...');
        const tokensResponse = await fetch(`${API_BASE}/watchlist/tokens`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('状态码:', tokensResponse.status);
        
        if (tokensResponse.ok) {
            const tokens = await tokensResponse.json();
            console.log('✅ 获取监控列表成功:', tokens);
        } else {
            console.log('❌ 获取监控列表失败:', await tokensResponse.text());
        }
        
        console.log('\n2. 测试获取价格提醒列表...');
        const alertsResponse = await fetch(`${API_BASE}/watchlist/alerts`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('状态码:', alertsResponse.status);
        
        if (alertsResponse.ok) {
            const alerts = await alertsResponse.json();
            console.log('✅ 获取提醒列表成功:', alerts);
        } else {
            console.log('❌ 获取提醒列表失败:', await alertsResponse.text());
        }

        // 测试添加监控代币
        console.log('\n3. 测试添加监控代币...');
        const newToken = {
            symbol: 'BTC',
            exchange: 'binance',
            notes: '比特币监控测试'
        };
        
        const addTokenResponse = await fetch(`${API_BASE}/watchlist/tokens`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newToken)
        });
        console.log('状态码:', addTokenResponse.status);
        
        if (addTokenResponse.ok) {
            const result = await addTokenResponse.json();
            console.log('✅ 添加监控代币成功:', result);
        } else {
            console.log('❌ 添加监控代币失败:', await addTokenResponse.text());
        }

        // 测试添加价格提醒
        console.log('\n4. 测试添加价格提醒...');
        const newAlert = {
            symbol: 'BTC',
            exchange: 'binance',
            alert_type: 'price',
            target_value: 50000,
            condition: { operator: 'above' },
            notification_channels: ['email', 'push']
        };
        
        const addAlertResponse = await fetch(`${API_BASE}/watchlist/alerts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newAlert)
        });
        console.log('状态码:', addAlertResponse.status);
        
        if (addAlertResponse.ok) {
            const result = await addAlertResponse.json();
            console.log('✅ 添加价格提醒成功:', result);
        } else {
            console.log('❌ 添加价格提醒失败:', await addAlertResponse.text());
        }

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    }
}

// 运行测试
testWatchlistAPI();
