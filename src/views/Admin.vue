<!-- src/views/Admin.vue -->
<template>
	<div class="container">
		<!-- следующая строка будет удалена при внедрении -->
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
					<button @click="sendCoordinatesToDatabase" class="send-coords">Отправить изменения</button>
				</label>
			</div>
			<div class="room-table-container">
				<table class="room-table">
					<thead>
						<tr>
							<th>Номер</th>
							<th>Координаты аудитории</th>
							<th>Действия</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="room in filteredRooms"
							:key="room.id"
							:class="{ 'active-room': editingRoom === room.id, 'unsaved-room': editedRooms.has(room.id) }">
							<td>{{ room.number }}</td>
							<td>
								<div v-if="editingRoom === room.id">
									<div v-for="(point, index) in getEditingRoom().points" :key="index" class="point-edit">
										<input v-model.number="point.x" type="number" class="coord-input" @change="updateRoom(getEditingRoom())" />
										<input v-model.number="point.y" type="number" class="coord-input" @change="updateRoom(getEditingRoom())" />
										<button @click="removePoint(getEditingRoom(), index)" class="remove-point-btn">Удалить</button>
									</div>
									<button @click="addPoint(getEditingRoom())" class="add-point-btn">Добавить вершину</button>
								</div>
								<div v-else>
									{{ room.points && room.points.length > 0
										? room.points.map(p => `(${p.x},${p.y})`).join(';')
										: "Координаты отсутствуют" }}
								</div>
								<!-- <template v-if="!room.isEditing">
									{{ room.points && room.points.length > 0
										? room.points.map(p => `(${p.x},${p.y})`).join(';')
										: "Координаты отсутствуют" }}
								</template>
								<template v-else>
									<div v-for="(point, index) in room.points" :key="index" class="point-edit">
										<input v-model.number="point.x" type="number" class="coord-input" @change="updateRoom(room)" />
										<input v-model.number="point.y" type="number" class="coord-input" @change="updateRoom(room)" />
										<button @click="removePoint(room, index)" class="remove-point-btn">Удалить</button>
									</div>
									<button @click="addPoint(room)" class="add-point-btn">Добавить вершину</button>
								</template> -->
							</td>
							<td>
								<button
									v-if="editingRoom === room.id"
									@click="finishEditing"
									class="edit-btn"
								>Завершить</button>
								<button
									v-else
									@click="startEditing(room)"
									class="edit-btn"
								>Редактировать</button>
								<!-- <button @click="toggleEdit(room)" class="edit-btn">
									{{ room.isEditing ? 'Сохр.' : 'Редакт.' }}
								</button> -->
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
				<svg :width="svgWidth" :height="svgHeight"
					@wheel="handleZoom"
					@mousedown="startPan"
					@mousemove="handleMouseMove"
					@mouseup="handleMouseUp"
					@click="handleMapClick">
					<!-- группа масштабирования и перемещения -->
					<g :transform="'translate(' + panX + ', ' + panY + ') scale(' + scale + ')'">
						<!-- корпус только с заливкой -->
						<g v-for="(building, index) in filteredBuildings" :key="index">
							<polygon
								:points="formatPoints(building.points)"
								:fill="'gray'"
								stroke-width="0" />
						</g>
						<!-- аудитории -->
						<g v-for="(classroom, index) in filteredRoomsCoords" :key="'classroom' + index">
							<polygon
								:points="formatPoints(classroom.points)"
								:fill="getRoomFillColor(classroom)"
								stroke="blue"
								stroke-width="1" />
							<text
								:x="calculateText(classroom.points).x"
								:y="calculateText(classroom.points).y"
								text-anchor="middle"
								alignment-baseline="middle"
								font-family="Arial"
								font-size="14"
								fill="black"
								style="user-select: none;">
								{{ classroom.number }}
							</text>
						</g>
						<!-- корпус только с контуром, поверх всего -->
						<g v-for="(building, index) in filteredBuildings" :key="'outline' + index">
							<polygon
								:points="formatPoints(building.points)"
								:fill="'transparent'"
								stroke="black"
								stroke-width="2" />
						</g>
						<!-- отображение аудитории и ее вершин при редактировании -->
						<g v-if="editingRoom && getEditingRoomPoints().length > 0">
							<polygon
								:points="formatPoints(getEditingRoomPoints())"
								fill="rgba(255, 0, 0, 0.2)"
								stroke="red"
								stroke-width="2"
								stroke-dasharray="5, 5"
							/>
							<circle
								v-for="(point, index) in getEditingRoomPoints()"
								:key="'point' + index"
								:cx="point.x"
								:cy="point.y"
								r="4"
								fill="red"
							/>
						</g>
						<!-- полигоны для регистрации нажатий по аудиториям (для части для юзеров, работает) -->
						<!-- <g v-for="(classroom, index) in filteredRoomsCoords" :key="'classroom' + index">
							<polygon
								:points="formatPoints(classroom.points)"
								fill-opacity="0"
								stroke-opacity="0"
								stroke-width="1"
								@click="console.log('foo bar');" />
						</g> -->
					</g>
				</svg>
				<div class="cursor-coordinates">
					{{ cursorX }}, {{ cursorY }}
				</div>
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
			filteredRoomsCoords: [],
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
			editingRoom: null,
			editedRooms: new Set(),
			cursorX: 0,
			cursorY: 0,
		}
	},
	// следующий метод будет удален при внедрении
	created() {
		const isAuthenticated = localStorage.getItem("authenticated") === "true";
		const loginTimestamp = parseInt(localStorage.getItem("loginTimestamp"), 10);
		const sessionTimeout = parseInt(localStorage.getItem("sessionTimeout"), 10);
		const now = Date.now();

		if (!isAuthenticated || isNaN(loginTimestamp) || now - loginTimestamp > sessionTimeout) {
			this.logout();
		}
	},
	methods: {
		// следующий метод будет удален при внедрении
		logout() {
			localStorage.removeItem("authenticated");
			localStorage.removeItem("loginTimestamp");
			localStorage.removeItem("sessionTimeout");
			this.$router.push("/login");
		},

		formatPoints(points) {
			if (!Array.isArray(points) || points.length === 0) {
                console.warn("Неверные данные для points:", points);
                return "";
            }
            // console.log(points);
            return points
                .map(point => {
                    // Проверка на наличие координат x и y
                    if (point && typeof point.x === 'number' && typeof point.y === 'number' && !isNaN(point.x) && !isNaN(point.y)) {
                        return `${point.x},${point.y}`;
                    } else {
                        console.warn("Неверная точка:", point);
                        return null;
                    }
                })
                .filter(Boolean) // Убираем все null значения
                .join(" ");
		},

		getRoomFillColor(room) {
			return this.editedRooms.has(room.id)
				? "#FFDBBB"
				: this.getFillColor(room.name);
		},

		getFillColor(name) {
            if (name) {
                if (name.includes("Лестница")) return "LightCyan";
                if (name.includes("Муж")) return "SkyBlue";
                if (name.includes("Жен")) return "Pink";
                return "lightblue";
            }
            return "lightblue";
        },

		calculateText(points) {
			// console.log(points);
			const polylabelCoordinates = points.map(point => [point.x, point.y]);
			// console.log(polylabelCoordinates);
			const centerPoint = polylabel([polylabelCoordinates], 1.0);
			// console.log(centerPoint);
			return { x: centerPoint[0], y: centerPoint[1] };
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
					// console.log(el.Coordinates);
					const coords = el.Coordinates
						? JSON.parse(
							el.Coordinates[0] === '"'
								? el.Coordinates.slice(1, -1)
								: el.Coordinates
						).points
						: null;
					return {
						id: el.Id,
						// name: el.Name, // бесполезные для админки данные
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

		async sendCoordinatesToDatabase() {
			try {
				for (const roomId of this.editedRooms) {
					const room = this.filteredRooms.find(r => r.id === roomId);
					if (room) {
						const payload = {
							Id: room.id,
							// Coordinates: JSON.stringify(room.points)
							// Coordinates: `"${JSON.stringify({points: room.points})}"`
							Coordinates: JSON.stringify({points: room.points})
						};
						console.log(payload);
						const response = await axios.post('/SaveRoomCoordinates', payload);

						response.status === 200
							? console.log('координаты успешно отправлены:', response.data)
							: console.log('что-то пошло не так:', response.statusText);
					}
				}
				this.editedRooms.clear();
				alert('Координаты успешно отправлены');
			} catch (error) {
				console.error('ошибка при отправке коориднат:', error);
				alert('ошибка при отпарвке координат');
			}
		},

		updateRooms() {
			if (this.selectedBuilding) {
				this.fetchClassrooms(this.selectedBuilding);
				this.fetchBuildingCoordinates(this.selectedBuilding);
				this.filteredRooms = this.classrooms.filter(
					(room) =>
						room.buildingId === this.selectedBuilding &&
						room.floor === this.selectedFloor
				);
				this.filteredRoomsCoords = this.filteredRooms.filter(
					(room) => Array.isArray(room.points)
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
		},

		startEditing(room) {
			this.editingRoom = room.id;
			if (!Array.isArray(room.points)) {
				room.points = [];
			}
		},

		finishEditing() {
			const editedRoom = this.getEditingRoom();
			if (editedRoom) {
				const index = this.filteredRoomsCoords.findIndex(r => r.id === editedRoom.id);
				index !== -1
					? this.filteredRoomsCoords[index] = { ...editedRoom }
					: this.filteredRoomsCoords.push({ ...editedRoom });
			}
			this.editingRoom = null;
		},

		getEditingRoomPoints() {
			const room = this.filteredRooms.find(r => r.id === this.editingRoom);
			// console.log(room.points);
			return (room && Array.isArray(room.points)) ? room.points : [];
		},

		getEditingRoom() {
			return this.filteredRooms.find(r => r.id === this.editingRoom) || null;
		},

		handleMapClick(event) {
			if (!this.editingRoom || this.isPanning) return;

			const room = this.getEditingRoom();
			if (!room) return;

			const rect = event.currentTarget.getBoundingClientRect();
			const x = Math.round((event.clientX - rect.left - this.panX) / this.scale);
			const y = Math.round((event.clientY - rect.top - this.panY) / this.scale);

			if (!Array.isArray(room.points)) {
				room.points = [];
			}

			room.points.push({ x, y });
			this.updateRoom(room);
		},

		handleMouseMove(event) {
			this.panMap(event);
			this.updateCursorCoordinates(event);
		},

		handleMouseUp(event) {
			this.isPanning
				? this.endPan()
				: this.handleMapClick(event);
		},

		toggleEdit(room) {
			if (room.isEditing) {
				this.editedRooms.add(room.id);
			}
			room.isEditing = !room.isEditing;
		},

		addPoint(room) {
			if (!Array.isArray(room.points)) {
				room.points = [];
			}
			room.points.push({ x: 0, y: 0 });
			this.updateRoom(room);
		},

		removePoint(room, index) {
			room.points.splice(index, 1);
			this.updateRoom(room);
		},

		updateRoom(room) {
			this.editedRooms.add(room.id);
		},

		updateCursorCoordinates(event) {
			const rect = event.currentTarget.getBoundingClientRect();
			this.cursorX = Math.round((event.clientX - rect.left - this.panX) / this.scale);
			this.cursorY = Math.round((event.clientY - rect.top - this.panY) / this.scale);
		},
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

.send-coords {
	margin-left: 10px;
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

.cursor-coordinates {
	position: absolute;
	right: 0;
	bottom: 0;
	background-color: rgba(255, 255, 255, 0.7);
	padding: 5px 10px;
	font-size: 14px;
	user-select: none;
}

.unsaved-room {
	background-color: rgba(255, 165, 0, 0.2);
}
</style>
