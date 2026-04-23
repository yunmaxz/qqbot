<!-- QQ Bot Manager - Copyright (c) 2025 云码小栈 <https://yunmaxz.com> | MIT 非商业许可证 -->
<template>
  <div>
    <h2 style="margin-bottom: 20px">消息日志</h2>
    
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="消息类型">
          <el-select v-model="searchForm.messageType" placeholder="全部" clearable>
            <el-option label="群消息" value="group" />
            <el-option label="私聊消息" value="private" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发类型">
          <el-select v-model="searchForm.triggerType" placeholder="全部" clearable>
            <el-option label="AI对话" value="ai" />
            <el-option label="关键词" value="keyword" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.userId" placeholder="QQ号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">搜索</el-button>
          <el-button type="warning" @click="showClearDialog">清理日志</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="logs" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag size="small" :type="row.messageType === 'group' ? '' : 'success'">
            {{ row.messageType === 'group' ? '群聊' : '私聊' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="userId" label="用户" width="120" />
      <el-table-column prop="groupId" label="群号" width="120">
        <template #default="{ row }">
          {{ row.groupId || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="message" label="消息" show-overflow-tooltip />
      <el-table-column prop="reply" label="回复" show-overflow-tooltip />
      <el-table-column prop="triggerType" label="触发" width="80">
        <template #default="{ row }">
          <el-tag size="small" :type="row.triggerType === 'ai' ? 'warning' : 'info'">
            {{ row.triggerType === 'ai' ? 'AI' : '关键词' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top: 20px; justify-content: center"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      @current-change="fetchLogs"
      layout="total, prev, pager, next"
    />

    <el-dialog v-model="clearDialogVisible" title="清理日志" width="400px">
      <p>清理指定天数之前的日志记录</p>
      <el-input-number v-model="clearDays" :min="1" :max="365" style="margin-top: 10px" />
      <template #footer>
        <el-button @click="clearDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="clearLogs" :loading="clearing">确认清理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const logs = ref([])
const clearDialogVisible = ref(false)
const clearDays = ref(30)
const clearing = ref(false)

const searchForm = reactive({
  messageType: '',
  triggerType: '',
  userId: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const fetchLogs = async () => {
  try {
    const response = await axios.get('/api/logs', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...searchForm
      }
    })
    if (response.data.code === 200) {
      logs.value = response.data.data.list
      pagination.total = response.data.data.total
    }
  } catch (error) {
    ElMessage.error('获取日志失败')
  }
}

const showClearDialog = () => {
  clearDialogVisible.value = true
}

const clearLogs = async () => {
  clearing.value = true
  try {
    await ElMessageBox.confirm(`确定清理 ${clearDays.value} 天前的日志吗？`, '提示', { type: 'warning' })
    const response = await axios.post('/api/logs/clear', { days: clearDays.value })
    ElMessage.success(response.data.message)
    clearDialogVisible.value = false
    fetchLogs()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清理失败')
    }
  } finally {
    clearing.value = false
  }
}

onMounted(() => {
  fetchLogs()
})
</script>
