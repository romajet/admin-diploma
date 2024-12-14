<template>
	<div>
		<h1>Добро пожаловать!</h1>
		<p>Как у вас это вышло?</p>
		<button @click="logout">Выйти</button>
	</div>
</template>

<script>
export default {
	created() {
		// Проверяем, есть ли данные входа
		const isAuthenticated = localStorage.getItem("authenticated") === "true";
		const loginTimestamp = parseInt(localStorage.getItem("loginTimestamp"), 10);
		const sessionTimeout = parseInt(localStorage.getItem("sessionTimeout"), 10);
		const now = Date.now();

		// Если данные отсутствуют или время истекло
		if (!isAuthenticated || isNaN(loginTimestamp) || now - loginTimestamp > sessionTimeout) {
			this.logout(); // Удаляем данные входа и отправляем на страницу логина
		}
	},
	methods: {
		logout() {
			localStorage.removeItem("authenticated");
			localStorage.removeItem("loginTimestamp");
			localStorage.removeItem("sessionTimeout");
			this.$router.push("/login");
		},
	},
};
</script>