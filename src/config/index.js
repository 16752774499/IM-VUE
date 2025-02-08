// 后端服务地址
export const BACKEND_URL = 'http://localhost:3333'
export const WS_URL = BACKEND_URL.replace('http', 'ws')
export const MINIO_URL = 'http://localhost:1900'  // 添加 MinIO 服务地址

// 聊天配置
export const CHAT_CONFIG = {
    MAX_STORED_MESSAGES: 20,  // 每个会话最多存储的消息数量
    HISTORY_BATCH_SIZE: 10    // 每次加载历史消息的数量
}

// API基础URL
export const API_BASE_URL = BACKEND_URL

// API endpoints
export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/user/login`,
    USER: `${API_BASE_URL}/user`,
    CHECK_SESSION: `${API_BASE_URL}/user/check-session`,
    SEARCH_USER: `${API_BASE_URL}/user/search`,
    ADD_FRIEND: `${API_BASE_URL}/user/add-friend`,
    GET_FRIENDS: `${API_BASE_URL}/user/friends`,
    GET_FRIEND_REQUESTS: `${API_BASE_URL}/user/friend-requests`,
    HANDLE_FRIEND_REQUEST: `${API_BASE_URL}/user/handle-request`,
    FILE_UPLOAD: `${API_BASE_URL}/file/upload`
}

// 前端开发服务器URL
export const FRONTEND_URL =
    import.meta.env.VITE_FRONTEND_URL || 'http://192.168.0.189:5173'        