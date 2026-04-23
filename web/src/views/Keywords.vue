<!-- QQ Bot Manager - Copyright (c) 2025 云码小栈 <https://yunmaxz.com> | MIT 非商业许可证 -->
<template>
  <div>
    <h2 style="margin-bottom: 20px">关键词回复管理</h2>
    
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索关键词" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchKeywords">搜索</el-button>
          <el-button type="success" @click="showAddDialog">添加</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="keywords" stripe>
      <el-table-column prop="keyword" label="关键词" width="150" />
      <el-table-column prop="replyContent" label="回复内容" show-overflow-tooltip />
      <el-table-column prop="matchMode" label="匹配模式" width="100">
        <template #default="{ row }">
          {{ matchModeText[row.matchMode] }}
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'danger'" size="small">
            {{ row.enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteKeyword(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top: 20px; justify-content: center"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      @current-change="fetchKeywords"
      layout="total, prev, pager, next"
    />

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑关键词' : '添加关键词'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="关键词">
          <el-input v-model="form.keyword" />
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input v-model="form.replyContent" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="匹配模式">
          <el-select v-model="form.matchMode">
            <el-option label="精确匹配" value="exact" />
            <el-option label="包含匹配" value="contains" />
            <el-option label="正则匹配" value="regex" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveKeyword" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const matchModeText = {
  exact: '精确',
  contains: '包含',
  regex: '正则'
}

const keywords = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  id: null,
  keyword: '',
  replyContent: '',
  matchMode: 'contains',
  priority: 0,
  enabled: true
})

const fetchKeywords = async () => {
  try {
    const response = await axios.get('/api/keywords', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchForm.keyword
      }
    })
    if (response.data.code === 200) {
      keywords.value = response.data.data.list
      pagination.total = response.data.data.total
    }
  } catch (error) {
    ElMessage.error('获取关键词失败')
  }
}

const showAddDialog = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    keyword: '',
    replyContent: '',
    matchMode: 'contains',
    priority: 0,
    enabled: true
  })
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    keyword: row.keyword,
    replyContent: row.replyContent,
    matchMode: row.matchMode,
    priority: row.priority,
    enabled: row.enabled === 1
  })
  dialogVisible.value = true
}

const saveKeyword = async () => {
  if (!form.keyword || !form.replyContent) {
    ElMessage.warning('关键词和回复内容不能为空')
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      await axios.put(`/api/keywords/${form.id}`, {
        keyword: form.keyword,
        replyContent: form.replyContent,
        matchMode: form.matchMode,
        priority: form.priority,
        enabled: form.enabled ? 1 : 0
      })
    } else {
      await axios.post('/api/keywords', {
        keyword: form.keyword,
        replyContent: form.replyContent,
        matchMode: form.matchMode,
        priority: form.priority,
        enabled: form.enabled ? 1 : 0
      })
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchKeywords()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const deleteKeyword = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该关键词吗？', '提示', { type: 'warning' })
    await axios.delete(`/api/keywords/${row.id}`)
    ElMessage.success('删除成功')
    fetchKeywords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchKeywords()
})
</script>
