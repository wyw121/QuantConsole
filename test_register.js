// 测试注册API
const testData = {
  email: "test7@example.com",
  password: "TestPassword123!",
  username: "testuser7",
  first_name: "Test7",
  last_name: "User7"
};

fetch("http://localhost:8080/api/auth/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => {
  console.log("Response:", data);
})
.catch(error => {
  console.error("Error:", error);
});
