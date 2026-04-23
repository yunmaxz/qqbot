<!-- QQ Bot Manager - Copyright (c) 2025 云码小栈 <https://yunmaxz.com> | MIT 非商业许可证 -->
<template>
  <div>
    <h2 style="margin-bottom: 20px">数据看板</h2>
    
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalMessages }}</div>
            <div class="stat-label">总消息数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value">{{ stats.todayMessages }}</div>
            <div class="stat-label">今日消息</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value">{{ stats.aiMessages }}</div>
            <div class="stat-label">AI对话数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-value">{{ stats.keywordMessages }}</div>
            <div class="stat-label">关键词触发</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>机器人状态</template>
          <div class="status-info">
            <p><strong>连接状态：</strong>
              <el-tag :type="botStatus.connected ? 'success' : 'danger'">
                {{ botStatus.connected ? '已连接' : '未连接' }}
              </el-tag>
            </p>
            <p><strong>机器人QQ：</strong>{{ botStatus.botQQ || '未获取' }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>消息类型分布</template>
          <div class="status-info">
            <p><strong>群消息：</strong>{{ stats.groupMessages }}</p>
            <p><strong>私聊消息：</strong>{{ stats.privateMessages }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const stats = ref({
  totalMessages: 0,
  todayMessages: 0,
  aiMessages: 0,
  keywordMessages: 0,
  groupMessages: 0,
  privateMessages: 0
})

const botStatus = ref({
  connected: false,
  botQQ: null
})

const fetchStats = async () => {
  try {
    const response = await axios.get('/api/logs/stats')
    if (response.data.code === 200) {
      stats.value = response.data.data
    }
  } catch (error) {
    console.error('获取统计失败', error)
  }
}

const fetchStatus = async () => {
  try {
    const response = await axios.get('/api/bot/status')
    if (response.data.code === 200) {
      botStatus.value = response.data.data
    }
  } catch (error) {
    console.error('获取状态失败', error)
  }
}

onMounted(() => {
  fetchStats()
  fetchStatus()
  setInterval(fetchStatus, 30000)
})
</script>

<style scoped>
.stat-card {
  text-align: center;
  padding: 20px 0;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.status-info p {
  margin: 10px 0;
  font-size: 16px;
}
</style>
