<template>
	<div class="container">
		<button class="logout-button" @click="logout">Выйти</button>
		<div class="left-panel">
			<div class="selectors">
				<label>
					<select v-model="selectedBuilding" @change="updateRooms" class="select">
						<option value="" disabled>Корпус...</option>
						<option v-for="building in buildings" :key="building.buildingId" :value="building.buildingId">
							{{ building.shortname }} - {{ building.name }}
						</option>
					</select>
					<select v-model="selectedFloor" @change="updateRooms" class="bottom-selector select">
						<option value="" disabled>Этаж...</option>
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
							<th>Номер</th>
							<th>Координаты аудитории</th>
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
			<!-- <label>
				<input type="checkbox" v-model="showMap" />
				Включить карту
			</label> -->
			<div v-if="showMap" class="map-container">
				<svg :width="svgWidth" :height="svgHeight" @wheel="handleZoom" @mousedown="startPan" @mousemove="panMap"
					@mouseup="endPan">
					<g :transform="'translate(' + panX + ', ' + panY + ') scale(' + scale + ')'">
						<!-- проверка перемещения карты и работоспособности центрирования текста -->
						<rect x="50" y="50" width="100" height="100" fill="black" />
						<polygon
							points="200,50 400,50 400,100 250,100 250,200 200,200"
							fill="blue"
							stroke="black"
							stroke-width="2" />
							<circle
							:cx="centerX"
							:cy="centerY"
							r="5"
							fill="darkblue" />
						<text
							:x="centerX"
							:y="centerY"
							text-anchor="middle"
							alignment-baseline="middle"
							font-family="Arial"
							font-size="14"
							fill="white">
							Текст
						</text>
					</g>
				</svg>
				<!-- <p v-else>Выберите корпус и этаж для отображения карты</p> -->
				<!-- <p>пока что нету, не успел еще :(</p> -->
			</div>
		</div>
	</div>
</template>

<script>
import axios from "../axios";
import polylabel from "polylabel";

export default {
	data() {
		return {
			// showMap: false,
			showMap: true,
			buildings: [],
			classrooms: [],
			selectedBuilding: '',
			selectedBuildingShortName: "",
			filteredBuildings: [],
			selectedFloor: '',
			availableFloors: [],
			filteredRooms: [],
			scale: 1,
			panX: 0,
			panY: 0,
			startX: 0,
			startY: 0,
			isPanning: false,
			isDragging: false,
			dragThreshold: 5,
			initialTouchDistance: null,
			initialScale: 1,
			minScale: 0.2,
			maxScale: 5,
			svgWidth: "100%",
			svgHeight: "100%",
			// для проверки центрирования текста
			centerX: null,
			centerY: null,
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
						// name: el.Name,
						floor: el.Floor,
						num_sort: el.Number,
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
				this.sortRooms();
			}
		},

		sortRooms() {
			this.filteredRooms.sort((a, b) => {
				const regex = /^(\d+)([а-яА-Яa-zA-Z]*)$/;

				const parseRoomNumber = (number) => {
					const match = number.match(regex);
					if (match) {
						const numericPart = parseInt(match[1], 10);
						const alphaPart = match[2] || "";
						return { numericPart, alphaPart };
					}
					return { numericPart: Number.MAX_SAFE_INTEGER, alphaPart: "" };
				};

				const roomA = parseRoomNumber(a.num_sort);
				const roomB = parseRoomNumber(b.num_sort);

				if (roomA.numericPart !== roomB.numericPart) {
					return roomA.numericPart - roomB.numericPart;
				}
				return roomA.alphaPart.localeCompare(roomB.alphaPart, "ru");
			});
		},

		handleZoom(event) {
			event.preventDefault();
			const scaleBy = 1.1;

			const direction = event.deltaY > 0 ? -1 : 1;
			const oldScale = this.scale;
			const newScale = Math.max(this.minScale, Math.min(oldScale * (direction > 0 ? scaleBy : 1 / scaleBy), this.maxScale));

			const rect = event.currentTarget.getBoundingClientRect();
			const mouseX = (event.clientX - rect.left - this.panX) / oldScale;
			const mouseY = (event.clientY - rect.top - this.panY) / oldScale;

			this.panX -= (mouseX * newScale - mouseX * oldScale);
			this.panY -= (mouseY * newScale - mouseY * oldScale);

			this.scale = newScale;
		},

		startPan(event) {
			this.isPanning = true;
			this.isDragging = false;
			this.startX = event.clientX - this.panX;
			this.startY = event.clientY - this.panY;
		},

		panMap(event) {
			if (this.isPanning) {
				const deltaX = Math.abs(event.clientX - this.startX);
				const deltaY = Math.abs(event.clientY - this.startY);

				if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
					this.isDragging = true;
				}

				this.panX = event.clientX - this.startX;
				this.panY = event.clientY - this.startY;
			}
		},

		endPan() {
			this.isPanning = false;
		}
	},
	mounted() {
		// при инициализации компонента
		this.fetchBuildings();
		// console.log(this.buildings);

		// проверка работоспособности центрирования текста
		const p = polylabel([[[200,50],[400,50],[400,100],[250,100],[250,200],[200,200]]], 1.0);
		// console.log(p);
		this.centerX = p[0];
		this.centerY = p[1];
	},
	watch: {
		selectedBuilding(newBuildingId) {
			const selectedBuilding = this.buildings.find(
				(building) => building.buildingId === newBuildingId
			);

			this.selectedBuildingShortName = selectedBuilding
				? selectedBuilding.shortname
				: "";

			this.selectedFloor = '';

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
	transition: background-color 0.3s ease;
}

.logout-button:hover {
	background-color: #e7d0d1;
}

.left-panel {
	flex: 1;
	padding: 20px;
	padding-right: 10px;
	/* background-color: #f4f4f4; */
	/* border-right: 1px solid #ccc; */
}

.selectors {
	margin-bottom: 20px;
}

.select {
	width: 200px;
}

.room-table-container {
	max-height: calc(100vh - 85px);
	overflow-y: auto;
	/* border: 1px solid #ccc; */
}

.room-table {
	width: 100%;
	border-collapse: collapse;
}

.room-table th {
	position: sticky;
	top: 0;
	background-color: #f9f9f9;
	z-index: 1;
	border: 1px solid #ccc;
	padding: 8px;
	text-align: left;
}

.room-table td {
	border: 1px solid #ccc;
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
	padding-left: 10px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.map-container {
	/* margin-top: 20px; */
	border: 1px solid #ccc;
	width: 100%;
	height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
}

.bottom-selector {
	margin-top: 5px;
	margin-left: 5px;
}
</style>