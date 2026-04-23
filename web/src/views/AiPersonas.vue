<!-- QQ Bot Manager - Copyright (c) 2025 云码小栈 <https://yunmaxz.com> | MIT 非商业许可证 -->
<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2 style="margin: 0">AI人设管理</h2>
      <div>
        <el-button type="success" @click="showProviderDialog = true">+ 添加接口</el-button>
        <el-button type="primary" @click="showPersonaDialog = true">+ 添加人设</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="AI接口" name="providers">
        <el-table :data="providers" stripe>
          <el-table-column prop="name" label="接口名称" width="150" />
          <el-table-column prop="apiUrl" label="API地址" min-width="200" />
          <el-table-column prop="model" label="模型" width="150" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'danger'">{{ row.enabled ? '启用' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="editProvider(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteProvider(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="人设列表" name="personas">
        <div v-if="personas.length === 0" style="text-align: center; padding: 60px; color: #999">
          <el-empty description="暂无人设，点击右上角添加" />
        </div>
        <div v-else class="persona-grid">
          <div v-for="persona in personas" :key="persona.id" class="persona-card">
            <div class="card-header">
              <div class="avatar-section">
                <el-avatar :size="50" :src="persona.avatar || ''" class="persona-avatar">
                  {{ persona.name.charAt(0) }}
                </el-avatar>
                <div class="persona-info">
                  <div class="persona-name">{{ persona.name }}</div>
                  <div class="persona-provider">{{ persona.AiProvider?.name || '未设置接口' }}</div>
                </div>
              </div>
              <el-switch v-model="persona.enabled" @change="togglePersona(persona)" :active-value="1" :inactive-value="0" />
            </div>
            <div class="card-body">
              <p class="persona-desc">{{ persona.description || '暂无描述' }}</p>
              <div class="persona-tags">
                <el-tag v-for="tag in (persona.personalityTags || '').split(',').filter(Boolean)" :key="tag" size="small">{{ tag.trim() }}</el-tag>
              </div>
            </div>
            <div class="card-footer">
              <el-button size="small" @click="editPersona(persona)">编辑</el-button>
              <el-button size="small" @click="manageBindings(persona)">绑定</el-button>
              <el-button size="small" type="danger" @click="deletePersona(persona)">删除</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showProviderDialog" :title="editingProvider ? '编辑接口' : '添加接口'" width="600px">
      <el-form :model="providerForm" label-width="100px">
        <el-form-item label="接口名称">
          <el-input v-model="providerForm.name" placeholder="如: DeepSeek" />
        </el-form-item>
        <el-form-item label="API地址">
          <el-input v-model="providerForm.apiUrl" placeholder="https://api.deepseek.com/v1/chat/completions" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="providerForm.apiKey" type="password" show-password />
        </el-form-item>
        <el-form-item label="模型">
          <el-input v-model="providerForm.model" placeholder="deepseek-chat" />
        </el-form-item>
        <el-form-item label="Temperature">
          <el-input-number v-model="providerForm.temperature" :min="0" :max="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="Max Tokens">
          <el-input-number v-model="providerForm.maxTokens" :min="100" :max="8000" :step="100" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="providerForm.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProviderDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProvider">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPersonaDialog" :title="editingPersona ? '编辑人设' : '添加人设'" width="600px">
      <el-form :model="personaForm" label-width="110px">
        <el-form-item label="人设名称">
          <el-input v-model="personaForm.name" placeholder="如: 小可爱" />
        </el-form-item>
        <el-form-item label="头像URL">
          <el-input v-model="personaForm.avatar" placeholder="可选" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="personaForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="生效范围">
          <el-radio-group v-model="personaForm.scope">
            <el-radio label="private">仅私聊</el-radio>
            <el-radio label="group">仅群聊</el-radio>
            <el-radio label="all">私聊+群聊</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="AI聊天接口">
          <el-select v-model="personaForm.chatProviderId" placeholder="选择聊天接口" style="width: 100%">
            <el-option v-for="p in providers" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="图片生成接口">
          <el-select v-model="personaForm.imageProviderId" placeholder="选择图片接口（可选）" style="width: 100%">
            <el-option v-for="p in providers" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预设提示词">
          <el-input v-model="personaForm.systemPrompt" type="textarea" :rows="4" placeholder="你是...请用...语气回答" />
        </el-form-item>
        <el-form-item label="性格标签">
          <el-input v-model="personaForm.personalityTags" placeholder="用逗号分隔，如: 温柔,可爱" />
        </el-form-item>

        <el-divider content-position="left">🎙️ 语音设置</el-divider>

        <el-form-item label="启用语音">
          <el-switch v-model="personaForm.voiceEnabled" :active-value="1" :inactive-value="0" />
          <span style="margin-left:10px;color:#999;font-size:12px">开启后可发送语音消息</span>
        </el-form-item>

        <template v-if="personaForm.voiceEnabled">
          <el-form-item label="音色">
            <el-select v-model="personaForm.voiceName" style="width:100%">
              <el-option label="晓晓 · 温柔甜美（推荐女友人设）" value="zh-CN-XiaoxiaoNeural" />
              <el-option label="晓伊 · 活泼可爱" value="zh-CN-XiaoyiNeural" />
              <el-option label="晓墨 · 温柔沉稳" value="zh-CN-XiaomoNeural" />
              <el-option label="晓萱 · 温暖亲切" value="zh-CN-XiaoxuanNeural" />
            </el-select>
          </el-form-item>

          <el-form-item label="聊天语音概率">
            <el-slider v-model="personaForm.replyVoiceProbability" :min="0" :max="100" :step="5"
              :format-tooltip="v => v + '%'" style="width:80%" />
            <span style="margin-left:12px;color:#666">{{ personaForm.replyVoiceProbability }}%</span>
            <div style="color:#999;font-size:12px;margin-top:4px">AI回复时以此概率发送语音而非文字</div>
          </el-form-item>

          <el-divider content-position="left">💌 主动消息</el-divider>

          <el-form-item label="主动消息">
            <el-switch v-model="personaForm.proactiveEnabled" />
            <span style="margin-left:10px;color:#999;font-size:12px">私聊中收到消息后，随机延迟后主动发语音</span>
          </el-form-item>

          <template v-if="personaForm.proactiveEnabled">
            <el-form-item label="触发模式">
              <el-radio-group v-model="personaForm.proactiveMode">
                <el-radio label="after_message">收到消息后触发</el-radio>
                <el-radio label="all_day">全天随机触发</el-radio>
              </el-radio-group>
              <div style="color:#999;font-size:12px;margin-top:4px">
                <template v-if="personaForm.proactiveMode === 'after_message'">
                  用户发消息后，随机延迟一段时间主动回一条
                </template>
                <template v-else>
                  bot 启动后全天随机挑一个绑定的私聊 QQ 发送，无需对方先开口
                </template>
              </div>
            </el-form-item>

            <el-form-item label="触发概率">
              <el-slider v-model="personaForm.proactiveProbability" :min="0" :max="100" :step="5"
                :format-tooltip="v => v + '%'" style="width:80%" />
              <span style="margin-left:12px;color:#666">{{ personaForm.proactiveProbability }}%</span>
            </el-form-item>

            <el-form-item label="最短延迟(分)">
              <el-input-number v-model="personaForm.proactiveMinDelay" :min="1" :max="1440" />
            </el-form-item>

            <el-form-item label="最长延迟(分)">
              <el-input-number v-model="personaForm.proactiveMaxDelay" :min="1" :max="1440" />
            </el-form-item>

            <el-form-item label="主动消息提示词">
              <el-input v-model="personaForm.proactivePrompt" type="textarea" :rows="2"
                placeholder="用一句话表达你想念用户，不超过15个字，温柔甜蜜" />
              <div style="color:#999;font-size:12px;margin-top:4px">AI 根据此提示词生成主动说的内容</div>
            </el-form-item>
          </template>
        </template>

        <el-divider />
        <el-form-item label="启用人设">
          <el-switch v-model="personaForm.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPersonaDialog = false">取消</el-button>
        <el-button type="primary" @click="savePersona">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBindingDialog" title="绑定管理" width="500px">
      <div style="margin-bottom: 15px">
        <el-select v-model="bindingForm.bindType" style="width: 100px; margin-right: 10px">
          <el-option label="私聊" value="private" />
          <el-option label="群聊" value="group" />
        </el-select>
        <el-input v-if="bindingForm.bindType === 'private'" v-model="bindingForm.bindTarget" placeholder="输入QQ号" style="width: 180px; margin-right: 10px" />
        <el-select v-else v-model="bindingForm.bindTarget" placeholder="选择群组" style="width: 180px; margin-right: 10px" filterable>
          <el-option v-for="g in groups" :key="g.groupId" :label="g.groupName || g.groupId" :value="g.groupId" />
        </el-select>
        <el-button type="primary" @click="addBinding">添加</el-button>
      </div>
      <el-table :data="bindings" size="small">
        <el-table-column label="类型" width="80">
          <template #default="{ row }">{{ row.bindType === 'private' ? '私聊' : '群聊' }}</template>
        </el-table-column>
        <el-table-column label="目标">
          <template #default="{ row }">{{ row.bindType === 'group' ? getGroupName(row.bindTarget) : row.bindTarget }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="removeBinding(row)">解绑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('personas')
const providers = ref([])
const personas = ref([])
const groups = ref([])
const bindings = ref([])

const showProviderDialog = ref(false)
const showPersonaDialog = ref(false)
const showBindingDialog = ref(false)
const editingProvider = ref(null)
const editingPersona = ref(null)
const currentPersonaId = ref(null)

const providerForm = ref({ name: '', apiUrl: '', apiKey: '', model: '', temperature: 0.7, maxTokens: 2000, enabled: 1 })
const defaultPersonaForm = () => ({
  name: '', avatar: '', description: '', scope: 'all',
  chatProviderId: null, imageProviderId: null,
  systemPrompt: '', personalityTags: '', enabled: 1,
  // 语音字段（保存时序列化进 voiceConfig）
  voiceEnabled: 0,
  voiceName: 'zh-CN-XiaoxiaoNeural',
  replyVoiceProbability: 0,
  proactiveEnabled: false,
  proactiveMode: 'after_message',
  proactiveProbability: 30,
  proactiveMinDelay: 30,
  proactiveMaxDelay: 180,
  proactivePrompt: ''
})
const personaForm = ref(defaultPersonaForm())
const bindingForm = ref({ bindTarget: '', bindType: 'private' })

const fetchProviders = async () => {
  try {
    const res = await axios.get('/api/providers')
    if (res.data.code === 200) providers.value = res.data.data
  } catch (e) { ElMessage.error('获取接口列表失败') }
}

const fetchPersonas = async () => {
  try {
    const res = await axios.get('/api/personas')
    if (res.data.code === 200) personas.value = res.data.data
  } catch (e) { ElMessage.error('获取人设列表失败') }
}

const fetchGroups = async () => {
  try {
    const res = await axios.get('/api/groups')
    if (res.data.code === 200) groups.value = res.data.data
  } catch (e) { console.error('获取群组列表失败') }
}

const saveProvider = async () => {
  try {
    if (editingProvider.value) {
      await axios.put(`/api/providers/${editingProvider.value.id}`, providerForm.value)
    } else {
      await axios.post('/api/providers', providerForm.value)
    }
    ElMessage.success('保存成功')
    showProviderDialog.value = false
    editingProvider.value = null
    providerForm.value = { name: '', apiUrl: '', apiKey: '', model: '', temperature: 0.7, maxTokens: 2000, enabled: 1 }
    fetchProviders()
  } catch (e) { ElMessage.error('保存失败') }
}

const editProvider = (row) => {
  editingProvider.value = row
  providerForm.value = { ...row }
  showProviderDialog.value = true
}

const deleteProvider = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除此接口？', '提示', { type: 'warning' })
    await axios.delete(`/api/providers/${row.id}`)
    ElMessage.success('删除成功')
    fetchProviders()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

const serializePersonaForm = (form) => {
  const { voiceName, replyVoiceProbability, proactiveEnabled, proactiveMode,
          proactiveProbability, proactiveMinDelay, proactiveMaxDelay, proactivePrompt,
          ...rest } = form
  return {
    ...rest,
    voiceConfig: JSON.stringify({
      voiceName,
      replyVoiceProbability: replyVoiceProbability / 100,
      proactiveEnabled,
      proactiveMode,
      proactiveProbability: proactiveProbability / 100,
      proactiveMinDelay,
      proactiveMaxDelay,
      proactivePrompt
    })
  }
}

const savePersona = async () => {
  try {
    const payload = serializePersonaForm(personaForm.value)
    if (editingPersona.value) {
      await axios.put(`/api/personas/${editingPersona.value.id}`, payload)
    } else {
      await axios.post('/api/personas', payload)
    }
    ElMessage.success('保存成功')
    showPersonaDialog.value = false
    editingPersona.value = null
    personaForm.value = defaultPersonaForm()
    fetchPersonas()
  } catch (e) { ElMessage.error('保存失败') }
}

const editPersona = (row) => {
  editingPersona.value = row
  let voiceCfg = {}
  try { voiceCfg = JSON.parse(row.voiceConfig || '{}') } catch (e) {}
  personaForm.value = {
    ...row,
    voiceName: voiceCfg.voiceName || 'zh-CN-XiaoxiaoNeural',
    replyVoiceProbability: Math.round((voiceCfg.replyVoiceProbability || 0) * 100),
    proactiveEnabled: voiceCfg.proactiveEnabled || false,
    proactiveMode: voiceCfg.proactiveMode || 'after_message',
    proactiveProbability: Math.round((voiceCfg.proactiveProbability || 0.3) * 100),
    proactiveMinDelay: voiceCfg.proactiveMinDelay ?? 30,
    proactiveMaxDelay: voiceCfg.proactiveMaxDelay ?? 180,
    proactivePrompt: voiceCfg.proactivePrompt || ''
  }
  showPersonaDialog.value = true
}

const deletePersona = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除此人设？', '提示', { type: 'warning' })
    await axios.delete(`/api/personas/${row.id}`)
    ElMessage.success('删除成功')
    fetchPersonas()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

const togglePersona = async (row) => {
  try {
    await axios.put(`/api/personas/${row.id}/toggle`, { enabled: row.enabled })
    ElMessage.success(`${row.name} 已${row.enabled ? '启用' : '禁用'}`)
  } catch (e) { ElMessage.error('操作失败'); row.enabled = !row.enabled }
}

const manageBindings = async (row) => {
  currentPersonaId.value = row.id
  showBindingDialog.value = true
  fetchBindings(row.id)
}

const fetchBindings = async (personaId) => {
  try {
    const res = await axios.get(`/api/personas/${personaId}/bindings`)
    if (res.data.code === 200) bindings.value = res.data.data
  } catch (e) { ElMessage.error('获取绑定列表失败') }
}

const addBinding = async () => {
  if (!bindingForm.value.bindTarget) { ElMessage.warning('请输入目标'); return }
  try {
    await axios.post(`/api/personas/${currentPersonaId.value}/bindings`, {
      bindType: bindingForm.value.bindType,
      bindTarget: parseInt(bindingForm.value.bindTarget)
    })
    ElMessage.success('绑定成功')
    bindingForm.value.bindTarget = ''
    fetchBindings(currentPersonaId.value)
  } catch (e) { ElMessage.error('绑定失败') }
}

const removeBinding = async (row) => {
  try {
    await axios.delete(`/api/personas/bindings/${row.id}`)
    ElMessage.success('解绑成功')
    fetchBindings(currentPersonaId.value)
  } catch (e) { ElMessage.error('解绑失败') }
}

const getGroupName = (groupId) => {
  const g = groups.value.find(x => x.groupId === groupId)
  return g ? (g.groupName || g.groupId) : groupId
}

onMounted(() => {
  fetchProviders()
  fetchPersonas()
  fetchGroups()
})
</script>

<style scoped>
.persona-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.persona-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.persona-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.persona-name {
  font-size: 16px;
  font-weight: 600;
}

.persona-provider {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.card-body {
  padding: 16px 20px;
}

.persona-desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.persona-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-footer {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}
</style>
