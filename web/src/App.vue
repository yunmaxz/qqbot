<!-- QQ Bot Manager - Copyright (c) 2025 云码小栈 <https://yunmaxz.com> | MIT 非商业许可证 -->
<template>
  <el-container style="height: 100vh">
    <el-aside width="200px" v-if="isLoggedIn">
      <div class="logo">QQ机器人管理</div>
      <el-menu
        :default-active="currentRoute"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/bot-config">
          <span>机器人配置</span>
        </el-menu-item>
        <el-menu-item index="/ai-personas">
          <span>AI人设管理</span>
        </el-menu-item>
        <el-menu-item index="/groups">
          <span>群组管理</span>
        </el-menu-item>
        <el-menu-item index="/plugins">
          <span>插件管理</span>
        </el-menu-item>
        <el-menu-item index="/keywords">
          <span>关键词回复</span>
        </el-menu-item>
        <el-menu-item index="/logs">
          <span>消息日志</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <div class="dev-info">
          <span class="dev-name">云码小栈</span>
          <a href="https://yunmaxz.com" target="_blank" class="dev-link">yunmaxz.com</a>
        </div>
      </div>
    </el-aside>

    <el-container>
      <el-header v-if="isLoggedIn" style="display: flex; justify-content: flex-end; align-items: center; gap: 15px;">
        <el-dropdown @command="handleCommand">
          <span style="cursor: pointer; color: #606266;">
            {{ authStore.user?.nickname || authStore.user?.username || '用户' }}
            <el-icon><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="changePassword">修改密码</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <!-- 修改密码对话框 -->
  <el-dialog v-model="showChangePasswordDialog" title="修改密码" width="400px">
    <el-form :model="passwordForm" label-width="100px" :rules="passwordRules" ref="passwordFormRef">
      <el-form-item label="原密码" prop="oldPassword">
        <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showChangePasswordDialog = false">取消</el-button>
      <el-button type="primary" @click="submitChangePassword" :loading="changingPassword">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentRoute = computed(() => route.path)
const isLoggedIn = computed(() => authStore.isLoggedIn)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

// 修改密码相关
const showChangePasswordDialog = ref(false)
const changingPassword = ref(false)
const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleCommand = (command) => {
  if (command === 'logout') {
    handleLogout()
  } else if (command === 'changePassword') {
    showChangePasswordDialog.value = true
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  }
}

const submitChangePassword = async () => {
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return

  changingPassword.value = true
  try {
    const response = await axios.post('/api/auth/change-password', {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    if (response.data.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      showChangePasswordDialog.value = false
      // 修改密码后退出登录
      setTimeout(() => {
        handleLogout()
      }, 1500)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '密码修改失败')
  } finally {
    changingPassword.value = false
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  background-color: #263445;
}

.el-aside {
  background-color: #304156;
  display: flex;
  flex-direction: column;
}

.el-aside .el-menu {
  flex: 1;
  border-right: none;
}

.sidebar-footer {
  padding: 14px 0 16px;
  border-top: 1px solid #3d5166;
  text-align: center;
}

.dev-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dev-name {
  font-size: 12px;
  color: #7a90a4;
  letter-spacing: 1px;
}

.dev-link {
  font-size: 11px;
  color: #5a7a96;
  text-decoration: none;
  transition: color 0.2s;
}

.dev-link:hover {
  color: #409EFF;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
