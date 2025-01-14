<template>
	<div class="login-container">
		<div class="login-box">
			<h1>Админка</h1>
			<input type="password" v-model="password" @keyup.enter="login" placeholder="Введите пароль" />
			<button @click="login">Войти</button>
			<p v-if="error" style="color: red;">{{ error }}</p>
		</div>
	</div>
</template>

<script>
import bcrypt from "bcryptjs";

export default {
	data() {
		return {
			password: "",
			error: null,
			// Хэш пароля
			storedHash: "$2b$12$2TXx0PSjG4rXtmwPdPsXK.BP8XTdZ6cemfU8dTsT7epMy0xR4XvpO",
			timeoutMinutes: 30, // Тайм-аут в минутах
		};
	},
	methods: {
		login() {
			// он выдает ошибку в начале проекта, но это ни на что не влияет и он будет все равно вырезан за ненадобностью
			// Module "crypto" has been externalized for browser compatibility. Cannot access "crypto.randomBytes" in client code.
			bcrypt.compare(this.password, this.storedHash, (err, result) => {
				if (result) {
					// Успешный вход
					const now = Date.now();
					const timeout = this.timeoutMinutes * 60 * 1000; // Тайм-аут в миллисекундах

					localStorage.setItem("authenticated", "true");
					localStorage.setItem("loginTimestamp", now.toString());
					localStorage.setItem("sessionTimeout", timeout.toString());

					this.$router.push("/"); // Переход на главную
				} else {
					this.error = "Неверный пароль!";
				}
			});
		},
	},
};
</script>

<style scoped>
.login-container {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
}

.login-box {
	text-align: center;
	padding: 30px;

}
</style>
