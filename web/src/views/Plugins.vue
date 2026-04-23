<!-- QQ Bot Manager - Copyright (c) 2025 云码小栈 <https://yunmaxz.com> | MIT 非商业许可证 -->
<template>
  <div>
    <h2 style="margin-bottom: 20px">插件管理</h2>
    
    <el-table :data="plugins" stripe>
      <el-table-column prop="pluginName" label="插件名称" width="150" />
      <el-table-column prop="pluginDesc" label="描述" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'danger'">
            {{ row.enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled === 1 || row.enabled === '1'"
            @click="togglePlugin(row)"
            style="margin-right: 10px"
          />
          <el-button size="small" @click="openConfig(row)">配置</el-button>
          <el-button size="small" type="danger" @click="deletePlugin(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showConfigDialog" :title="`${currentPlugin?.pluginDesc || currentPlugin?.pluginName} - 配置`" width="600px">
      <el-form :model="configForm" label-width="120px">
        <template v-if="currentPlugin?.pluginName === 'ai_chat'">
          <el-form-item label="最大上下文轮数">
            <el-input-number v-model="configForm.maxContext" :min="1" :max="50" />
          </el-form-item>
          <el-form-item label="触发方式">
            <el-radio-group v-model="configForm.triggerType">
              <el-radio label="all">所有消息</el-radio>
              <el-radio label="at">仅@机器人</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>
        <template v-else-if="currentPlugin?.pluginName === 'keyword_reply'">
          <el-form-item label="匹配模式">
            <el-radio-group v-model="configForm.matchMode">
              <el-radio label="exact">精确匹配</el-radio>
              <el-radio label="contains">包含匹配</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>
        <template v-else-if="currentPlugin?.pluginName === 'zodiac'">
          <el-form-item label="触发指令">
            <el-input v-model="configForm.triggerCommand" placeholder="如：星座" />
          </el-form-item>
          <el-form-item label="菜单显示名">
            <el-input v-model="configForm.menuName" placeholder="如：🔮星座运势" />
          </el-form-item>
          <el-form-item label="使用说明">
            <el-text type="info" size="small">用户发送 /{指令} 星座名 即可查询，如 /星座 双鱼座</el-text>
          </el-form-item>
        </template>
        <template v-else-if="currentPlugin?.pluginName === 'pic'">
          <el-form-item label="触发指令">
            <el-input v-model="configForm.triggerCommand" placeholder="如：看看腿" />
          </el-form-item>
          <el-form-item label="菜单显示名">
            <el-input v-model="configForm.menuName" placeholder="如：🦵看看腿" />
          </el-form-item>
          <el-form-item label="使用说明">
            <el-text type="info" size="small">用户发送 /{指令} 即可获取随机图片</el-text>
          </el-form-item>
        </template>
        <template v-else-if="currentPlugin?.pluginName === 'video'">
          <el-form-item label="触发指令">
            <el-input v-model="configForm.triggerCommand" placeholder="如：小姐姐" />
          </el-form-item>
          <el-form-item label="菜单显示名">
            <el-input v-model="configForm.menuName" placeholder="如：👧小姐姐" />
          </el-form-item>
          <el-form-item label="使用说明">
            <el-text type="info" size="small">用户发送 /{指令} 即可获取随机视频</el-text>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="配置JSON">
            <el-input v-model="configForm.rawConfig" type="textarea" :rows="8" placeholder='{"key": "value"}' />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showConfigDialog = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const plugins = ref([])
const showConfigDialog = ref(false)
const currentPlugin = ref(null)
const configForm = reactive({
  triggerCommand: '',
  menuName: '',
  maxContext: 10,
  triggerType: 'at',
  matchMode: 'contains',
  rawConfig: '{}'
})
const isLoading = ref(true)

const fetchPlugins = async () => {
  try {
    const response = await axios.get('/api/bot/configs')
    if (response.data.code === 200) {
      plugins.value = response.data.data.plugins
    }
  } catch (error) {
    ElMessage.error('获取插件列表失败')
  } finally {
    isLoading.value = false
  }
}

const togglePlugin = async (plugin) => {
  if (isLoading.value) return
  const currentEnabled = plugin.enabled === 1 || plugin.enabled === '1'
  const targetEnabled = currentEnabled ? 0 : 1
  plugin.enabled = targetEnabled
  try {
    await axios.put('/api/bot/plugin', {
      pluginName: plugin.pluginName,
      enabled: targetEnabled
    })
    ElMessage.success(`${plugin.pluginName} 已${targetEnabled ? '启用' : '禁用'}`)
  } catch (error) {
    ElMessage.error('操作失败')
    plugin.enabled = currentEnabled ? 1 : 0
  }
}

const openConfig = (plugin) => {
  currentPlugin.value = plugin
  try {
    const parsed = plugin.configJson ? JSON.parse(plugin.configJson) : {}
    if (plugin.pluginName === 'ai_chat') {
      Object.assign(configForm, { maxContext: parsed.maxContext || 10, triggerType: parsed.triggerType || 'at' })
    } else if (plugin.pluginName === 'keyword_reply') {
      Object.assign(configForm, { matchMode: parsed.matchMode || 'contains' })
    } else if (plugin.pluginName === 'zodiac') {
      Object.assign(configForm, { 
        triggerCommand: parsed.triggerCommand || '星座', 
        menuName: parsed.menuName || '' 
      })
    } else if (plugin.pluginName === 'pic') {
      Object.assign(configForm, { 
        triggerCommand: parsed.triggerCommand || '看看腿', 
        menuName: parsed.menuName || '' 
      })
    } else if (plugin.pluginName === 'video') {
      Object.assign(configForm, { 
        triggerCommand: parsed.triggerCommand || '小姐姐', 
        menuName: parsed.menuName || '' 
      })
    } else {
      Object.assign(configForm, { rawConfig: JSON.stringify(parsed, null, 2) })
    }
  } catch (e) {
    Object.assign(configForm, { rawConfig: plugin.configJson || '{}' })
  }
  showConfigDialog.value = true
}

const saveConfig = async () => {
  try {
    let configJson
    if (currentPlugin.value.pluginName === 'ai_chat') {
      configJson = JSON.stringify({ maxContext: configForm.maxContext, triggerType: configForm.triggerType })
    } else if (currentPlugin.value.pluginName === 'keyword_reply') {
      configJson = JSON.stringify({ matchMode: configForm.matchMode })
    } else if (currentPlugin.value.pluginName === 'zodiac') {
      configJson = JSON.stringify({ triggerCommand: configForm.triggerCommand || '星座', menuName: configForm.menuName || '' })
    } else if (currentPlugin.value.pluginName === 'pic') {
      configJson = JSON.stringify({ triggerCommand: configForm.triggerCommand || '看看腿', menuName: configForm.menuName || '' })
    } else if (currentPlugin.value.pluginName === 'video') {
      configJson = JSON.stringify({ triggerCommand: configForm.triggerCommand || '小姐姐', menuName: configForm.menuName || '' })
    } else {
      JSON.parse(configForm.rawConfig)
      configJson = configForm.rawConfig
    }
    await axios.put('/api/bot/plugin', {
      pluginName: currentPlugin.value.pluginName,
      configJson
    })
    ElMessage.success('配置保存成功')
    showConfigDialog.value = false
    fetchPlugins()
  } catch (error) {
    if (error.response?.data?.error?.includes('JSON')) {
      ElMessage.error('JSON格式错误')
    } else {
      ElMessage.error('保存失败')
    }
  }
}

const deletePlugin = async (plugin) => {
  try {
    await ElMessageBox.confirm(`确定删除插件 "${plugin.pluginName}" 吗？`, '提示', { type: 'warning' })
    await axios.delete(`/api/bot/plugin/${plugin.pluginName}`)
    ElMessage.success('删除成功')
    fetchPlugins()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchPlugins()
})
</script>
