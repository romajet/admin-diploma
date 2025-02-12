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
import { useToast } from "vue-toastification";

export default {
	data() {
		return {
			password: "",
			error: null,
			// Хэш пароля
			storedHash: "$2b$12$Yr.aCi6J8m5ZTHiaE4psKOHGlmSZ85tOhGN53.MLtVxfiVyzk7PpK",
			timeoutMinutes: 30,
			toast: null,
		};
	},
	created() {
		this.toast = useToast();
	},
	methods: {
		login() {
			// он выдает ошибку в начале проекта, но это ни на что не влияет и он будет все равно вырезан за ненадобностью
			// Module "crypto" has been externalized for browser compatibility. Cannot access "crypto.randomBytes" in client code.
			bcrypt.compare(this.password, this.storedHash, (err, result) => {
				if (result) {
					const now = Date.now();
					const timeout = this.timeoutMinutes * 60 * 1000;

					localStorage.setItem("authenticated", "true");
					localStorage.setItem("loginTimestamp", now.toString());
					localStorage.setItem("sessionTimeout", timeout.toString());

					this.$router.push("/");
					this.toast.success("Вход выполнен успешно!");
				} else {
					this.toast.error("Неверный пароль!");
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
