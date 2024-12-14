<template>
	<div>
		<h1>Вход</h1>
		<p>Даже без функционала, дать любому доступ к редактированию базы данных университета будет слишком опрометчиво</p>
		<input type="password" v-model="password" placeholder="Введите пароль" />
		<button @click="login">Войти</button>
		<p v-if="error" style="color: red;">{{ error }}</p>
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