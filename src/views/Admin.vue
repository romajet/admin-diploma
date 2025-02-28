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
				</label>
			</div>
			<div class="room-table-container">
				<table class="room-table">
					<thead>
						<tr>
							<th>Имя</th>
							<th>Координаты</th>
							<th>Действия</th>
						</tr>
					</thead>
					<tbody>
						<!-- корпус -->
						<tr v-if="selectedFloor || selectedFloor === 0"
							:class="{ 'active-room': editingFloor, 'unsaved-room': isFloorUnsaved }">
							<td>Этаж</td>
							<td>
								<div v-if="editingFloor">
									<div v-for="(point, index) in getEditingFloorPoints()" :key="index"
										class="point-edit">
										<span class="point-number">{{ index + 1 }}. </span>
										<input v-model.number="point.x" type="number" class="coord-input"
											@change="updateFloor()" />
										<input v-model.number="point.y" type="number" class="coord-input"
											@change="updateFloor()" />
										<button @click="removeFloorPoint(index)" class="remove-point-btn"
											title="Удалить вершину">
											<IconMinus class="btn-icons" />
										</button>
									</div>
									<button @click="addFloorPoint()" class="add-point-btn" title="Добавить вершину">
										<IconPlus class="btn-icons" />
									</button>
								</div>
								<div v-else>
									{{getEditingFloorPoints() && getEditingFloorPoints().length > 0
										? getEditingFloorPoints().map(p => `(${p.x},${p.y})`).join(';')
										: 'координаты отсутствуют'}}
								</div>
							</td>
							<td class="action-cell">
								<button v-if="editingFloor" @click="finishEditingFloor" class="edit-btn"
									title="Сохранить">
									<IconDeviceFloppy />
								</button>
								<button v-if="editingFloor" @click="cancelEditingFloor" class="cancel-btn"
									title="Отменить изменения">
									<IconArrowBackUp />
								</button>
								<button v-else @click="startEditingFloor" class="edit-btn" title="Редактировать">
									<IconEdit />
								</button>
							</td>
						</tr>
						<!-- аудитории -->
						<tr v-for="room in filteredRooms" :key="room.id"
							:class="{ 'active-room': editingRoom === room.id, 'unsaved-room': editedRooms.has(room.id) }">
							<td>{{ room.number }}</td>
							<td>
								<div v-if="editingRoom === room.id">
									<div v-for="(point, index) in getEditingRoom().points" :key="index"
										class="point-edit">
										<span class="point-number">{{ index + 1 }}. </span>
										<input v-model.number="point.x" type="number" class="coord-input"
											@change="updateRoom(getEditingRoom())" />
										<input v-model.number="point.y" type="number" class="coord-input"
											@change="updateRoom(getEditingRoom())" />
										<button @click="removePoint(getEditingRoom(), index)" class="remove-point-btn"
											title="Удалить вершину">
											<IconMinus class="btn-icons" />
										</button>
									</div>
									<button @click="addPoint(getEditingRoom())" class="add-point-btn"
										title="Добавить вершину">
										<IconPlus class="btn-icons" />
									</button>
								</div>
								<div v-else>
									{{room.points && room.points.length > 0
										? room.points.map(p => `(${p.x},${p.y})`).join(';')
										: "Координаты отсутствуют"}}
								</div>
							</td>
							<td class="action-cell">
								<button v-if="editingRoom === room.id" @click="finishEditing" class="edit-btn"
									title="Сохранить">
									<IconDeviceFloppy />
								</button>
								<button v-if="editingRoom === room.id" @click="cancelEditing" class="cancel-btn"
									title="Отменить изменения">
									<IconArrowBackUp />
								</button>
								<button v-else @click="startEditing(room)" class="edit-btn" title="Редактировать">
									<IconEdit />
								</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<div class="right-panel">
			<div class="map-container">
				<div class="map-controls" v-if="showMapControls">
					<label style="user-select: none;">
						Подложка
						<input type="checkbox" v-model="showBackground" />
					</label>
					<!-- <label title="Масштаб подложки">
						<span class="material-icons-outlined btn-icons"
							style="user-select: none;">zoom_outwallpaper</span>
						<input type="range" v-model="backgroundScale" min="0.1" max="1" step="0.05" />
						<input type="number" v-model="backgroundScale" min="0.1" max="1" step="0.01" />
					</label> -->
					<label title="Прозрачность подложки">
						<IconDropCircle />
						<IconPhoto />
						<input type="range" v-model="backgroundOpacity" min="0" max="1" step="0.1" />
					</label>
					<label title="Прозрачность элеметов карты">
						<IconDropCircle />
						<IconMap />
						<input type="range" v-model="elementsOpacity" min="0" max="1" step="0.1" />
					</label>
					<label title="Смещение подложки по оси абсцисс (X) (больше значение - левее подложка)">
						<IconArrowsHorizontal />
						<input type="number" v-model.number="backgroundOffsetX" />
					</label>
					<label title="Смещение подложки по оси ординат (Y) (больше значение - ниже подложка)">
						<IconArrowsVertical />
						<input type="number" v-model.number="backgroundOffsetY" />
					</label>
					<label>
						<b>Зажатие Alt отключает притягивание</b>
					</label>
					<button @click="toggleMapControls" class="toggle-controls-btn" title="Скрыть настройки">
						<IconEyeClosed />
					</button>
					<button @click="() => { this.panX = 10; this.panY = 10; this.scale = 1; }"
						class="default-position-btn" title="Положение по умолчанию">
						<IconFrame />
					</button>
				</div>
				<div class="map-controls-enable" v-else>
					<button @click="toggleMapControls" class="toggle-controls-btn" title="Показать настройки">
						<IconEye />
					</button>
				</div>
				<svg :width="svgWidth" :height="svgHeight" @wheel="handleZoom" @mousedown="startPan"
					@mousemove="handleMouseMove" @mouseup="handleMouseUp" @click="handleMapClick"
					@contextmenu="preventContextMenu">
					<!-- группа масштабирования и перемещения -->
					<g :transform="'translate(' + panX + ', ' + panY + ') scale(' + scale + ')'">
						<!-- начальная точка координат -->
						<circle cx="0" cy="0" r="4" fill="white" stroke="blue" stroke-width="2" />
						<text x="-30" y="-10" fill="blue" font-size="12" font-weight="bold">(0, 0)</text>
						<!-- подложка -->
						<image v-if="showBackground && backgroundImage" :href="backgroundImage" :x="backgroundOffsetX"
							:y="backgroundOffsetY" :width="backgroundWidth * backgroundScale"
							:height="backgroundHeight * backgroundScale" preserve-aspect-ratio="none"
							:opacity="backgroundOpacity" />
						<!-- заливка корпуса -->
						<g :opacity="elementsOpacity">
							<g v-for="(building, index) in filteredBuildings" :key="index">
								<polygon :points="formatPoints(building.points)" :fill="'gray'" stroke-width="0" />
							</g>
						</g>
						<!-- аудитории -->
						<g>
							<g v-for="(classroom, index) in filteredRoomsCoords" :key="'classroom' + index">
								<polygon :points="formatPoints(classroom.points)" :fill="getRoomFillColor(classroom)"
									stroke="blue" stroke-width="1" :opacity="elementsOpacity" />
								<text :x="calculateText(classroom.points).x" :y="calculateText(classroom.points).y"
									text-anchor="middle" alignment-baseline="middle" font-family="Arial" font-size="14"
									fill="black" style="user-select: none;" :opacity="elementsOpacity > 0 ? 1 : 0">
									{{ classroom.number }}
								</text>
							</g>
						</g>
						<!-- корпус только с контуром, поверх всего -->
						<g :opacity="elementsOpacity">
							<g v-for="(building, index) in filteredBuildings" :key="'outline' + index">
								<polygon :points="formatPoints(building.points)" :fill="'transparent'" stroke="black"
									stroke-width="2" />
							</g>
						</g>
						<!-- отображение вершин и граней притягивания -->
						<circle v-if="snapPoint" :cx="snapPoint.x" :cy="snapPoint.y" r="6" fill-="none" stroke="green"
							stroke-width="2" />
						<line v-if="snapEdgeVertical" :x1="snapEdgeVertical.x" :y1="-1000" :x2="snapEdgeVertical.x"
							:y2="3000" stroke="green" stroke-width="2" stroke-dasharray="5, 5" />
						<line v-if="snapEdgeHorizontal" :x1="-1000" :y1="snapEdgeHorizontal.y" :x2="3000"
							:y2="snapEdgeHorizontal.y" stroke="green" stroke-width="2" stroke-dasharray="5, 5" />
						<!-- отображение вершин и граней аудитории при редактировании -->
						<g v-if="editingRoom && getEditingRoomPoints().length > 0">
							<polygon :points="formatPoints(getEditingRoomPoints())" fill="rgba(255, 0, 0, 0.2)"
								stroke="red" stroke-width="2" stroke-dasharray="5, 5" />
							<g v-for="(point, index) in getEditingRoomPoints()" :key="'point' + index">
								<circle :cx="point.x" :cy="point.y" r="4" fill="red"
									@click.stop="removeRoomPoint(index)" style="cursor: pointer;" />
								<text :x="point.x + 10" :y="point.y - 10" fill="red" font-size="12" font-weight="bold"
									style="user-select: none;">{{ index + 1 }}</text>
							</g>
						</g>
						<!-- отображение вершин и граней корпуса при редактировании -->
						<g v-if="editingFloor && getEditingFloorPoints().length > 0">
							<polygon :points="formatPoints(getEditingFloorPoints())" fill="rgba(0, 255, 0, 0.2)"
								stroke="green" stroke-width="2" stroke-dasharray="5,5" />
							<g v-for="(point, index) in getEditingFloorPoints()" :key="'floorPoint' + index">
								<circle :cx="point.x" :cy="point.y" r="4" fill="green" />
								<text :x="point.x + 10" :y="point.y - 10" fill="green" font-size="12"
									font-weight="bold">{{ index + 1 }}</text>
							</g>
						</g>
					</g>
				</svg>
				<div class="cursor-coordinates">
					координаты<br>
					курсора: {{ cursorX }}, {{ cursorY }}<br>
					точки: {{ realX }}, {{ realY }}
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { useToast } from "vue-toastification";
import axios from "../axios";
import polylabel from "polylabel";
import {
	IconArrowBackUp,
	IconArrowsHorizontal,
	IconArrowsVertical,
	IconDeviceFloppy,
	IconDropCircle,
	IconEdit,
	IconEye,
	IconEyeClosed,
	IconFrame,
	IconMap,
	IconMinus,
	IconPhoto,
	IconPlus
} from "@tabler/icons-vue";

export default {
	components: {
		IconMinus,
		IconPlus,
		IconDeviceFloppy,
		IconDropCircle,
		IconMap,
		IconPhoto,
		IconArrowsHorizontal,
		IconArrowsVertical,
		IconFrame,
		IconEye,
		IconEyeClosed,
		IconEdit,
		IconArrowBackUp,
	},
	data() {
		return {
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
			panX: 10,
			panY: 10,
			startX: 0,
			startY: 0,
			isPanning: false,
			isDragging: false,
			dragThreshold: 5,

			minScale: 0.2,
			maxScale: 5,

			svgWidth: "100%",
			svgHeight: "100%",

			editingRoom: null,
			editedRooms: new Set(),
			cursorX: 0,
			cursorY: 0,
			realX: 0,
			realY: 0,

			snapPoint: null,
			snapEdgeVertical: null,
			snapEdgeHorizontal: null,
			snapThreshold: 10,

			originalRoomPoints: null,
			originalFloorPoints: null,
			isFloorUnsaved: false,
			editingFloor: false,

			clickStartX: 0,
			clickStartY: 0,
			clickThreshold: 10,

			showBackground: true,
			backgroundImage: null,
			backgroundWidth: 0,
			backgroundHeight: 0,
			elementsOpacity: 0.5,
			backgroundOpacity: 0.4,
			backgroundOffsetX: 0,
			backgroundOffsetY: 0,
			showMapControls: true,
			backgroundScale: 0.25,

			toast: null,

			isAltPressed: false,
		}
	},
	created() {
		this.toast = useToast();

		// следующая часть метода будет удалена при внедрении
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
			this.toast.info("Выход по истечении 30 минут или по кнопке");
		},

		formatPoints(points) {
			if (!Array.isArray(points) || points.length === 0) {
				// console.warn("Неверные данные для points:", points);
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

		async fetchBuildingCoordinates(buildingId, selectedFloor) {
			try {
				const res = await axios.get(
					`/buildingcoordinates/buildingId/${buildingId}/floor/${selectedFloor}`
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
				this.availableFloors = [
					...new Set(this.classrooms.map((classroom) => classroom.floor)),
				].sort((a, b) => a - b);
				// console.log("Доступные этажи: ", this.availableFloors);
			} catch (error) {
				console.error("Ошибка загрузки аудиторий: ", error);
			}
		},

		updateRooms() {
			if (this.selectedBuilding) {
				this.fetchClassrooms(this.selectedBuilding);
				this.filteredBuildings = [];
				if (this.selectedFloor) {
					this.fetchBuildingCoordinates(this.selectedBuilding, this.selectedFloor);
					this.fetchBackgroundImage(this.selectedBuilding, this.selectedFloor);
				}
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

		preventContextMenu(event) {
			event.preventDefault();
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
			this.clickStartX = event.clientX;
			this.clickStartY = event.clientY;
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

		saveCurrentEditing() {
			if (this.editingFloor) {
				this.finishEditingFloor();
			} else if (this.editingRoom) {
				this.finishEditing();
			}
		},

		startEditing(room) {
			this.saveCurrentEditing();
			this.editingRoom = room.id;
			this.editingFloor = false;
			if (!Array.isArray(room.points)) {
				room.points = [];
			}
			this.originalRoomPoints = JSON.parse(JSON.stringify(room.points));
		},

		async finishEditing() {
			const editedRoom = this.getEditingRoom();
			if (editedRoom && this.areCoordinatesChanged(editedRoom)) {
				if (!Array.isArray(editedRoom.points) || editedRoom.points.length === 0) {
					alert('Нельзя сохранить пустые координаты');
					return;
				}
				try {
					const payload = {
						Id: editedRoom.id,
						Coordinates: JSON.stringify({ points: editedRoom.points })
					};
					await axios.post('/saveRoomCoordinates', payload);

					// обновление filteredRoomsCoords
					const index = this.filteredRoomsCoords.findIndex(r => r.id === editedRoom.id);
					index !== -1
						? this.filteredRoomsCoords[index] = { ...editedRoom }
						: this.filteredRoomsCoords.push({ ...editedRoom });

					const classroomIndex = this.classrooms.findIndex(r => r.id === editedRoom.id);
					if (classroomIndex !== -1) {
						this.classrooms[classroomIndex] = { ...editedRoom };
					}

					// this.editedRooms.delete(editedRoom.id);

					this.toast.success('Координаты успешно отправлены');
				} catch (error) {
					console.error('ошибка при отправке координат: ', error);
					this.toast.error('произошла ошибка при отправке координат');
					// alert('произошла ошибка при отправке координат');
				}
			} else {
				// alert('нет изменений для отправки');
				this.toast.error('нет изменений для отправки');
			}
			this.editingRoom = null;
			this.originalRoomPoints = null;
		},

		cancelEditing() {
			const editingRoom = this.getEditingRoom();
			if (editingRoom) {
				editingRoom.points = JSON.parse(JSON.stringify(this.originalRoomPoints));
				const roomIndex = this.filteredRooms.findIndex(r => r.id === this.editingRoom);
				if (roomIndex !== -1) {
					this.filteredRooms[roomIndex] = { ...editingRoom };
				}

				// Update filteredRoomsCoords
				const coordsIndex = this.filteredRoomsCoords.findIndex(r => r.id === this.editingRoom);
				if (coordsIndex !== -1) {
					this.filteredRoomsCoords[coordsIndex] = { ...editingRoom };
				} else if (Array.isArray(editingRoom.points)) {
					this.filteredRoomsCoords.push({ ...editingRoom });
				}

				this.editedRooms.delete(this.editingRoom);
			}
			this.editingRoom = null;
			this.originalRoomPoints = null;
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
			// if (!this.editingRoom || this.isPanning) return;
			if ((!this.editingRoom && !this.editingFloor) || this.isDragging) return;

			const rect = event.currentTarget.getBoundingClientRect();
			let x = Math.round((event.clientX - rect.left - this.panX) / this.scale);
			let y = Math.round((event.clientY - rect.top - this.panY) / this.scale);

			// проверка наличия притягивания
			if (this.snapPoint) {
				x = this.snapPoint.x;
				y = this.snapPoint.y;
			} else {
				if (this.snapEdgeVertical) {
					x = this.snapEdgeVertical.x;
				}
				if (this.snapEdgeHorizontal) {
					y = this.snapEdgeHorizontal.y;
				}
			}

			const newPoint = { x, y };

			if (this.editingRoom) {
				const room = this.getEditingRoom();
				if (room) {
					if (!Array.isArray(room.points)) {
						room.points = [];
					}
					const lastPoint = room.points[room.points.length - 1];
					if (!lastPoint || lastPoint.x !== newPoint.x || lastPoint.y !== newPoint.y) {
						room.points.push(newPoint);
						this.updateRoom(room);
					}
				}
			} else if (this.editingFloor) {
				if (this.filteredBuildings.length > 0) {
					const lastPoint = this.filteredBuildings[0].points[this.filteredBuildings[0].points.length - 1];
					if (!lastPoint || lastPoint.x !== newPoint.x || lastPoint.y !== newPoint.y) {
						this.filteredBuildings[0].points.push(newPoint);
						this.updateFloor();
					}
				}
			}
		},

		handleMouseMove(event) {
			this.panMap(event);
			this.updateCursorCoordinates(event);
			this.updateSnap(event);
		},

		handleMouseUp(event) {
			if (this.isPanning) {
				const deltaX = Math.abs(event.clientX - this.clickStartX);
				const deltaY = Math.abs(event.clientY - this.clickStartY);

				if (deltaX <= this.clickThreshold && deltaY <= this.clickThreshold) {
					if (this.editingRoom || this.editingFloor) {
						this.handleMapClick(event);
					}
				}

				this.endPan();
			}
		},

		addPoint(room) {
			if (!Array.isArray(room.points)) {
				room.points = [];
			}
			room.points.push({ x: 0, y: 0 });
			this.updateRoom(room);
		},

		removeRoomPoint(index) {
			const room = this.getEditingRoom();
			if (room && Array.isArray(room.points)) {
				room.points.splice(index, 1);
				this.updateRoom(room);
			}
		},

		removePoint(room, index) {
			room.points.splice(index, 1);
			this.updateRoom(room);
		},

		updateRoom(room) {
			if (this.areCoordinatesChanged(room)) {
				this.editedRooms.add(room.id);
				// обновление аудитории в filteredRooms
				const index = this.filteredRooms.findIndex(r => r.id === room.id);
				if (index !== -1) {
					this.filteredRooms[index] = { ...room };
				}
				// обновление или добавление аудитории в filteredRoomsCoords
				const coordIndex = this.filteredRoomsCoords.findIndex(r => r.id === room.id);
				if (coordIndex !== -1) {
					this.filteredRoomsCoords[coordIndex] = { ...room };
				} else {
					this.filteredRoomsCoords.push({ ...room });
				}
			} else {
				this.editedRooms.delete(room.id);
			}
		},

		areCoordinatesChanged(room) {
			if (!this.originalRoomPoints) {
				return false;
			}
			if (room.points.length !== this.originalRoomPoints.length) {
				return true;
			}
			return JSON.stringify(room.points) !== JSON.stringify(this.originalRoomPoints);
		},

		updateCursorCoordinates(event) {
			const rect = event.currentTarget.getBoundingClientRect();
			this.cursorX = Math.round((event.clientX - rect.left - this.panX) / this.scale);
			this.cursorY = Math.round((event.clientY - rect.top - this.panY) / this.scale);

			this.realX =
				this.snapPoint
					? this.snapPoint.x
					: (this.snapEdgeVertical
						? this.snapEdgeVertical.x
						: this.cursorX);
			this.realY =
				this.snapPoint
					? this.snapPoint.y
					: (this.snapEdgeHorizontal
						? this.snapEdgeHorizontal.y
						: this.cursorY);
		},

		handleKeyDown(event) {
			if (event.key === 'Alt') {
				event.preventDefault();
				this.isAltPressed = true;
			}
		},

		handleKeyUp(event) {
			if (event.key === 'Alt') {
				event.preventDefault();
				this.isAltPressed = false;
			}
		},

		updateSnap(event) {
			if ((!this.editingRoom && !this.editingFloor) || this.isAltPressed) {
				this.snapPoint = null;
				this.snapEdgeVertical = null;
				this.snapEdgeHorizontal = null;
				return;
			}

			const rect = event.currentTarget.getBoundingClientRect();
			const x = (event.clientX - rect.left - this.panX) / this.scale;
			const y = (event.clientY - rect.top - this.panY) / this.scale;
			const cursorPoint = { x, y };

			let closestPoint = null;
			let closestDistance = Infinity;
			let closestVerticalEdge = null;
			let closestVerticalDistance = Infinity;
			let closestHorizontalEdge = null;
			let closestHorizontalDistance = Infinity;

			const zeroPoint = { x: 0, y: 0 };
			const zeroDistance = this.getDistance(cursorPoint, zeroPoint);
			if (zeroDistance < closestDistance) {
				closestDistance = zeroDistance;
				closestPoint = zeroPoint;
			}

			const verticalDistanceZero = Math.abs(x);
			if (verticalDistanceZero < closestVerticalDistance) {
				closestVerticalDistance = verticalDistanceZero;
				closestVerticalEdge = { x: 0 };
			}

			const horizontalDistanceZero = Math.abs(y);
			if (horizontalDistanceZero < closestHorizontalDistance) {
				closestHorizontalDistance = horizontalDistanceZero;
				closestHorizontalEdge = { y: 0 };
			}

			// проверка всех точек и граней всех аудиторий и зданий
			const allPoints = [
				...this.filteredRoomsCoords.flatMap(room => room.points),
				...this.filteredBuildings.flatMap(building => building.points)
			];

			for (let i = 0; i < allPoints.length; i++) {
				const point = allPoints[i];
				const distance = this.getDistance(cursorPoint, point);

				if (distance < closestDistance) {
					closestDistance = distance;
					closestPoint = point;
				}

				// проверяем вертикальную линию
				const verticalDistance = Math.abs(x - point.x);
				if (verticalDistance < closestVerticalDistance) {
					closestVerticalDistance = verticalDistance;
					closestVerticalEdge = { x: point.x };
				}
				// горизонтальную
				const horizontalDistance = Math.abs(y - point.y);
				if (horizontalDistance < closestHorizontalDistance) {
					closestHorizontalDistance = horizontalDistance;
					closestHorizontalEdge = { y: point.y };
				}
			}

			// проверка притягивания, если расстояние меньше порога
			const snapThesholdScaled = this.snapThreshold / this.scale;
			if (closestDistance < snapThesholdScaled) {
				this.snapPoint = closestPoint;
				this.snapEdgeVertical = null;
				this.snapEdgeHorizontal = null;
			} else {
				this.snapPoint = null;
				this.snapEdgeVertical =
					closestVerticalDistance < snapThesholdScaled
						? closestVerticalEdge
						: null;
				this.snapEdgeHorizontal =
					closestHorizontalDistance < snapThesholdScaled
						? closestHorizontalEdge
						: null;
			}
		},

		getDistance(p1, p2) {
			const dx = p1.x - p2.x;
			const dy = p1.y - p2.y;
			return Math.sqrt(dx * dx + dy * dy);
		},

		async fetchFloorCoordinates(buildingId, floor) {
			try {
				const res = await axios.get(`/buildingcoordinates/buildingId/${buildingId}/floor/${floor}`);
				const floorData = res.data ? JSON.parse(res.data) : null;
				if (floorData && Array.isArray(floorData.points)) {
					this.filteredBuildings = [{
						buildingId: buildingId,
						floor: floor,
						points: floorData.points
					}];
				} else {
					this.filteredBuildings = [{
						buildingId: buildingId,
						floor: floor,
						points: []
					}];
				}
				this.isFloorUnsaved = false;
			} catch (error) {
				console.error("ошибка загрузки координат этажа: ", error);
				this.filteredBuildings = [{
					buildingId: buildingId,
					floor: floor,
					points: []
				}];
				this.isFloorUnsaved = false;
			}
		},

		startEditingFloor() {
			this.saveCurrentEditing();
			this.editingFloor = true;
			this.editingRoom = null;
			this.originalFloorPoints = JSON.parse(JSON.stringify(this.getEditingFloorPoints()));
		},

		async finishEditingFloor() {
			if (this.areFloorCoordinatesChanged()) {
				try {
					const payload = {
						BuildingId: this.selectedBuilding,
						Floor: this.selectedFloor,
						Coordinates: JSON.stringify({ points: this.getEditingFloorPoints() })
					};
					await axios.post('/SaveBuildingFloorCoordinates', payload);
					this.isFloorUnsaved = false;
					this.toast.success('координаты этажа корпуса успешно отправлены');
				} catch (error) {
					console.error('ошибка отправки координат этажа: ', error);
					this.toast.error('ошибка отправки координат этажа');
				}
			} else {
				this.toast.info('нет изменений для сохранения');
			}
			this.editingFloor = false;
		},

		cancelEditingFloor() {
			if (this.filteredBuildings.length > 0) {
				this.filteredBuildings[0].points = JSON.parse(JSON.stringify(this.originalFloorPoints));
			}
			this.editingFloor = false;
		},

		areFloorCoordinatesChanged() {
			return JSON.stringify(this.getEditingFloorPoints()) !== JSON.stringify(this.originalFloorPoints);
		},

		getEditingFloorPoints() {
			return this.filteredBuildings.length > 0 ? this.filteredBuildings[0].points : [];
		},

		addFloorPoint() {
			if (this.filteredBuildings.length > 0) {
				this.filteredBuildings[0].points.push({ x: 0, y: 0 });
				this.updateFloor();
			}
		},

		removeFloorPoint(index) {
			if (this.filteredBuildings.length > 0) {
				this.filteredBuildings[0].points.splice(index, 1);
				this.updateFloor();
			}
		},

		updateFloor() {
			this.isFloorUnsaved = true;
		},

		async fetchBackgroundImage(selectedBuilding, selectedFloor) {
			try {
				const response = await axios.get(`/GetPlanForFloor/buildingId/${selectedBuilding}/floor/${selectedFloor}`, { responseType: 'blob' });
				// console.log('response.data.size', response.data.size);
				if (response.data.size > 0) {
					const imageIrl = URL.createObjectURL(response.data);
					this.backgroundImage = imageIrl;

					const img = new Image();
					img.onload = () => {
						this.backgroundWidth = img.width;
						this.backgroundHeight = img.height;
					};
					img.src = imageIrl;
				} else {
					this.backgroundImage = null;
					this.backgroundWidth = 0;
					this.backgroundHeight = 0;
				}
			} catch (error) {
				console.error("ошибка при загрузке подложки:", error);
				this.backgroundImage = null;
				this.backgroundWidth = 0;
				this.backgroundHeight = 0;
			}
		},

		toggleMapControls() {
			this.showMapControls = !this.showMapControls;
		}
	},
	mounted() {
		// при инициализации компонента
		this.fetchBuildings();
		// console.log(this.buildings);
		window.addEventListener('keydown', this.handleKeyDown);
		window.addEventListener('keyup', this.handleKeyUp);
	},
	beforeUnmount() {
		if (this.backgroundImage) {
			URL.revokeObjectURL(this.backgroundImage);
		}
		window.removeEventListener('keydown', this.handleKeyDown);
		window.removeEventListener('keyup', this.handleKeyUp);
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
		selectedFloor(newFloor) {
			if (this.selectedBuilding && newFloor !== '') {
				this.fetchFloorCoordinates(this.selectedBuilding, newFloor);
				this.fetchBackgroundImage(this.selectedBuilding, newFloor);
				this.updateRooms();
			}
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
	border: 1px solid #ccc;
	width: 100%;
	height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
}

.map-controls {
	position: absolute;
	bottom: 11px;
	left: 50%;
	background-color: rgba(255, 255, 255, 0.8);
	margin: 10px;
	padding: 10px 10px 0 0;
	z-index: 1000;
}

.map-controls label {
	display: flex;
	align-items: center;
	gap: 5px;
	margin-bottom: 5px;
	margin-left: 5px;
}


.map-controls-enable {
	position: absolute;
	bottom: 21px;
	left: calc(50% + 10px);
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
	font-size: 16px;
	text-align: right;
	line-height: 1.5;
	user-select: none;
}

.unsaved-room {
	background-color: rgba(255, 165, 0, 0.2);
}

.point-edit {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 5px;
	border-bottom: 1px solid #ddd;
}

.coord-input {
	padding: 5px;
}

.btn-icons {
	width: 16px;
	height: 16px;
}

.remove-point-btn {
	padding: 5px;
	cursor: pointer;
}

.add-point-btn {
	width: 100%;
	padding: 5px;
	cursor: pointer;
	margin-top: 5px;
}

.point-number {
	min-width: 24px;
	text-align: right;
	display: inline-block;
}

.action-cell {
	vertical-align: top;
	top: 100;
}

.action-cell button {
	width: 100%;
	margin-bottom: 5px;
	cursor: pointer;
}

.action-cell button:last-child {
	margin-bottom: 0;
}

.default-position-btn {
	margin-left: 5px;
	cursor: pointer;
}

.toggle-controls-btn {
	cursor: pointer;
}
</style>
