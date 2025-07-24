// 检查数据库中的用户
const mysql = require('mysql2/promise');

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      // password: 'root123',  // 无密码
      database: 'quantconsole'
    });

    const [rows] = await connection.execute('SELECT * FROM users ORDER BY created_at DESC LIMIT 5');
    console.log('最近的用户:');
    console.log(rows);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();
