import { createApp } from 'vue'
import router from "./router"
import App from './App.vue'
import 'material-icons/iconfont/material-icons.css'
import Toast from 'vue-toastification'
import "vue-toastification/dist/index.css"

const options = {
    transition: "Vue-Toastification__fade",
    maxToasts: 3,
    newestOnTop: true,
    position: "top-center",
    timeout: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: false,
    showCloseButtonOnHover: true,
    hideProgressBar: false,
    closeButton: false,
    icon: true
}

// createApp(App).use(router).mount('#app')

 const app = createApp(App)

 app.use(router)
 app.use(Toast, options)
 app.mount('#app')
