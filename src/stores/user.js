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
                    body: JSON.stringify({
                        id: this.userData.id
                    })
                })

                console.log('Avatar response:', data)
                if (data.status === 200 && data.data) {
                    this.userAvatar = data.data ? API_BASE_URL + data.data : defaultAvatar
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