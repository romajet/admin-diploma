// src/router/index.js
import { createRouter, createWebHashHistory } from "vue-router";
import Admin from "@/views/Admin.vue";
import Pass from "@/views/Pass.vue";

const routes = [
	{
		path: "/",
		name: "Admin",
		component: Admin,
	},
	{
		path: "/login",
		name: "Pass",
		component: Pass,
	},
];

const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

export default router;