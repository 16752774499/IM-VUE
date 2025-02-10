<template>
  <div class="login-container">
    <div class="login-box">
      <h2>{{ isLogin ? 'IM Login' : 'IM Register' }}</h2>
      <p class="subtitle">{{ isLogin ? 'Welcome back!' : 'Create your account' }}</p>

      <el-form class="form-area">
        <el-form-item class="form-item">
          <div class="custom-input">
            <el-input
              v-model="username"
              placeholder="Username"
              class="no-border"
            >
              <template #prefix>
                <el-icon class="input-icon"><User /></el-icon>
              </template>
              <template #suffix v-if="isLogin">
                <el-icon class="clickable-icon" @click="useTestAccount"><Switch /></el-icon>
              </template>
            </el-input>
          </div>
        </el-form-item>

        <el-form-item class="form-item">
          <div class="custom-input">
            <el-input
              v-model="password"
              type="password"
              placeholder="Password"
              class="no-border"
              show-password
            >
              <template #prefix>
                <el-icon class="input-icon"><Lock /></el-icon>
              </template>
            </el-input>
          </div>
        </el-form-item>

        <!-- 注册时显示确认密码 -->
        <el-form-item class="form-item" v-if="!isLogin">
          <div class="custom-input">
            <el-input
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              class="no-border"
              show-password
            >
              <template #prefix>
                <el-icon class="input-icon"><Lock /></el-icon>
              </template>
            </el-input>
          </div>
        </el-form-item>

        <el-form-item class="form-item">
          <el-button
            type="primary"
            class="submit-button"
            :loading="loading"
            @click="handleSubmit"
          >
            {{ loading ? (isLogin ? 'Logging in...' : 'Registering...') : (isLogin ? 'Login' : 'Register') }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="toggle-area">
        <span>{{ isLogin ? "Don't have an account?" : "Already have an account?" }}</span>
        <el-button
          link
          type="primary"
          @click="toggleMode"
        >
          {{ isLogin ? 'Register now' : 'Login now' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Switch } from '@element-plus/icons-vue'
import { API_ENDPOINTS } from '../config'
import { useUserStore } from '../stores/user'
import { request } from '../utils/request'

const router = useRouter()
const userStore = useUserStore()
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const isLogin = ref(true)

const toggleMode = () => {
  isLogin.value = !isLogin.value
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
}

const handleSubmit = async () => {
  if (!username.value || !password.value) {
    ElMessage.warning('Please enter username and password')
    return
  }

  if (!isLogin.value && !confirmPassword.value) {
    ElMessage.warning('Please confirm your password')
    return
  }

  if (!isLogin.value && password.value !== confirmPassword.value) {
    ElMessage.warning('Passwords do not match')
    return
  }

  loading.value = true
  try {
    const endpoint = isLogin.value ? API_ENDPOINTS.LOGIN : API_ENDPOINTS.REGISTER
    console.log(`Starting ${isLogin.value ? 'login' : 'registration'} request...`)
    
    const data = await request(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        user_name: username.value,
        password: password.value
      })
    })

    console.log(`${isLogin.value ? 'Login' : 'Registration'} response:`, data)
    
    if (data.status === 200) {
      if (isLogin.value) {
        console.log('Login successful')
        userStore.setUserData(data.data)
        ElMessage.success(data.msg || 'Login successful')
        await router.push('/im')
      } else {
        console.log('Registration successful')
        ElMessage.success(data.msg || 'Registration successful')
        // 注册成功后切换到登录模式
        isLogin.value = true
        username.value = ''
        password.value = ''
        confirmPassword.value = ''
      }
    } else {
      console.log(`${isLogin.value ? 'Login' : 'Registration'} failed, showing error message`)
      ElMessage.error(data.msg)
    }
  } catch (error) {
    console.error(`${isLogin.value ? 'Login' : 'Registration'} error:`, error)
    ElMessage.error(`${isLogin.value ? 'Login' : 'Registration'} failed, please try again`)
  } finally {
    loading.value = false
  }
}

// 添加测试账号功能
const useTestAccount = () => {
  const accounts = [
    { username: 'dadaguai', password: '123456' },
    { username: 'xiaoxiaoguai', password: '123456' },
    { username: 'kaixinchaoren', password: '123456' },
    { username: 'shangxinchaoren', password: '123456' },
    { username: 'xiaoxinchaoren', password: '123456' },
    { username: 'huaxinchaoren', password: '123456' },
    { username: 'tianxinchaoren', password: '123456' }
  ]
  const randomAccount = accounts[Math.floor(Math.random() * accounts.length)]
  username.value = randomAccount.username
  password.value = randomAccount.password
  ElMessage.success(`已填入测试账号：${randomAccount.username}`)
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7f9;
}

.login-box {
  width: 100%;
  max-width: 360px;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

h2 {
  color: #1a1a1a;
  font-size: 24px;
  margin-bottom: 8px;
  text-align: center;
  font-weight: 500;
}

.subtitle {
  color: #8c8c8c;
  font-size: 14px;
  text-align: center;
  margin-bottom: 24px;
}

.form-area {
  margin-top: 20px;
  width: 100%;
}

.form-item {
  margin-bottom: 16px;
  width: 100%;
}

.form-item :deep(.el-form-item__content) {
  width: 100%;
}

.custom-input {
  background: #f5f7f9;
  border-radius: 6px;
  transition: all 0.3s ease;
  width: 100%;
}

.custom-input:hover {
  background: #eef0f2;
}

.no-border :deep(.el-input__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 8px 12px;
  width: 100%;
}

.input-icon {
  color: #8c8c8c;
  font-size: 16px;
}

.clickable-icon {
  color: #8c8c8c;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.clickable-icon:hover {
  color: #409eff;
}

.submit-button {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border-radius: 6px;
  margin-top: 12px;
  background: #409eff;
  border: none;
  height: 40px;
}

.submit-button:hover {
  background: #66b1ff;
}

.toggle-area {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: #8c8c8c;
}

.toggle-area .el-button {
  font-size: 14px;
  padding: 0 4px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .login-box {
    margin: 20px;
    padding: 24px;
  }
}
</style> 