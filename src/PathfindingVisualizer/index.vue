<template>
	<div class="pathfinding-visualizer" @click="clearFocus">
		<Canvas
			ref="visualizer"
			:nodeDimensions="nodeDimensions"
			:rows="rows"
			:cols="cols"
			:grid="grid"
			:start="start"
			:finish="finish"
			:visualizerState="visualizerState"
			:colors="colors"
			:controlType="controlType"
			:worldSetup="worldSetup"
			:selectedAlgorithm="selectedAlgorithm"
			:streaming="streaming"
			:thresholdValue="thresholdValue"
			@clickEvent="onClick"
			@groundInitialized="ground = $event"
			@switchWorldSetup="worldSetup = !worldSetup"
			@switchControlType="controlType = controlType == 'Orbit' ? 'PointerLock' : 'Orbit'"
			@updateEnds="updateEnds"
		/>
		<button
			class="open btn-options success"
			key="switch-controls"
			v-if="!worldSetup"
			@click="settings = !settings"
		>   
		    <span class="lg span">Settings</span>
			<img class="icons" src="@/assets/icons/setting.png" alt="" />
		</button>
		<transition name="fade">
		<div class="header blur" v-if="settings">
			<div class="clear-btn">
				<Button class="danger" @click="clearPath" key="clear-path" :disabled="visualizerState == 'running'">
					<img class="fallback-icon" src="@/assets/icons/cross.svg" alt="" />
					<span class="lg">Clear path</span>
					<span class="sm">path</span>
				</Button>
				<Button class="danger" @click="clearWalls" key="clear-walls" :disabled="visualizerState == 'running'">
					<img class="fallback-icon" src="@/assets/icons/cross.svg" alt="" />
					<span class="lg">Clear walls</span>
					<span class="sm">walls</span>
				</Button>
			</div>
			<div class="maze-dropdown" key="maze-select">
				<Button class="info btn-maze" @click="onMazeDropdownClick">
					<img class="fallback-icon" src="@/assets/icons/maze.svg" alt="" />
					<span class="lg">Maze Algorithms</span>
				</Button>
				<div class="dropdown" v-if="dropdownOpen">
					<div
						class="dropdown-item"
						v-for="algo in mazeAlgorithms"
						:key="algo"
						@click="generateMaze(algo)"
					>
						{{ algo }}
					</div>
				</div>
			</div>
			<select
				id="algorithms"
				class="drop"
				v-model="selectedAlgorithm"
				:disabled="visualizerState == 'running'"
				key="algo-select"
				v-if="!worldSetup"
			>
				<option :value="algo" v-for="algo in algorithms" :key="algo.algorithm">{{
					algo.displayName
				}}</option>
			</select>
			<select
				id="algorithms"
				class="drop"
				v-model="selectedSpeed"
				:disabled="visualizerState == 'running'"
				key="speed-select"
				v-if="!worldSetup"
			>
				<option :value="speed" v-for="speed in speeds" :key="speed.text">{{ speed.text }}</option>
			</select>
			<Button
				class="accent"
				@click="visualizeAlgorithm()"
				:disabled="visualizerState == 'running' || worldSetup"
				key="visualize"
				v-if="!worldSetup"
			>
				<img class="fallback-icon" src="@/assets/icons/path.svg" alt="" />
				<span class="lg">Visualize!</span>
			</Button>
		</div>
		</transition>
		<button
			class="open btn-setup"
			key="setup"
			v-if="controlType != 'PointerLock'"
			@click="worldSetup = !worldSetup"
		>
		    <span class="lg span">{{ worldSetup ? "Complete Setup" : "Setup World" }}</span>
			<img class="icons" src="@/assets/icons/setup.svg" alt="" />
		</button>
		<button
			class="open btn-controls second"
			key="switch-controls"
			v-if="!worldSetup"
			@click="switchControl"
		>
			<img class="icons" src="@/assets/icons/location.png" alt="" v-if="controlType == 'Orbit'" />
			<img class="icons" src="@/assets/icons/view.png" alt="" v-else />
			<span class="lg span">{{ controlType == "Orbit" ? "First-person" : "Top View" }}</span>
		</button>
		<div class="details">
		    <div class="search">
			    <h3>{{visitedNodes}}</h3>
				<h5>Visited Nodes</h5>
			</div>
			<div class="length">
			    <h3>{{pathLength}}</h3>
				<h5>Path Length</h5>
			</div>
		</div>

		<Info ref="info" :colors="colors" @unlockSwarm="unlockSwarm"></Info>
	</div>
</template>

<script>
import Canvas from "./GridSurface/GridCanvas.vue";
import Info from './Extra/Info.vue';
import TWEEN from "@tweenjs/tween.js";
import '../App.css';

import { getNodesInShortestPathOrder, tweenToColor } from "./Functions/Nodes.js";
import { weightedSearchAlgorithm } from "./Functions/weightedSearchAlgorithm.js";
import { unweightedSearchAlgorithm } from "./Functions/unweightedSearchAlgorithm.js";
import { randomMaze, recursiveDivisionMaze } from "./Functions/mazeAlgorithms.js";


export default {
	components: {
		Canvas,
		Info
	},
	data: () => ({
		visualizerState: "clear",
		algorithms: [
			{
				algorithm: "dijkstra",
				heuristic: "",
				displayName: "Dijkstra's Algorithm",
				type: "weighted",
				info: {
					heading: "Dijkstra's Algorithm",
					text: `The father of pathfinding algorithms, Dijkstra’s algorithm creates a tree of shortest paths from the starting vertex, the source, to all other points in the graph.
					<br><br>
					It is a <b>weighted</b> algorithm and <b>guarantees</b> the shortest path!`
				}
			},
			{
				algorithm: "astar",
				heuristic: "poweredManhattanDistance",
				displayName: "A* Search",
				type: "weighted",
				info: {
					heading: "A* Search Algorithm",
					text: `A* Search algorithm is one of the best and popular technique used in path-finding and graph traversals. A* algorithm introduces a heuristic into a regular graph-searching algorithm, essentially planning ahead at each step so a more optimal decision is made.
					<br><br>
					It is a <b>weighted</b> algorithm and <b>guarantees</b> the shortest path!`
				}
			},
			{
				algorithm: "bfs",
				heuristic: "",
				displayName: "Breadth-first Search",
				type: "unweighted",
				info: {
					heading: "Breadth-first Search",
					text: `Breadth-first search is an algorithm for traversing or searching tree or graph data structures. It starts at the tree root, and explores all of the neighbor nodes at the present depth prior to moving on to the nodes at the next depth level.
					<br><br>
					It is an <b>unweighted</b> algorithm and <b>guarantees</b> the shortest path!`
				}
			},
			{
				algorithm: "dfs",
				heuristic: "",
				displayName: "Depth-first Search",
				type: "unweighted",
				info: {
					heading: "Depth-first Search",
					text: `Depth-first search is an algorithm for traversing or searching tree or graph data structures. The algorithm starts at the root node and explores as far as possible along each branch before backtracking.
					<br><br>
					It is an <b>unweighted</b> algorithm and <b>does not guarantee</b> the shortest path!`
				}
			},
		],
		swarm: {
			algorithm: "CLA",
			heuristic: "manhattanDistance",
			displayName: "Swarm Algorithm",
			type: "weighted",
			info: {
				heading: "Swarm Algorithm",
				text: `The Swarm Algorithm, presumably developed by Clément Mihailescu and Hussein Farah, is essentially a mixture of Dijkstra's Algorithm and A* Search. More precisely, while it converges to the target node like A*, it still explores quite a few neighboring nodes surrounding the start node like Dijkstra's.
				<br><br>
				It is a <b>weighted</b> algorithm and <b>does not guarantee</b> the shortest path!`
			}
		},
		selectedAlgorithm: null,
		speeds: [
			{
				text: "Fast",
				value: 15,
			},
			{
				text: "Medium",
				value: 25,
			},
			{
				text: "Slow",
				value: 45,
			},
			{
				text: "Super Slow",
				value: 80,
			},
		],
		selectedSpeed: null,
		mazeAlgorithms: ["Random Maze", "Recursive Division"],
		dropdownOpen: false,
		settings: false,
		nodeDimensions: {
			height: 8,
			width: 8,
		},
		rows: 32,
		cols: 32,
		grid: [],
		ground: null,
		controlType: "Orbit",
		start: {
			row: 6,
			col: 6,
		},
		finish: {
			row: 25,
			col: 25,
		},
		visitedNodes: 0,
		pathLength: 0,
		worldSetup: false,
		deviceCamInput: false,
		streaming: false,
		thresholdValue: 100,
		colors: {
			default: { r: 1, g: 1, b: 1 },
			start: { r: 0, g: 1, b: 0 },
			finish: { r: 1, g: 0, b: 0 },
			wall: { r: 0.109, g: 0.109, b: 0.45 },
			visited: { r: 0.1, g: 0.235, b: 0.764 },
			path: { r: 1, g: 1, b: 0 },
		},
		infoStatus: '',
		infoObject: {
			heading: "",
			text: ""
		}
	}),
	watch: {
		selectedAlgorithm: function(newVal, oldVal) {
			if (newVal.type == "unweighted") {
				this.clearWalls();
			}
			this.dropdownOpen = false;
			this.$refs.info.resetToLegends();
		},
		worldSetup: function(newVal, oldVal) {
			if(newVal) {
				this.clearPath();
			} else {
				this.deviceCamInput = false;
			}
		},
		deviceCamInput: function(newVal, oldVal) {
			if(newVal) {
				function hasGetUserMedia() {
					return !!(navigator.mediaDevices &&
						navigator.mediaDevices.getUserMedia);
				}

				this.clearWalls();

				const videoCanvas = document.querySelector('#video-canvas');
				let videoCtx = videoCanvas.getContext("2d");
				const video = document.querySelector('video');
				this.thresholdValue = 100;
				const scale = 17;
				const width = 512;
				const height = 512;
				if (hasGetUserMedia()) {
					videoCanvas.width = width/scale;
					videoCanvas.height = height/scale;
					const constraints = {
						video: { width: { exact: width/scale }, height: { exact: height/scale } }
					};

					navigator.mediaDevices.getUserMedia(constraints)
						.then((stream) => {
							video.srcObject = stream;
							this.streaming = true;
						});
				} else {
					alert('getUserMedia() is not supported by your browser');
				}
			} else {
				const video = document.querySelector('video');
				const stream = video.srcObject;
				const tracks = stream.getTracks();

				tracks.forEach(function(track) {
					track.stop();
				});

				video.srcObject = null;
				this.streaming = false;
			}
		}
	},
	created() {
		this.selectedAlgorithm = this.algorithms[0];
		this.start.gridId = this.start.row * this.cols + this.start.col;
		this.finish.gridId = this.finish.row * this.cols + this.finish.col;
		this.selectedSpeed = this.speeds[0];
	},
	methods: {
		onClick(node) {
			let vm = this;
			if (this.visualizerState == "running") return;
			if(this.selectedAlgorithm.type == "unweighted") {
				this.$refs.info.error({
					heading: "Uh oh",
					text: "Can't add walls in an unweighted algorithm."
				});
				return;
			}
			if (node.status != "wall") {
				if (node.status == "start" || node.status == "finish") return;
				node.status = "wall";
			} else {
				node.status = "default";
			}
		},

		onMazeDropdownClick() {
			if(this.selectedAlgorithm.type != 'unweighted') {
				this.dropdownOpen = !this.dropdownOpen;
			} else {
				this.dropdownOpen = false;
				this.$refs.info.error({
					heading: "Uh oh",
					text: "Can't add walls in an unweighted algorithm."
				});
			}
		},

		updateEnds(obj) {
			if (obj.start) {
				this.start = obj.start;
				this.start.gridId = obj.start.row * this.cols + obj.start.col;
			} else {
				this.finish = obj.finish;
				this.finish.gridId = obj.finish.row * this.cols + obj.finish.col;
			}
		},

		unlockSwarm() {
			console.log('Unlocked Swarm');
			this.algorithms.push(this.swarm);
		},

		clearWalls() {
			for (let i = 0; i < this.rows; i++) {
				for (let j = 0; j < this.cols; j++) {
					let status = "default";
					if (this.grid[i][j].status == "wall") {
						this.$set(this.grid[i][j], "status", status);
					}
				}
			}
		},

		clearPath() {
			TWEEN.removeAll();
			this.visitedNodes = 0;
			this.pathLength = 0;
			for (let i = 0; i < this.rows; i++) {
				for (let j = 0; j < this.cols; j++) {
					let status = "default";
					if (i == this.start.row && j == this.start.col) {
						status = "start";
					} else if (i == this.finish.row && j == this.finish.col) {
						status = "finish";
					}
					if (this.grid[i][j].status != "wall") {
						this.$set(this.grid[i][j], "status", status);
					}
					this.$set(this.grid[i][j], "distance", Infinity);
					this.$set(this.grid[i][j], "totalDistance", Infinity);
					this.$set(this.grid[i][j], "heuristicDistance", null);
					this.$set(this.grid[i][j], "direction", null);
					this.$set(this.grid[i][j], "previousNode", null);
				}
			}
			this.visualizerState = "clear";
		},

		switchControl() {
			if (this.controlType == "Orbit") {
				this.controlType = "PointerLock";
				setTimeout(() => {
					this.$refs.info.alert({
						heading: "Start First-Person",
						text: "Click anywhere on the canvas to start the First-Person mouse movement. Press Esc to exit."
					});
				}, 2000)
			} else {
				this.controlType = "Orbit";
				this.$refs.info.resetToLegends();
			}
		},

		moveCamera() {
			this.$refs.visualizer.controls.enabled = false;
			new TWEEN.Tween(this.$refs.visualizer.camera.position)
				.to({ x: -100, y: 200, z: 100 }, 2000)
				.easing(TWEEN.Easing.Exponential.Out)
				.onUpdate(() => {
					this.$refs.visualizer.camera.lookAt(this.$refs.visualizer.scene.position);
					// this.$refs.visualizer.controls.update();
				})
				.onComplete(() => {
					this.$refs.visualizer.controls.enabled = true;
				})
				.start();
			// new TWEEN.Tween(this.$refs.visualizer.camera.rotation)
			// 	.to({ x: -(Math.PI/3), y: -(Math.PI/8), z: 0 }, 2000)
			// 	.easing(TWEEN.Easing.Exponential.Out)
			// 	.start();
		},

		visualizeAlgorithm() {
			let timerDelay = this.selectedSpeed.value;
			this.settings= false;
			this.clearPath();
			// this.moveCamera();
			this.$nextTick(() => {
				this.visualizerState = "running";
				const startNode = this.grid[this.start.row][this.start.col];
				const finishNode = this.grid[this.finish.row][this.finish.col];
				let nodesToAnimate = [];
				let success;
				if (this.selectedAlgorithm.type == "weighted") {
					success = weightedSearchAlgorithm(
						this.grid,
						startNode,
						finishNode,
						nodesToAnimate,
						this.selectedAlgorithm.algorithm,
						this.selectedAlgorithm.heuristic,
					);
				} else {
					this.clearWalls();
					success = unweightedSearchAlgorithm(
						this.grid,
						startNode,
						finishNode,
						nodesToAnimate,
						this.selectedAlgorithm.algorithm
					);
				}
				console.log("success:", success);
				if (success == false) {
					this.clearPath();
					this.visualizerState = "finished";
					this.$refs.info.error({
						heading: "Uh oh",
						text: "Can't find the path when one end is unreachable."
					});
					return;
				}
				const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
				this.$nextTick(() => {
					this.animateAlgorithm(nodesToAnimate, nodesInShortestPathOrder, timerDelay);
				});
			});
		},

		animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder, timerDelay) {
			this.visitedNodes = visitedNodesInOrder.length;
			for (let i = 0; i <= visitedNodesInOrder.length; i++) {
				if (i === visitedNodesInOrder.length) {
					setTimeout(() => {
						this.animateShortestPath(nodesInShortestPathOrder, 5 * timerDelay);
					}, timerDelay * i);
					return;
				}
				if (
					(visitedNodesInOrder[i].row == this.start.row &&
						visitedNodesInOrder[i].col == this.start.col) ||
					(visitedNodesInOrder[i].row == this.finish.row &&
						visitedNodesInOrder[i].col == this.finish.col)
				) {
					continue;
				}
				setTimeout(() => {
					const node = visitedNodesInOrder[i];
					if (!node) return;
					tweenToColor(
						node,
						this.ground.geometry,
						[{ r: 1.0, g: 0.321, b: 0.784 }, this.colors.visited],
						300,
						{ position: false }
					);
				}, timerDelay * i);
			}
			
		},

		animateShortestPath(nodesInShortestPathOrder, timerDelay) {
			let vm = this;
	 		this.pathLength = nodesInShortestPathOrder.length;
			for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
				setTimeout(() => {
					const node = nodesInShortestPathOrder[i];
					tweenToColor(node, this.ground.geometry, [this.colors.path], undefined, {
						position: false,
					});
					if (i == nodesInShortestPathOrder.length - 1) {
						vm.visualizerState = "finished";
						vm.$refs.info.alert(this.selectedAlgorithm.info);
					}
				}, timerDelay * i);
			}
		},

		generateMaze(algo) {
			this.dropdownOpen = false;
			this.clearWalls();
			this.clearPath();
			let nodesToAnimate = [];
			if (algo == "Random Maze") {
				randomMaze(this.grid, nodesToAnimate, "wall");
			} else {
				recursiveDivisionMaze(
					this.grid,
					2,
					this.grid.length - 3,
					2,
					this.grid[0].length - 3,
					"horizontal",
					false,
					nodesToAnimate,
					"wall"
				);
			}
			this.animateMaze(nodesToAnimate, "wall", 30);
		},

		animateMaze(visitedNodesInOrder, type, timerDelay) {
			for (let i = 0; i < visitedNodesInOrder.length; i++) {
				setTimeout(() => {
					const node = visitedNodesInOrder[i];
					node.status = type;
				}, timerDelay * i);
			}
		},

		clearFocus() {
			document.getElementsByClassName("header")[0].click();
		},
	},
};
</script>