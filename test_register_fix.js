const https = require('https');
const http = require('http');

async function testRegister() {
    const testUser = {
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        username: `testuser_${Date.now()}`,
        first_name: 'Test',
        last_name: 'User'
    };

    console.log('🧪 测试注册功能...');
    console.log('📝 测试用户:', testUser);

    const postData = JSON.stringify(testUser);

    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (res.statusCode === 200) {
                        console.log('✅ 注册成功!');
                        console.log('📋 响应状态:', res.statusCode);
                        console.log('📋 响应数据:', JSON.stringify(response, null, 2));
                        resolve(true);
                    } else {
                        console.log('❌ 注册失败!');
                        console.log('📋 错误状态:', res.statusCode);
                        console.log('📋 错误数据:', JSON.stringify(response, null, 2));
                        resolve(false);
                    }
                } catch (e) {
                    console.log('❌ 响应解析失败:', e.message);
                    console.log('📋 原始响应:', data);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.log('❌ 请求失败:', e.message);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

// 运行测试
testRegister().then(success => {
    if (success) {
        console.log('🎉 测试通过 - 注册功能已修复!');
    } else {
        console.log('💥 测试失败 - 注册功能仍有问题');
    }
    process.exit(success ? 0 : 1);
});
