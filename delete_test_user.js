const mysql = require('mysql2/promise');

async function deleteTestUser() {
    // 数据库连接配置
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'quantconsole'
    });

    try {
        const email = 'wywyw12121@gmail.com';

        console.log(`正在删除邮箱 ${email} 的用户...`);

        // 删除用户
        const [result] = await connection.execute(
            'DELETE FROM users WHERE email = ?',
            [email]
        );

        console.log(`删除结果:`, result);

        if (result.affectedRows > 0) {
            console.log(`✅ 成功删除用户: ${email}`);
        } else {
            console.log(`⚠️ 未找到邮箱为 ${email} 的用户`);
        }

    } catch (error) {
        console.error('❌ 删除用户时发生错误:', error);
    } finally {
        await connection.end();
    }
}

deleteTestUser();
