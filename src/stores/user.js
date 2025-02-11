import { defineStore } from 'pinia'
import defaultAvatar from '../assets/avatar.jpg'
import { API_ENDPOINTS, API_BASE_URL } from '../config'
import { request } from '../utils/request'

export const useUserStore = defineStore('user', {
    state: () => ({
        userData: null,
        userAvatar: defaultAvatar
    }),
    getters: {
        isLoggedIn: (state) => !!state.userData,
        userName: (state) => (state.userData ? state.userData.userName : '') || ''
    },
    actions: {
        setUserData(data) {
            this.userData = data
        },
        clearUserData() {
            this.userData = null
            this.userAvatar = defaultAvatar
        },
        async loadUserAvatar() {
            if (!this.userData) return

            try {
                const data = await request(API_ENDPOINTS.USER, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: this.userData.id
                    })
                })

                console.log('Avatar response:', data)
                if (data.status === 200 && data.data && data.data.avatar) {
                    const avatar = data.data.avatar
                    if (avatar.startsWith('http') || avatar.startsWith('data:')) {
                        this.userAvatar = avatar
                    } else {
                        this.userAvatar = `${API_BASE_URL}${avatar}`
                    }
                } else {
                    this.userAvatar = defaultAvatar
                }
            } catch (error) {
                console.error('Failed to load user avatar:', error)
                this.userAvatar = defaultAvatar
            }
        }
    }
})