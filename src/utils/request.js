/**
 * 封装的fetch请求
 * @param {string} url - 请求URL
 * @param {Object} options - 请求配置
 * @returns {Promise} - 返回Promise
 */
export const request = async(url, options = {}) => {
    // 默认配置
    const defaultOptions = {
        credentials: 'include', // 默认带上cookies
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        mode: 'cors' // 明确指定CORS模式
    }

    // 如果是 FormData，不设置 Content-Type
    if (options.body instanceof FormData) {
        delete defaultOptions.headers['Content-Type']
    }

    // 合并配置
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    }

    try {
        const response = await fetch(url, finalOptions)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Request failed:', error)
        throw error
    }
}