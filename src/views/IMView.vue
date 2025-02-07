<template>
  <div class="im-container">
    <!-- 左侧菜单栏 -->
    <div class="menu-sidebar">
      <!-- 用户头像 -->
      <div class="user-avatar" @click="showUserMenu = true">
        <el-avatar :size="40" :src="userStore.userAvatar" />
      </div>

      <!-- 主菜单 -->
      <div class="main-menu">
        <div class="menu-item" :class="{ active: activeMenu === 'chat' }" @click="handleMenuSelect('chat')">
          <el-badge :value="unreadCount" :hidden="!unreadCount">
            <el-icon>
              <ChatDotRound />
            </el-icon>
          </el-badge>
        </div>
        <div class="menu-item" :class="{ active: activeMenu === 'friends' }" @click="handleMenuSelect('friends')">
          <el-icon>
            <UserFilled />
          </el-icon>
        </div>
      </div>

      <!-- 底部菜单 -->
      <div class="bottom-menu">
        <div class="menu-item" @click="showSearchDialog = true">
          <el-icon>
            <Plus />
          </el-icon>
        </div>
        <div class="menu-item" :class="{ active: activeMenu === 'requests' }" @click="handleMenuSelect('requests')">
          <el-badge :value="friendRequests.length" :hidden="!friendRequests.length">
            <el-icon>
              <Bell />
            </el-icon>
          </el-badge>
        </div>
      </div>
    </div>

    <!-- 列表区域 -->
    <div class="list-sidebar">
      <!-- 搜索框 -->
      <div class="search-box">
        <el-input v-model="searchKey" placeholder="搜索" :prefix-icon="Search" clearable />
      </div>

      <!-- 聊天列表 -->
      <div v-if="activeMenu === 'chat'" class="chat-list">
        <div v-for="[userId, session] in Array.from(chatSessions)" :key="userId" class="chat-item"
          :class="{ active: currentContact?.id === userId }" @click="startChat(session.userInfo)">
          <el-avatar :size="40" :src="getAvatarUrl(session.userInfo.avatar)" />
          <div class="chat-info">
            <div class="chat-header">
              <span class="chat-name">{{ session.userInfo.userName }}</span>
              <span class="chat-time">{{ session.lastMessageTime ? formatTime(session.lastMessageTime) : '' }}</span>
            </div>
            <div class="chat-message">{{ session.lastMessage || '暂无消息' }}</div>
          </div>
          <el-badge v-if="session.unread" :value="session.unread" class="unread-badge" />
        </div>
      </div>

      <!-- 好友列表 -->
      <div v-if="activeMenu === 'friends'" class="friend-list">
        <div v-for="friend in friendList" :key="friend.id" class="friend-item"
          :class="{ 'selected': selectedFriend === friend.id }" @click="selectContact(friend)">
          <el-avatar :size="40" :src="getAvatarUrl(friend.avatar)" />
          <div class="friend-info">
            <div class="friend-name">{{ friend.userName }}</div>
          </div>
          <!-- 操作按钮 -->
          <div v-if="selectedFriend === friend.id" class="friend-actions">
            <el-button type="danger" size="small" @click.stop="deleteFriend(friend.id)">
              删除好友
            </el-button>
            <el-button type="primary" size="small" @click.stop="startChat(friend)">
              发送消息
            </el-button>
          </div>
        </div>
      </div>

      <!-- 好友申请列表 -->
      <div v-if="activeMenu === 'requests'" class="request-list">
        <div v-for="request in friendRequests" :key="request.id" class="request-item">
          <el-avatar :size="40" :src="getAvatarUrl(request.from.avatar)" />
          <div class="request-info">
            <div class="request-name">{{ request.from.userName }}</div>
            <div class="request-time">{{ new Date(request.createdAt).toLocaleString() }}</div>
            <div class="request-actions">
              <el-button type="success" size="small" @click="handleAcceptRequest(request)">接受</el-button>
              <el-button type="danger" size="small" @click="handleRejectRequest(request)">拒绝</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 聊天区域 -->
    <div class="chat-area" v-if="currentContact">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <span class="contact-name">{{ currentContact.userName }}</span>
        <span class="chat-time">{{ new Date(currentContact.lastMessageTime).toLocaleString() }}</span>
      </div>

      <!-- 消息列表 -->
      <div class="message-list" ref="messageList">
        <div class="load-history-btn" @click="loadHistoryMessages" v-if="currentContact">
          <span v-if="!isLoadingHistory">加载历史消息</span>
          <span v-else>加载中...</span>
        </div>
        <div v-for="message in messages" :key="message.id" class="message-item"
          :class="{ 'message-self': message.isSelf }">
          <el-avatar :size="40" :src="message.isSelf ? userStore.userAvatar : getAvatarUrl(currentContact.avatar)" />
          <div class="message-content">{{ message.content }}</div>
          <div v-if="message.isSelf" class="message-status">
            <span v-if="message.status === 'sending'" class="status-sending">发送中...</span>
            <el-icon v-else-if="message.status === 'failed'" class="status-failed" @click="resendMessage(message)">
              <Warning />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="toolbar">
          <el-icon>
            <ChatRound />
          </el-icon>
          <el-icon>
            <Document />
          </el-icon>
          <el-icon>
            <FolderOpened />
          </el-icon>
        </div>
        <div class="input-box">
          <el-input v-model="messageInput" type="textarea" :rows="3" placeholder="输入消息..." resize="none"
            @keyup.enter.exact="sendMessage" />
          <el-button type="primary" @click="sendMessage">发送</el-button>
        </div>
      </div>
    </div>

    <div v-else class="no-chat">
      <el-empty description="选择一个聊天" />
    </div>

    <!-- 搜索用户对话框 -->
    <el-dialog v-model="showSearchDialog" title="添加好友" width="400px" :close-on-click-modal="false">
      <div class="search-container">
        <el-input v-model="searchUsername" placeholder="请输入用户名" clearable @keyup.enter="searchUser">
          <template #append>
            <el-button type="primary" @click="searchUser">搜索</el-button>
          </template>
        </el-input>

        <!-- 搜索结果 -->
        <div v-if="searchResult" class="search-result">
          <div class="user-card">
            <el-avatar :size="40" :src="getAvatarUrl(searchResult.avatar)" />
            <div class="user-info">
              <div class="username">{{ searchResult.userName }}</div>
            </div>
            <el-button type="primary" @click="addFriend" :loading="addingFriend" :disabled="addingFriend">
              添加好友
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Plus,
  ChatDotRound,
  UserFilled,
  Bell,
  Search,
  ChatRound,
  Document,
  FolderOpened,
  Warning
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import defaultAvatar from '../assets/avatar.jpg'
import { useUserStore } from '../stores/user'
import { request } from '../utils/request'
import { API_ENDPOINTS, API_BASE_URL, WS_URL, CHAT_CONFIG } from '../config'

const router = useRouter()
const userStore = useUserStore()
const messageInput = ref('')
const currentContact = ref(null)
const messageList = ref(null)
const isMobileView = ref(window.innerWidth <= 768)
const showChat = ref(false)
const contacts = ref([])  // 清空默认联系人
const messages = ref([])  // 清空默认消息

// 搜索相关
const showSearchDialog = ref(false)
const searchUsername = ref('')
const searchResult = ref(null)
const addingFriend = ref(false)

// 新增的状态
const activeMenu = ref('chat')
const chatList = ref([])
const friendList = ref([])
const friendRequests = ref([])
const unreadCount = ref(0)  // 添加未读消息计数
const searchKey = ref('')   // 添加搜索关键字

// 添加新的状态变量
const selectedFriend = ref(null)
const ws = ref(null)
const chatSessions = ref(new Map()) // 存储所有聊天会话 Map<userId, {lastMessage, unread, userInfo}>
const lastReceivedTimes = ref(new Map()) // 存储每个会话最后收到消息的时间戳 Map<userId, timestamp>

// 添加重连相关的状态
const wsReconnectTimer = ref(null)
const wsReconnectAttempts = ref(0)
const MAX_RECONNECT_ATTEMPTS = 0 // 设为0表示无限重试

// 在 script 部分添加新的变量和函数
const isLoadingHistory = ref(false)

// 从localStorage加载聊天会话
const loadChatSessionsFromStorage = () => {
  try {
    const userId = userStore.userData.id
    const savedSessions = localStorage.getItem(`chat_sessions_${userId}`)

    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions)
      const processedSessions = new Map()

      for (const [sessionId, session] of parsedSessions) {
        // 重置maxStoredMessages为配置的默认值
        session.maxStoredMessages = CHAT_CONFIG.MAX_STORED_MESSAGES

        // 对消息按时间戳排序
        if (session.messages && session.messages.length > 0) {
          session.messages.sort((a, b) => b.timestamp - a.timestamp) // 按时间戳降序排序
          // 只保留最新的N条消息
          session.messages = session.messages.slice(0, CHAT_CONFIG.MAX_STORED_MESSAGES)
          // 恢复正确的时间顺序
          session.messages.sort((a, b) => a.timestamp - b.timestamp)
        }
        processedSessions.set(sessionId, session)
      }
      chatSessions.value = processedSessions
    }
  } catch (error) {
    console.error('Failed to load chat sessions from storage:', error)
  }
}

// 保存聊天会话到localStorage
const saveChatSessionsToStorage = () => {
  try {
    const userId = userStore.userData.id
    const sessionsArray = Array.from(chatSessions.value.entries())
    const timesArray = Array.from(lastReceivedTimes.value.entries())

    localStorage.setItem(`chat_sessions_${userId}`, JSON.stringify(sessionsArray))
    localStorage.setItem(`last_received_times_${userId}`, JSON.stringify(timesArray))
  } catch (error) {
    console.error('Failed to save chat sessions to storage:', error)
  }
}

// 监听聊天会话变化，自动保存
watch(chatSessions, () => {
  saveChatSessionsToStorage()
}, { deep: true })

// 监听lastReceivedTimes变化，自动保存
watch(lastReceivedTimes, () => {
  saveChatSessionsToStorage()
}, { deep: true })

// 计算搜索结果用户的头像URL
const getAvatarUrl = (avatar) => {
  if (!avatar || avatar === 'null' || avatar === 'undefined' || avatar === defaultAvatar) {
    return defaultAvatar
  }
  if (avatar.startsWith('http') || avatar.startsWith('data:')) {
    return avatar
  }
  return `${API_BASE_URL}${avatar}`
}

// 添加一个格式化时间的函数
const formatTime = (date) => {
  const now = new Date()
  const messageDate = new Date(date)

  // 如果是今天的消息，只显示时间
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 如果是昨天的消息
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }

  // 如果是今年的消息
  if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }

  // 其他情况显示完整日期
  return messageDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 搜索用户
const searchUser = async () => {
  if (!searchUsername.value) {
    ElMessage.warning('请输入用户名')
    return
  }

  try {
    console.log('Searching user:', searchUsername.value)

    // 创建 FormData
    const formData = new FormData()
    formData.append('user_name', searchUsername.value)

    console.log('Request URL:', API_ENDPOINTS.SEARCH_USER)
    const response = await request(API_ENDPOINTS.SEARCH_USER, {
      method: 'POST',
      body: formData
    })

    console.log('Search user response:', response)

    if (response.status === 200) {
      if (response.data) {
        searchResult.value = response.data
      } else {
        ElMessage.warning('未找到该用户')
        searchResult.value = null
      }
    } else {
      searchResult.value = null
      ElMessage.warning(response.msg || '用户不存在')
    }
  } catch (error) {
    console.error('Search user failed:', error)
    searchResult.value = null
    if (error.message.includes('401')) {
      ElMessage.error('请先登录')
      router.push('/login')
    } else {
      ElMessage.error('搜索失败，请重试')
    }
  }
}

// 添加好友
const addFriend = async () => {
  if (!searchResult.value) {
    console.log('No search result')
    return
  }

  if (!searchResult.value.id) {
    console.error('Invalid search result:', searchResult.value)
    ElMessage.error('无效的用户信息')
    return
  }

  console.log('Adding friend:', searchResult.value)
  addingFriend.value = true

  try {
    // 创建 FormData
    const formData = new FormData()
    formData.append('friend_id', searchResult.value.id)

    console.log('Request URL:', API_ENDPOINTS.ADD_FRIEND)
    console.log('Request Data:', {
      friend_id: searchResult.value.id
    })

    const response = await request(API_ENDPOINTS.ADD_FRIEND, {
      method: 'POST',
      headers: {},  // 不设置 Content-Type，让浏览器自动设置
      body: formData
    })

    console.log('Add friend response:', response)

    if (response.status === 200) {
      ElMessage.success(response.msg || "好友申请已提交！")
      showSearchDialog.value = false
      // 刷新好友请求列表
      await loadFriendRequests()
    } else {
      ElMessage.error(response.msg || '添加好友失败')
    }
  } catch (error) {
    console.error('Add friend failed:', error)
    if (error.message.includes('401')) {
      ElMessage.error('请先登录')
      router.push('/login')
    } else {
      ElMessage.error('添加好友失败，请重试')
    }
  } finally {
    addingFriend.value = false
  }
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
  isMobileView.value = window.innerWidth <= 768
})

// 修改WebSocket连接管理
const connectWebSocket = () => {
  const currentUserId = userStore.userData.id
  const wsUrl = `${WS_URL}/ws/chat?uid=${currentUserId}`

  if (ws.value) {
    ws.value.close()
  }

  try {
    ws.value = new WebSocket(wsUrl)

    ws.value.onopen = () => {
      console.log('Chat WebSocket connected:', wsUrl)
      // 连接成功，重置重连次数
      wsReconnectAttempts.value = 0
      // 清除重连定时器
      if (wsReconnectTimer.value) {
        clearTimeout(wsReconnectTimer.value)
        wsReconnectTimer.value = null
      }
    }

    ws.value.onmessage = handleChatMessage
    ws.value.onerror = handleChatError
    ws.value.onclose = handleChatClose
  } catch (error) {
    console.error('WebSocket connection failed:', error)
    handleReconnect()
  }
}

// 添加重连处理函数
const handleReconnect = () => {
  // 如果已经有重连定时器在运行，不需要再次设置
  if (wsReconnectTimer.value) {
    return
  }

  // 如果设置了最大重连次数，且已达到最大次数，则停止重连
  if (MAX_RECONNECT_ATTEMPTS > 0 && wsReconnectAttempts.value >= MAX_RECONNECT_ATTEMPTS) {
    console.log('Max reconnection attempts reached')
    ElMessage.error('WebSocket连接失败，请刷新页面重试')
    return
  }

  console.log(`Attempting to reconnect in 10 seconds... (Attempt ${wsReconnectAttempts.value + 1})`)
  wsReconnectTimer.value = setTimeout(() => {
    wsReconnectAttempts.value++
    connectWebSocket()
  }, 10000)
}

// 修改聊天错误处理函数
const handleChatError = (error) => {
  console.error('Chat WebSocket error:', error)
  ElMessage.error('聊天连接出错，正在尝试重连...')
}

// 修改聊天连接关闭处理函数
const handleChatClose = () => {
  console.log('Chat WebSocket closed')
  handleReconnect()
}

// 修改聊天消息处理函数
const handleChatMessage = async (event) => {
  const message = JSON.parse(event.data)
  console.log('Received chat message:', message)

  if (message.type === 1) {
    const currentUserId = parseInt(userStore.userData.id)
    const messageToId = parseInt(message.to)

    if (messageToId === currentUserId) {
      const senderId = parseInt(message.from)
      console.log('Processing message from user:', senderId)

      let session = chatSessions.value.get(senderId)

      if (!session) {
        console.log('Creating new chat session for sender:', senderId)
        try {
          // 尝试从好友列表中查找用户信息
          const friendInfo = friendList.value.find(friend => friend.id === senderId)

          let userData = null
          if (friendInfo) {
            // 确保包含完整的用户信息
            userData = {
              id: senderId,
              userName: friendInfo.userName,
              avatar: friendInfo.avatar || defaultAvatar,
              ...friendInfo
            }
          } else {
            // 如果找不到好友信息，使用默认值
            userData = {
              id: senderId,
              userName: '用户' + senderId,
              avatar: defaultAvatar
            }
          }

          // 创建新的聊天会话
          session = {
            lastMessage: message.content,
            unread: 0,
            userInfo: userData,
            messages: [],
            lastMessageTime: message.time * 1000,
            maxStoredMessages: CHAT_CONFIG.MAX_STORED_MESSAGES
          }
          chatSessions.value.set(senderId, session)
        } catch (error) {
          console.error('Failed to get user info:', error)
          const userData = {
            id: senderId,
            userName: '用户' + senderId,
            avatar: defaultAvatar
          }

          session = {
            lastMessage: message.content,
            unread: 0,
            userInfo: userData,
            messages: [],
            lastMessageTime: message.time * 1000,
            maxStoredMessages: CHAT_CONFIG.MAX_STORED_MESSAGES
          }
          chatSessions.value.set(senderId, session)
        }
      }

      if (session) {
        const newMessage = {
          id: Date.now(),
          content: message.content,
          isSelf: false,
          timestamp: message.time * 1000 // 转换为毫秒级时间戳用于显示
        }

        session.lastMessage = message.content
        session.lastMessageTime = message.time * 1000 // 转换为毫秒级时间戳用于显示

        if (currentContact.value?.id !== senderId) {
          session.unread += 1
        }

        if (!session.messages) {
          session.messages = []
        }

        // 添加新消息
        session.messages.push(newMessage)

        // 如果不是在加载历史消息，则使用默认的存储限制
        if (session.maxStoredMessages > CHAT_CONFIG.MAX_STORED_MESSAGES && !isLoadingHistory.value) {
          session.maxStoredMessages = CHAT_CONFIG.MAX_STORED_MESSAGES
        }

        // 如果消息数量超过限制，删除最早的消息
        if (session.messages.length > session.maxStoredMessages) {
          session.messages = session.messages.slice(-session.maxStoredMessages)
        }

        if (currentContact.value?.id === senderId) {
          messages.value = session.messages
        }

        chatSessions.value = new Map(chatSessions.value)
      }
    }
  } else if (message.type === 2) {
    // 处理历史消息响应
    if (message.content === "没有更多历史记录了！") {
      ElMessage.info('没有更多历史消息了')
      return
    }

    try {
      // 解析历史消息数组
      const historyMessages = JSON.parse(message.content)
      if (!Array.isArray(historyMessages) || historyMessages.length === 0) {
        return
      }

      // 获取当前会话
      const currentUserId = parseInt(userStore.userData.id)
      const session = chatSessions.value.get(currentContact.value.id)
      if (!session) return

      // 处理每条历史消息
      for (const historyMessage of historyMessages) {
        try {
          // 创建新的消息对象
          const newMessage = {
            id: historyMessage.time * 1000, // 使用消息时间作为ID
            content: historyMessage.content,
            isSelf: historyMessage.from === currentUserId,
            timestamp: historyMessage.time * 1000 // 转换为毫秒级时间戳用于显示
          }

          // 将消息添加到会话开头
          session.messages.unshift(newMessage)
        } catch (parseError) {
          console.error('Failed to parse history message:', parseError, historyMessage)
          continue
        }
      }

      // 更新视图
      if (currentContact.value?.id === session.userInfo.id) {
        messages.value = session.messages
      }

      // 更新会话Map以触发视图更新
      chatSessions.value = new Map(chatSessions.value)

    } catch (error) {
      console.error('Failed to process history messages:', error)
      ElMessage.error('处理历史消息失败')
    }
  }
}

// 修改发送消息函数
const sendMessage = async () => {
  if (!messageInput.value.trim()) return

  const messageContent = messageInput.value.trim()
  const targetId = parseInt(currentContact.value.id)
  const currentTime = Date.now()

  const newMessage = {
    id: currentTime,
    content: messageContent,
    isSelf: true,
    status: 'sending',
    timestamp: currentTime // 保持毫秒级时间戳用于显示
  }

  const session = chatSessions.value.get(targetId)
  if (!session) return

  if (!session.messages) {
    session.messages = []
  }

  // 添加新消息
  session.messages.push(newMessage)

  // 使用会话特定的存储限制
  const maxMessages = session.maxStoredMessages || CHAT_CONFIG.MAX_STORED_MESSAGES
  if (session.messages.length > maxMessages) {
    session.messages = session.messages.slice(-maxMessages)
  }

  messages.value = session.messages
  messageInput.value = ''

  await sendMessageWithRetry(newMessage, targetId)
}

// 添加消息重发功能
const resendMessage = async (message) => {
  const targetId = parseInt(currentContact.value.id)
  message.status = 'sending'
  await sendMessageWithRetry(message, targetId)
}

// 修改发送消息的WebSocket数据结构
const sendMessageWithRetry = async (message, targetId) => {
  const sendWithTimeout = () => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('发送超时'))
      }, 10000)

      try {
        if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket未连接'))
          return
        }

        const wsMessage = {
          type: 1,
          from: parseInt(userStore.userData.id),
          to: targetId,
          content: message.content,
          time: Math.floor(message.timestamp / 1000) // 转换为秒级时间戳
        }

        ws.value.send(JSON.stringify(wsMessage))
        clearTimeout(timeoutId)
        resolve()
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }

  try {
    // 如果WebSocket未连接，尝试重连
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      console.log('WebSocket未连接，尝试重连...')
      connectWebSocket()

      // 等待连接建立
      await new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (ws.value && ws.value.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection)
            resolve()
          }
        }, 100)

        // 10秒后停止等待
        setTimeout(() => {
          clearInterval(checkConnection)
          resolve()
        }, 10000)
      })
    }

    // 尝试发送消息
    await sendWithTimeout()

    // 发送成功，更新消息状态
    message.status = 'sent'
    delete message.status // 发送成功后删除状态标记，这样不会保存到localStorage

    // 更新会话
    const session = chatSessions.value.get(targetId)
    if (session) {
      session.lastMessage = message.content
      session.lastMessageTime = message.timestamp
      // 强制更新 Map 以触发视图更新
      chatSessions.value = new Map(chatSessions.value)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    message.status = 'failed'
    ElMessage.error('发送失败，点击消息重试')

    // 更新视图
    const session = chatSessions.value.get(targetId)
    if (session) {
      chatSessions.value = new Map(chatSessions.value)
    }
  }
}

// 添加滚动到底部的函数
const scrollToBottom = () => {
  setTimeout(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  }, 100)
}

// 监听消息列表变化，自动滚动到底部
watch(() => messages.value.length, () => {
  scrollToBottom()
})

// 修改 startChat 函数，在切换对话时滚动到底部
const startChat = (friend) => {
  const friendId = parseInt(friend.id)
  console.log('Starting chat with friend:', friendId)

  // 确保friend.id是整数，并且包含完整的用户信息
  friend = {
    ...friend,
    id: friendId,
    avatar: friend.avatar || defaultAvatar
  }
  currentContact.value = friend
  activeMenu.value = 'chat'

  // 添加或更新聊天会话
  if (!chatSessions.value.has(friendId)) {
    chatSessions.value.set(friendId, {
      lastMessage: '',
      unread: 0,
      userInfo: friend,
      messages: [],
      lastMessageTime: null,
      maxStoredMessages: CHAT_CONFIG.MAX_STORED_MESSAGES
    })
  } else {
    // 更新现有会话的用户信息
    const session = chatSessions.value.get(friendId)
    session.userInfo = {
      ...session.userInfo,
      ...friend
    }
  }

  // 获取或更新会话
  const session = chatSessions.value.get(friendId)
  if (session) {
    session.unread = 0
    messages.value = session.messages || []
    // 强制更新 Map 以触发视图更新
    chatSessions.value = new Map(chatSessions.value)
    // 滚动到底部
    scrollToBottom()
  }
}

// 修改 onMounted 钩子
onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }

  await userStore.loadUserAvatar()
  await loadFriendList()
  await loadFriendRequests()

  // 加载保存的聊天会话
  loadChatSessionsFromStorage()

  // 建立WebSocket连接
  connectWebSocket()
})

// 修改选择联系人函数
const selectContact = (friend) => {
  if (selectedFriend.value === friend.id) {
    startChat(friend)
  } else {
    selectedFriend.value = friend.id
  }
}

// 计算总未读消息数
const totalUnread = computed(() => {
  let total = 0
  chatSessions.value.forEach(session => {
    total += session.unread || 0
  })
  return total
})

// 删除好友函数（待实现）
const deleteFriend = async (friendId) => {
  // TODO: 实现删除好友功能
  ElMessage.info('删除好友功能即将实现')
  selectedFriend.value = null
}

// 处理菜单选择
const handleMenuSelect = (key) => {
  activeMenu.value = key
  if (key === 'friends') {
    loadFriendList()
  } else if (key === 'requests') {
    loadFriendRequests()
  }
}

// 加载好友列表
const loadFriendList = async () => {
  try {
    const response = await request(API_ENDPOINTS.GET_FRIENDS)
    if (response.status === 200) {
      friendList.value = response.data || []
    } else {
      friendList.value = []
      ElMessage.warning(response.msg || '加载好友列表失败')
    }
  } catch (error) {
    console.error('Load friend list failed:', error)
    friendList.value = []
    if (error.message.includes('401')) {
      ElMessage.error('请先登录')
      router.push('/login')
    } else {
      ElMessage.error('加载好友列表失败')
    }
  }
}

// 加载好友申请
const loadFriendRequests = async () => {
  try {
    const response = await request(API_ENDPOINTS.GET_FRIEND_REQUESTS)
    if (response.status === 200) {
      friendRequests.value = response.data || []
    } else {
      friendRequests.value = []
      ElMessage.warning(response.msg || '加载好友请求失败')
    }
  } catch (error) {
    console.error('Load friend requests failed:', error)
    friendRequests.value = []
    if (error.message.includes('401')) {
      ElMessage.error('请先登录')
      router.push('/login')
    } else {
      ElMessage.error('加载好友请求失败')
    }
  }
}

// 处理好友申请
const handleAcceptRequest = async (friendRequest) => {
  try {
    const formData = new FormData()
    formData.append('request_id', friendRequest.id)
    formData.append('action', 'accept')
    console.log("Accepting friend request:", friendRequest.id)

    const response = await request(API_ENDPOINTS.HANDLE_FRIEND_REQUEST, {
      method: 'POST',
      headers: {},
      body: formData
    })

    if (response.status === 200) {
      ElMessage.success('已接受好友申请')
      loadFriendRequests()  // 重新加载申请列表
      loadFriendList()      // 重新加载好友列表
    } else {
      ElMessage.error(response.msg || '处理好友申请失败')
    }
  } catch (error) {
    console.error('Handle friend request failed:', error)
    ElMessage.error('处理好友申请失败')
  }
}

const handleRejectRequest = async (friendRequest) => {
  try {
    const formData = new FormData()
    formData.append('request_id', friendRequest.id)
    formData.append('action', 'reject')

    const response = await request(API_ENDPOINTS.HANDLE_FRIEND_REQUEST, {
      method: 'POST',
      headers: {},
      body: formData
    })

    if (response.status === 200) {
      ElMessage.success('已拒绝好友申请')
      loadFriendRequests()  // 重新加载申请列表
    } else {
      ElMessage.error(response.msg || '处理好友申请失败')
    }
  } catch (error) {
    console.error('Handle friend request failed:', error)
    ElMessage.error('处理好友申请失败')
  }
}

// 添加 onUnmounted 钩子
onUnmounted(() => {
  // 清理重连定时器
  if (wsReconnectTimer.value) {
    clearTimeout(wsReconnectTimer.value)
  }
  // 清理聊天连接
  if (ws.value) {
    ws.value.close()
  }
})

// 添加获取最早消息时间戳的函数
const getEarliestMessageTimestamp = (userId) => {
  const session = chatSessions.value.get(userId)
  if (session?.messages?.length > 0) {
    // 因为消息是按时间顺序排列的，第一条就是最早的
    return session.messages[0].timestamp
  }
  return null
}

// 修改加载历史消息的函数
const loadHistoryMessages = async () => {
  if (!currentContact.value || isLoadingHistory.value) return

  isLoadingHistory.value = true
  try {
    const session = chatSessions.value.get(currentContact.value.id)
    if (!session) return

    // 获取当前会话中最早的消息时间戳，并转换为秒级
    const earliestTimestamp = session.messages && session.messages.length > 0
      ? Math.floor(session.messages[0].timestamp / 1000)
      : Math.floor(Date.now() / 1000)

    const historyRequest = {
      type: 2,
      from: parseInt(userStore.userData.id),
      to: parseInt(currentContact.value.id),
      content: earliestTimestamp.toString(),
      time: Math.floor(Date.now() / 1000) // 转换为秒级时间戳
    }

    console.log('Requesting chat history:', historyRequest)
    ws.value.send(JSON.stringify(historyRequest))

    // 临时增加存储容量以容纳历史消息
    session.maxStoredMessages += CHAT_CONFIG.HISTORY_BATCH_SIZE
    console.log(`Temporarily increased message storage capacity to ${session.maxStoredMessages}`)

  } catch (error) {
    console.error('Failed to request chat history:', error)
    ElMessage.error('加载历史消息失败')
  } finally {
    isLoadingHistory.value = false
  }
}
</script>

<style scoped>
.im-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  background-color: #f5f5f5;
}

/* 左侧菜单栏 */
.menu-sidebar {
  width: 60px;
  background-color: #2e2e2e;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.user-avatar {
  margin-bottom: 20px;
  cursor: pointer;
}

.main-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.bottom-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.menu-item {
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: #888;
  font-size: 20px;
}

.menu-item:hover {
  background-color: #3e3e3e;
}

.menu-item.active {
  color: #07c160;
  background-color: #3e3e3e;
}

/* 列表区域 */
.list-sidebar {
  width: 250px;
  background-color: #fff;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.chat-item,
.friend-item {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.chat-item:hover,
.friend-item:hover {
  background-color: #f5f5f5;
}

.chat-item.active {
  background-color: #eee;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.chat-name {
  font-weight: 500;
  color: #333;
}

.chat-time {
  font-size: 12px;
  color: #999;
  padding: 0 4px;
  border-radius: 3px;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.chat-item:hover .chat-time {
  background-color: #f0f0f0;
}

.chat-message {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 聊天区域 */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.chat-header {
  height: 60px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.contact-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.message-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 70%;
  margin-bottom: 20px;
  padding: 0 10px;
}

.message-self {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.message-content {
  padding: 10px 12px;
  background-color: #fff;
  border-radius: 3px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-self .message-content {
  background-color: #fff;
  border-radius: 3px;
  color: #333;
}

.message-item:hover .message-content {
  background-color: #e6e6e6;
  transition: background-color 0.2s ease;
}

.message-self:hover .message-content {
  background-color: #e6e6e6;
}

.input-area {
  background-color: #fff;
  border-top: 1px solid #eee;
  padding: 10px;
}

.toolbar {
  padding: 10px;
  display: flex;
  gap: 15px;
  color: #666;
  font-size: 20px;
}

.toolbar .el-icon {
  cursor: pointer;
}

.toolbar .el-icon:hover {
  color: #07c160;
}

.input-box {
  display: flex;
  gap: 10px;
  padding: 10px;
}

.input-box .el-textarea__inner {
  border: none;
  resize: none;
  box-shadow: none;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 8px 12px;
}

.input-box .el-button {
  align-self: flex-end;
  border-radius: 4px;
}

.no-chat {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
}

/* 搜索结果样式 */
.search-container {
  padding: 20px 0;
}

.search-result {
  margin-top: 20px;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  gap: 15px;
}

.user-card .user-info {
  flex: 1;
}

.user-card .username {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-sidebar {
    width: 50px;
  }

  .list-sidebar {
    width: 200px;
  }
}

/* 好友请求样式 */
.request-item {
  padding: 15px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  border-bottom: 1px solid #eee;
}

.request-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.request-name {
  font-weight: 500;
  color: #333;
}

.request-time {
  font-size: 12px;
  color: #999;
}

.request-actions {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

/* 好友列表样式 */
.friend-item {
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.friend-item:hover {
  background-color: #f5f5f5;
}

.friend-item.selected {
  background-color: #f0f9eb;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.friend-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* 确保按钮在移动端也能正常显示 */
@media (max-width: 768px) {
  .friend-actions {
    flex-direction: column;
    gap: 4px;
  }

  .friend-actions .el-button {
    padding: 4px 8px;
    font-size: 12px;
  }
}

.unread-badge {
  margin-left: auto;
}

.chat-message {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* 消息时间样式 */
.message-time {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin: 10px 0;
}

/* 修改头像大小和样式 */
.message-item .el-avatar {
  width: 40px;
  height: 40px;
  border-radius: 3px;
}

/* 修改列表容器背景色 */
.chat-list,
.friend-list,
.request-list {
  flex: 1;
  overflow-y: auto;
}

/* 添加消息状态样式 */
.message-status {
  font-size: 12px;
  margin: 0 8px;
  display: flex;
  align-items: center;
}

.status-sending {
  color: #909399;
}

.status-failed {
  color: #F56C6C;
  cursor: pointer;
}

.status-failed:hover {
  opacity: 0.8;
}

.load-history-btn {
  text-align: center;
  padding: 8px 15px;
  color: #409EFF;
  cursor: pointer;
  font-size: 13px;
  background-color: #fff;
  border-radius: 4px;
  margin: 0 auto 15px;
  display: inline-block;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.load-history-btn:hover {
  background-color: #ecf5ff;
}

.load-history-btn span {
  user-select: none;
}
</style>