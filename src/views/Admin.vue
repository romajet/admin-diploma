<template>
	<div class="container">
		<button class="logout-button" @click="logout">Выйти</button>
		<div class="left-panel">
			<div class="selectors">
				<label>
					Корпус:
					<select v-model="selectedBuilding" @change="updateRooms">
						<option v-for="building in buildings" :key="building.buildingId" :value="building.buildingId">
							{{ building.shortname }} - {{ building.name }}
						</option>
					</select>
				</label>
				<label>
					Этаж:
					<select v-model="selectedFloor" @change="updateRooms">
						<option v-for="floor in availableFloors" :key="floor" :value="floor">
							Этаж {{ floor }}
						</option>
					</select>
				</label>
			</div>
			<div class="room-table-container">
				<table class="room-table">
					<thead>
						<tr>
							<th>Номер аудитории</th>
							<th>Координаты</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="room in filteredRooms" :key="room.id">
							<td>{{ room.number }}</td>
							<td>{{ room.points && room.points.length > 0
								? room.points
								: "Координаты отсутствуют" }}
							 </td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<div class="right-panel">
			<label>
				<input type="checkbox" v-model="showMap" />
				Включить карту
			</label>
			<div v-if="showMap" class="map-container">
				<!-- <svg></svg> -->
				<!-- <p v-else>Выберите корпус и этаж для отображения карты</p> -->
				<p>пока что нету, не успел еще :(</p>
			</div>
		</div>
	</div>
</template>

<script>
import axios from "../axios";

export default {
	data() {
		return {
			showMap: false,
			buildings: [],
			classrooms: [],
			selectedBuilding: null,
			selectedBuildingShortName: "",
			filteredBuildings: [],
			selectedFloor: null,
			availableFloors: [],
			filteredRooms: [],
		}
	},
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
		async fetchBuildings() {
			try {
				const res = await axios.get("/buildings");
				this.buildings = res.data.map((el) => ({
					buildingId: el.Id,
					name: el.Name,
					shortname: el.ShortName,
				}));
			} catch (error) {
				console.error("Ошибка загрузки корпусов: ", error);
			}
		},

		async fetchBuildingCoordinates(buildingId) {
			try {
				const res = await axios.get(
					`/buildingcoordinates/buildingId/${buildingId}/floor/1`
				);
				const buildingData = res.data ? JSON.parse(res.data) : null;

				if (buildingData && Array.isArray(buildingData.points)) {
					this.buildings = this.buildings.map((building) => {
						if (building.buildingId === buildingId) {
							return {
								...building,
								points: buildingData.points,
							};
						}
						return building;
					});

					// фильтрация зданий
					this.filteredBuildings = this.buildings.filter(
						(building) => building.buildingId === this.selectedBuilding
					);
					return true;
				} else {
					console.warn("Неверные данные для координат корпуса:", buildingData);
					return false;
				}
			} catch (error) {
				console.error("Ошибка загрузки координат корпусов: ", error);
			}
		},

		async fetchClassrooms(buildingId) {
			try {
				const res = await axios.get(`/rooms/buildingId/${buildingId}`);
				this.classrooms = res.data.map((el) => {
					const coords = el.Coordinates
						? JSON.parse(el.Coordinates.slice(1, -1)).points
						: null;
					return {
						id: el.Id,
						name: el.Name,
						floor: el.Floor,
						number: `${el.Number}/${this.selectedBuildingShortName}`,
						points: coords,
						buildingId,
					};
				});

				// извлечение этажей
				this.extractFloors();
			} catch (error) {
				console.error("Ошибка загрузки аудиторий: ", error);
			}
		},

		extractFloors() {
			// извлечение этажей из аудиторий
			this.availableFloors = [
				...new Set(this.classrooms.map((classroom) => classroom.floor)),
			].sort((a, b) => a - b);
			// console.log("Доступные этажи: ", this.availableFloors);
		},

		updateRooms() {
			if (this.selectedBuilding) {
				this.fetchClassrooms(this.selectedBuilding);
				this.filteredRooms = this.classrooms.filter(
					(room) =>
						room.buildingId === this.selectedBuilding &&
						room.floor === this.selectedFloor
				);
			}
		}
	},
	mounted() {
		// при инициализации компонента
		this.fetchBuildings();
		// console.log(this.buildings);
	},
	watch: {
		selectedBuilding(newBuildingId) {
			const selectedBuilding = this.buildings.find(
				(building) => building.buildingId === newBuildingId
			);

			this.selectedBuildingShortName = selectedBuilding
				? selectedBuilding.shortname
				: "";

			this.selectedFloor = null;

			this.updateRooms();
		},
		selectedFloor() {
			this.updateRooms();
		},
	},
};
</script>

<style scoped>
.container {
	display: flex;
	height: 100vh;
}

.logout-button {
	position: fixed;
	top: 10px;
	right: 10px;
	z-index: 1000;
	transition: background-color 0.3s ease; /* Анимация при наведении */
}

.logout-button:hover {
  background-color: #e7d0d1; /* Более тёмный оттенок при наведении */
}

.left-panel {
	flex: 1;
	padding: 20px;
	/* background-color: #f4f4f4; */
	border-right: 1px colid #ccc;
}

.selectors {
	margin-bottom: 20px;
}

.room-table-container {
	max-height: 90vh;
	/* Ограничиваем высоту таблицы */
	overflow-y: auto;
	/* Вертикальная прокрутка */
	border: 1px solid #ccc;
	/* Граница для визуального отделения */
}

.room-table {
	width: 100%;
	border-collapse: collapse;
}

.room-table th {
	position: sticky;
	/* Закрепляем заголовок таблицы */
	top: 0;
	/* Позиция заголовка относительно контейнера */
	background-color: #f9f9f9;
	/* Цвет фона заголовка */
	z-index: 1;
	/* Повышаем приоритет отображения */
	border: 1px solid #ccc;
	/* Граница заголовка */
	padding: 8px;
	text-align: left;
}

.room-table td {
	border: 1px solid #ccc;
	/* Границы для ячеек */
	padding: 8px;
	text-align: left;
}

.selectors label {
	display: block;
	margin-bottom: 10px;
}

.room-table th {
	background-color: #f0f0f0;
}

.right-panel {
	flex: 1;
	padding: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

/* .map-container {
	margin-top: 20px;
	border: 1px colid #ccc;
	width: 100%;
	height: 500px;
	display: flex;
	align-items: center;
	justify-content: center;
} */
</style>