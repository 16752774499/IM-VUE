// 根据环境变量设置API基础URL
export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// API endpoints
export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/user/login`,
    USER: `${API_BASE_URL}/user`,
    CHECK_SESSION: `${API_BASE_URL}/user/check-session`,
    SEARCH_USER: `${API_BASE_URL}/user/search`,
    ADD_FRIEND: `${API_BASE_URL}/user/add-friend`,
    GET_FRIENDS: `${API_BASE_URL}/user/friends`,
    GET_FRIEND_REQUESTS: `${API_BASE_URL}/user/friend-requests`,
    HANDLE_FRIEND_REQUEST: `${API_BASE_URL}/user/handle-request`
}

// 前端开发服务器URL
export const FRONTEND_URL =
    import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'