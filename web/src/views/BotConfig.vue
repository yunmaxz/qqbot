<!-- QQ Bot Manager - Copyright (c) 2025 云码小栈 <https://yunmaxz.com> | MIT 非商业许可证 -->
<template>
  <div>
    <h2 style="margin-bottom: 20px">机器人配置</h2>
    
    <el-card>
      <template #header>OneBot 连接配置</template>
      <el-form :model="botForm" label-width="120px">
        <el-form-item label="连接地址">
          <el-input v-model="botForm.onebot_url" placeholder="ws://127.0.0.1:3001" />
        </el-form-item>
        <el-form-item label="访问令牌">
          <el-input v-model="botForm.onebot_token" type="password" show-password placeholder="可选" />
        </el-form-item>
        <el-form-item label="机器人昵称">
          <el-input v-model="botForm.bot_name" placeholder="QQ机器人" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveBotConfig" :loading="saving">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>触发设置</template>
      <el-form :model="triggerForm" label-width="120px">
        <el-form-item label="艾特触发">
          <el-switch v-model="triggerForm.trigger_at" />
        </el-form-item>
        <el-form-item label="概率触发">
          <el-switch v-model="triggerForm.trigger_probability" />
        </el-form-item>
        <el-form-item label="触发概率" v-if="triggerForm.trigger_probability">
          <el-slider v-model="triggerForm.probability_value" :min="0" :max="1" :step="0.1" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveTriggerConfig" :loading="saving">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const saving = ref(false)

const botForm = reactive({
  onebot_url: '',
  onebot_token: '',
  bot_name: ''
})

const triggerForm = reactive({
  trigger_at: false,
  trigger_probability: false,
  probability_value: 0.3
})

const fetchConfig = async () => {
  try {
    const response = await axios.get('/api/bot/configs')
    if (response.data.code === 200) {
      const configs = response.data.data.botConfigs
      configs.forEach(config => {
        if (config.configKey === 'onebot_url') botForm.onebot_url = config.configValue
        if (config.configKey === 'onebot_token') botForm.onebot_token = config.configValue
        if (config.configKey === 'bot_name') botForm.bot_name = config.configValue
        if (config.configKey === 'trigger_at') triggerForm.trigger_at = config.configValue === '1'
        if (config.configKey === 'trigger_probability') triggerForm.trigger_probability = config.configValue === '1'
        if (config.configKey === 'probability_value') triggerForm.probability_value = parseFloat(config.configValue)
      })
    }
  } catch (error) {
    ElMessage.error('获取配置失败')
  }
}

const saveBotConfig = async () => {
  saving.value = true
  try {
    await Promise.all([
      axios.put('/api/bot/config', { configKey: 'onebot_url', configValue: botForm.onebot_url }),
      axios.put('/api/bot/config', { configKey: 'onebot_token', configValue: botForm.onebot_token }),
      axios.put('/api/bot/config', { configKey: 'bot_name', configValue: botForm.bot_name })
    ])
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const saveTriggerConfig = async () => {
  saving.value = true
  try {
    await Promise.all([
      axios.put('/api/bot/config', { configKey: 'trigger_at', configValue: triggerForm.trigger_at ? '1' : '0' }),
      axios.put('/api/bot/config', { configKey: 'trigger_probability', configValue: triggerForm.trigger_probability ? '1' : '0' }),
      axios.put('/api/bot/config', { configKey: 'probability_value', configValue: String(triggerForm.probability_value) })
    ])
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>
