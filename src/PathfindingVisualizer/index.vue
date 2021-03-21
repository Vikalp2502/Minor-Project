<template>
	<div class="pathfinding-visualizer" @click="clearFocus">
		<GridCanvas
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
</template>

<script>
import GridCanvas from "./GridSurface/GridCanvas.vue";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import '../App.css';



export default {
	components: {
		GridCanvas,
	},
	data: () => ({
		visualizerState: "clear",
		selectedSpeed: null,
		nodeDimensions: {
			height: 8,
			width: 8,
		},
		rows: 35,
		cols: 35,
		grid: [],
		ground: null,
		controlType: "Orbit",
		start: {
			row: 6,
			col: 6,
		},
		finish: {
			row: 29,
			col: 29,
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
	}),
}
</script>

