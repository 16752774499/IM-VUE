<template>
  <div class="login-container">
    <div class="login-box">
      <h2>IM Login</h2>
      <el-form class="login-form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="username"
            placeholder="Username"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            placeholder="Password"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? 'Logging in...' : 'Login' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { API_ENDPOINTS } from '../config'
import { useUserStore } from '../stores/user'
import { request } from '../utils/request'

const router = useRouter()
const userStore = useUserStore()
const username = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    ElMessage.warning('Please enter username and password')
    return
  }

  loading.value = true
  try {
    console.log('Starting login request...')
    const data = await request(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({
        user_name: username.value,
        password: password.value
      })
    })

    console.log('Login response:', data)
    
    if (data.status === 200) {
      console.log('Login successful')
      userStore.setUserData(data.data)
      ElMessage.success(data.msg)
      await router.push('/im')
    } else {
      console.log('Login failed, showing error message')
      ElMessage.error(data.msg)
    }
  } catch (error) {
    console.error('Login error:', error)
    ElMessage.error('Login failed, please try again')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  padding: 20px;
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}

.login-form {
  margin-top: 20px;
}

:deep(.el-input__wrapper) {
  box-shadow: none !important;
  border: 1px solid #dcdfe6;
}

:deep(.el-button) {
  width: 100%;
  padding: 12px;
  font-size: 16px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .login-box {
    padding: 20px;
  }

  h2 {
    font-size: 20px;
    margin-bottom: 20px;
  }

  :deep(.el-button) {
    padding: 10px;
    font-size: 14px;
  }
}

/* 确保在较小的屏幕上有合适的边距 */
@media (max-width: 320px) {
  .login-container {
    padding: 10px;
  }

  .login-box {
    padding: 15px;
  }
}
</style> 