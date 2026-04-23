<!-- QQ Bot Manager - Copyright (c) 2025 云码小栈 <https://yunmaxz.com> | MIT 非商业许可证 -->
<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2 style="margin: 0">群组管理</h2>
      <el-button type="primary" @click="showAddDialog = true">+ 添加群组</el-button>
    </div>

    <el-table :data="groups" stripe>
      <el-table-column prop="groupId" label="群号" width="150" />
      <el-table-column prop="groupName" label="群名称" width="200" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'danger'">
            {{ row.enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="入群欢迎" width="100">
        <template #default="{ row }">
          <el-tag :type="row.welcomeEnabled ? 'success' : 'info'" size="small">
            {{ row.welcomeEnabled ? '开启' : '关闭' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="退群通知" width="100">
        <template #default="{ row }">
          <el-tag :type="row.leaveEnabled ? 'success' : 'info'" size="small">
            {{ row.leaveEnabled ? '开启' : '关闭' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="400">
        <template #default="{ row }">
          <el-button size="small" @click="editGroup(row)">编辑</el-button>
          <el-button size="small" @click="manageMutes(row)">禁言列表</el-button>
          <el-button size="small" @click="manageMenu(row)">菜单管理</el-button>
          <el-button size="small" type="primary" @click="manageGroupSettings(row)">群管设置</el-button>
          <el-button size="small" type="danger" @click="deleteGroup(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showAddDialog" :title="editingGroup ? '编辑群组' : '添加群组'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="群号">
          <el-input v-model="form.groupId" placeholder="输入群号" :disabled="!!editingGroup" />
        </el-form-item>
        <el-form-item label="群名称">
          <el-input v-model="form.groupName" placeholder="可选" />
        </el-form-item>
        <el-form-item label="群主QQ">
          <el-input v-model="form.ownerId" placeholder="输入群主QQ号（用于权限验证）" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-divider>入群欢迎</el-divider>
        <el-form-item label="开启欢迎">
          <el-switch v-model="form.welcomeEnabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="欢迎消息">
          <el-input v-model="form.welcomeMessage" type="textarea" :rows="3" placeholder="支持 {at} 艾特新人" />
        </el-form-item>
        <el-divider>退群通知</el-divider>
        <el-form-item label="开启通知">
          <el-switch v-model="form.leaveEnabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="通知消息">
          <el-input v-model="form.leaveMessage" type="textarea" :rows="2" placeholder="支持 {nickname}" />
        </el-form-item>
        <el-divider>群管指令</el-divider>
        <el-form-item label="禁言指令">
          <el-input v-model="form.muteCommand" placeholder="如：禁言" />
        </el-form-item>
        <el-form-item label="解除禁言">
          <el-input v-model="form.unmuteCommand" placeholder="如：解除禁言" />
        </el-form-item>
        <el-form-item label="踢人指令">
          <el-input v-model="form.kickCommand" placeholder="如：踢人" />
        </el-form-item>
        <el-form-item label="指令说明">
          <el-input v-model="form.commandUsage" type="textarea" :rows="3" placeholder="自定义指令用法说明，将在/help中显示" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveGroup">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showMuteDialog" title="禁言列表" width="500px">
      <div style="margin-bottom: 15px">
        <el-input v-model="muteForm.userId" placeholder="输入QQ号" style="width: 150px; margin-right: 10px" />
        <el-input-number v-model="muteForm.duration" :min="0" :max="2592000" style="width: 150px; margin-right: 10px" />
        <span style="font-size: 12px; color: #999">秒</span>
        <el-button type="primary" @click="addMute" style="margin-left: 10px">添加禁言</el-button>
      </div>
      <el-table :data="mutes" size="small">
        <el-table-column prop="userId" label="QQ号" width="150" />
        <el-table-column prop="duration" label="时长(秒)" width="100" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="removeMute(row)">解除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="showMenuDialog" title="菜单管理" width="700px">
      <el-alert title="勾选的功能将在 /菜单 指令中显示" type="info" :closable="false" style="margin-bottom: 15px" />
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">
        <el-checkbox
          v-for="item in menuList"
          :key="item.pluginName"
          v-model="item.enabled"
          border
          style="margin: 0"
        >
          {{ item.pluginDesc || item.pluginName }}
        </el-checkbox>
      </div>
      <template #footer>
        <el-button @click="showMenuDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMenu">保存</el-button>
      </template>
    </el-dialog>

    <!-- 群管设置对话框 -->
    <el-dialog v-model="showGroupSettingsDialog" title="群管设置" width="800px">
      <el-tabs v-model="activeSettingsTab">
        <!-- 总开关 -->
        <el-tab-pane label="总开关" name="general">
          <el-form label-width="120px">
            <el-form-item label="启用群管功能">
              <el-switch v-model="groupSettings.enabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-alert title="关闭后所有群管功能将停止工作" type="warning" :closable="false" />
          </el-form>
        </el-tab-pane>

        <!-- 违禁词设置 -->
        <el-tab-pane label="违禁词" name="bannedWords">
          <el-form label-width="150px">
            <el-form-item label="启用违禁词过滤">
              <el-switch v-model="groupSettings.banWordEnabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="禁言时长">
              <el-input-number v-model="groupSettings.banWordMuteDuration" :min="1" :max="1440" />
              <span style="margin-left: 10px; color: #999">分钟</span>
            </el-form-item>
            <el-form-item label="自动踢出">
              <el-switch v-model="groupSettings.banWordAutoKick" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="踢出阈值" v-if="groupSettings.banWordAutoKick">
              <el-input-number v-model="groupSettings.banWordKickThreshold" :min="1" :max="100" />
              <span style="margin-left: 10px; color: #999">次违规后自动踢出</span>
            </el-form-item>
          </el-form>

          <el-divider>违禁词列表</el-divider>
          <div style="margin-bottom: 15px; display: flex; gap: 10px">
            <el-input v-model="newBannedWord.word" placeholder="输入违禁词" style="width: 200px" />
            <el-select v-model="newBannedWord.matchType" style="width: 120px">
              <el-option label="包含匹配" value="contains" />
              <el-option label="精确匹配" value="exact" />
              <el-option label="正则匹配" value="regex" />
            </el-select>
            <el-input-number v-model="newBannedWord.muteDuration" :min="1" :max="1440" placeholder="禁言时长" style="width: 120px" />
            <el-button type="primary" @click="addBannedWord">添加</el-button>
          </div>
          <el-table :data="bannedWordsList" size="small" max-height="300">
            <el-table-column prop="word" label="违禁词" width="150" />
            <el-table-column prop="matchType" label="匹配方式" width="100">
              <template #default="{ row }">
                {{ { contains: '包含', exact: '精确', regex: '正则' }[row.matchType] }}
              </template>
            </el-table-column>
            <el-table-column prop="muteDuration" label="禁言时长" width="100">
              <template #default="{ row }">
                {{ row.muteDuration || '默认' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" type="danger" @click="deleteBannedWord(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 刷屏检测 -->
        <el-tab-pane label="刷屏检测" name="flood">
          <el-form label-width="150px">
            <el-form-item label="启用刷屏检测">
              <el-switch v-model="groupSettings.floodEnabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="检测时间窗口">
              <el-input-number v-model="groupSettings.floodTimeWindow" :min="5" :max="300" />
              <span style="margin-left: 10px; color: #999">秒</span>
            </el-form-item>
            <el-form-item label="消息数量阈值">
              <el-input-number v-model="groupSettings.floodMessageCount" :min="2" :max="50" />
              <span style="margin-left: 10px; color: #999">条消息</span>
            </el-form-item>
            <el-form-item label="禁言时长">
              <el-input-number v-model="groupSettings.floodMuteDuration" :min="1" :max="1440" />
              <span style="margin-left: 10px; color: #999">分钟</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 长消息检测 -->
        <el-tab-pane label="长消息检测" name="longMsg">
          <el-form label-width="150px">
            <el-form-item label="启用长消息检测">
              <el-switch v-model="groupSettings.longMsgEnabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="最大字符长度">
              <el-input-number v-model="groupSettings.longMsgMaxLength" :min="100" :max="5000" />
              <span style="margin-left: 10px; color: #999">字符</span>
            </el-form-item>
            <el-form-item label="最大字节长度">
              <el-input-number v-model="groupSettings.longMsgMaxBytes" :min="300" :max="15000" />
              <span style="margin-left: 10px; color: #999">字节</span>
            </el-form-item>
            <el-form-item label="最大行数">
              <el-input-number v-model="groupSettings.longMsgMaxLines" :min="5" :max="100" />
              <span style="margin-left: 10px; color: #999">行</span>
            </el-form-item>
            <el-form-item label="禁言时长">
              <el-input-number v-model="groupSettings.longMsgMuteDuration" :min="1" :max="1440" />
              <span style="margin-left: 10px; color: #999">分钟</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 白名单 -->
        <el-tab-pane label="白名单" name="whitelist">
          <div style="margin-bottom: 15px; display: flex; gap: 10px">
            <el-input v-model="newWhitelistUser" placeholder="输入QQ号" style="width: 200px" />
            <el-button type="primary" @click="addWhitelistUser">添加到白名单</el-button>
          </div>
          <el-table :data="whitelistUsers" size="small" max-height="400">
            <el-table-column prop="userId" label="QQ号" width="200" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" type="danger" @click="removeWhitelistUser(row)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="whitelistUsers.length === 0" description="暂无白名单用户" />
        </el-tab-pane>

        <!-- 违规记录 -->
        <el-tab-pane label="违规记录" name="violations">
          <el-table :data="violationLogs" size="small" max-height="400">
            <el-table-column prop="userId" label="QQ号" width="120" />
            <el-table-column prop="userNickname" label="昵称" width="120" />
            <el-table-column prop="violationType" label="违规类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getViolationTypeTag(row.violationType)" size="small">
                  {{ { banned_word: '违禁词', flood: '刷屏', long_msg: '长消息' }[row.violationType] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="wordMatched" label="匹配词" width="120" />
            <el-table-column prop="muteDuration" label="禁言" width="80">
              <template #default="{ row }">
                {{ row.muteDuration }}分钟
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="180" />
          </el-table>
          <el-pagination
            v-if="violationTotal > 0"
            v-model:current-page="violationPage"
            v-model:page-size="violationPageSize"
            :total="violationTotal"
            layout="prev, pager, next"
            @current-change="fetchViolationLogs"
          />
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="showGroupSettingsDialog = false">关闭</el-button>
        <el-button type="primary" @click="saveGroupSettings">保存设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const groups = ref([])
const showAddDialog = ref(false)
const showMuteDialog = ref(false)
const showMenuDialog = ref(false)
const editingGroup = ref(null)
const currentGroupId = ref(null)
const mutes = ref([])
const menuList = ref([])

// 群管设置相关
const showGroupSettingsDialog = ref(false)
const activeSettingsTab = ref('general')
const currentSettingsGroupId = ref(null)
const groupSettings = ref({
  enabled: 1,
  banWordEnabled: 0,
  banWordMuteDuration: 10,
  banWordAutoKick: 0,
  banWordKickThreshold: 3,
  floodEnabled: 0,
  floodTimeWindow: 10,
  floodMessageCount: 5,
  floodMuteDuration: 10,
  longMsgEnabled: 0,
  longMsgMaxLength: 300,
  longMsgMaxBytes: 1000,
  longMsgMaxLines: 20,
  longMsgMuteDuration: 10
})
const bannedWordsList = ref([])
const newBannedWord = ref({ word: '', matchType: 'contains', muteDuration: null })
const whitelistUsers = ref([])
const newWhitelistUser = ref('')
const violationLogs = ref([])
const violationPage = ref(1)
const violationPageSize = ref(10)
const violationTotal = ref(0)

const form = ref({
  groupId: '',
  groupName: '',
  ownerId: '',
  enabled: 1,
  welcomeEnabled: 0,
  welcomeMessage: '',
  leaveEnabled: 0,
  leaveMessage: '',
  muteCommand: '禁言',
  unmuteCommand: '解除禁言',
  kickCommand: '踢人',
  commandUsage: ''
})

const muteForm = ref({
  userId: '',
  duration: 600
})

const fetchGroups = async () => {
  try {
    const response = await axios.get('/api/groups')
    if (response.data.code === 200) {
      groups.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('获取群组列表失败')
  }
}

const editGroup = (row) => {
  editingGroup.value = row
  form.value = { ...row }
  showAddDialog.value = true
}

const saveGroup = async () => {
  try {
    const payload = {
      ...form.value,
      groupId: parseInt(form.value.groupId),
      ownerId: form.value.ownerId ? parseInt(form.value.ownerId) : null
    }
    if (editingGroup.value) {
      await axios.put(`/api/groups/${editingGroup.value.id}`, payload)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/groups', payload)
      ElMessage.success('添加成功')
    }
    showAddDialog.value = false
    editingGroup.value = null
    resetForm()
    fetchGroups()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const deleteGroup = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除此群组？', '提示', { type: 'warning' })
    await axios.delete(`/api/groups/${row.id}`)
    ElMessage.success('删除成功')
    fetchGroups()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const manageMutes = (row) => {
  currentGroupId.value = row.groupId
  showMuteDialog.value = true
  fetchMutes(row.groupId)
}

const fetchMutes = async (groupId) => {
  try {
    const response = await axios.get(`/api/groups/${groupId}/mutes`)
    if (response.data.code === 200) {
      mutes.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('获取禁言列表失败')
  }
}

const addMute = async () => {
  if (!muteForm.value.userId) {
    ElMessage.warning('请输入QQ号')
    return
  }
  try {
    await axios.post(`/api/groups/${currentGroupId.value}/mutes`, {
      userId: parseInt(muteForm.value.userId),
      duration: muteForm.value.duration
    })
    ElMessage.success('禁言成功')
    muteForm.value.userId = ''
    fetchMutes(currentGroupId.value)
  } catch (error) {
    ElMessage.error('禁言失败')
  }
}

const removeMute = async (row) => {
  try {
    await axios.delete(`/api/groups/mutes/${row.id}`)
    ElMessage.success('解除成功')
    fetchMutes(currentGroupId.value)
  } catch (error) {
    ElMessage.error('解除失败')
  }
}

const manageMenu = async (row) => {
  currentGroupId.value = row.groupId
  showMenuDialog.value = true
  fetchMenu(row.groupId)
}

const fetchMenu = async (groupId) => {
  try {
    const response = await axios.get(`/api/groups/${groupId}/menu`)
    if (response.data.code === 200) {
      menuList.value = response.data.data.map(item => ({
        ...item,
        enabled: item.enabled === 1
      }))
    }
  } catch (error) {
    ElMessage.error('获取菜单列表失败')
  }
}

const saveMenu = async () => {
  try {
    await axios.put(`/api/groups/${currentGroupId.value}/menu`, {
      menus: menuList.value.map(item => ({
        pluginName: item.pluginName,
        enabled: item.enabled ? 1 : 0
      }))
    })
    ElMessage.success('保存成功')
    showMenuDialog.value = false
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const resetForm = () => {
  form.value = {
    groupId: '',
    groupName: '',
    ownerId: '',
    enabled: 1,
    welcomeEnabled: 0,
    welcomeMessage: '',
    leaveEnabled: 0,
    leaveMessage: '',
    muteCommand: '禁言',
    unmuteCommand: '解除禁言',
    kickCommand: '踢人',
    commandUsage: ''
  }
}

// 群管设置相关方法
const manageGroupSettings = (row) => {
  currentSettingsGroupId.value = row.groupId
  showGroupSettingsDialog.value = true
  activeSettingsTab.value = 'general'
  fetchGroupSettings()
  fetchBannedWords()
  fetchViolationLogs()
}

const fetchGroupSettings = async () => {
  try {
    const response = await axios.get(`/api/group-management/groups/${currentSettingsGroupId.value}/settings`)
    if (response.data.code === 0) {
      const { settings, bannedWords } = response.data.data
      groupSettings.value = { ...groupSettings.value, ...settings }
      whitelistUsers.value = (settings.whitelist || []).map(userId => ({ userId }))
    }
  } catch (error) {
    ElMessage.error('获取群组设置失败')
  }
}

const saveGroupSettings = async () => {
  try {
    await axios.put(`/api/group-management/groups/${currentSettingsGroupId.value}/settings`, groupSettings.value)
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error('保存设置失败')
  }
}

const fetchBannedWords = async () => {
  try {
    const response = await axios.get(`/api/group-management/groups/${currentSettingsGroupId.value}/settings`)
    if (response.data.code === 0) {
      bannedWordsList.value = response.data.data.bannedWords
    }
  } catch (error) {
    ElMessage.error('获取违禁词列表失败')
  }
}

const addBannedWord = async () => {
  if (!newBannedWord.value.word.trim()) {
    ElMessage.warning('请输入违禁词')
    return
  }
  try {
    await axios.post(`/api/group-management/groups/${currentSettingsGroupId.value}/banned-words`, {
      word: newBannedWord.value.word.trim(),
      matchType: newBannedWord.value.matchType,
      muteDuration: newBannedWord.value.muteDuration
    })
    ElMessage.success('违禁词已添加')
    newBannedWord.value = { word: '', matchType: 'contains', muteDuration: null }
    fetchBannedWords()
  } catch (error) {
    ElMessage.error('添加违禁词失败')
  }
}

const deleteBannedWord = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除此违禁词？', '提示', { type: 'warning' })
    await axios.delete(`/api/group-management/banned-words/${row.id}`)
    ElMessage.success('删除成功')
    fetchBannedWords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const addWhitelistUser = async () => {
  if (!newWhitelistUser.value.trim()) {
    ElMessage.warning('请输入QQ号')
    return
  }
  try {
    await axios.post(`/api/group-management/groups/${currentSettingsGroupId.value}/whitelist`, {
      userId: newWhitelistUser.value.trim()
    })
    ElMessage.success('已添加到白名单')
    whitelistUsers.value.push({ userId: newWhitelistUser.value.trim() })
    newWhitelistUser.value = ''
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const removeWhitelistUser = async (row) => {
  try {
    await axios.delete(`/api/group-management/groups/${currentSettingsGroupId.value}/whitelist/${row.userId}`)
    ElMessage.success('已从白名单移除')
    whitelistUsers.value = whitelistUsers.value.filter(u => u.userId !== row.userId)
  } catch (error) {
    ElMessage.error('移除失败')
  }
}

const fetchViolationLogs = async () => {
  try {
    const response = await axios.get('/api/group-management/violation-logs', {
      params: {
        groupId: currentSettingsGroupId.value,
        page: violationPage.value,
        pageSize: violationPageSize.value
      }
    })
    if (response.data.code === 0) {
      violationLogs.value = response.data.data.list
      violationTotal.value = response.data.data.total
    }
  } catch (error) {
    ElMessage.error('获取违规记录失败')
  }
}

const getViolationTypeTag = (type) => {
  const tags = {
    'banned_word': 'danger',
    'flood': 'warning',
    'long_msg': 'info'
  }
  return tags[type] || 'info'
}

onMounted(() => {
  fetchGroups()
})
</script>
