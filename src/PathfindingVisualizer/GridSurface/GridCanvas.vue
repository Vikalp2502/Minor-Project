<template>
	<div id="visualizer" @click="controlType == 'PointerLock' ? controls.lock() : clearFocus">
		<script type="x-shader/x-vertex" id="vertexShader">
			varying vec3 vWorldPosition;

			void main() {
				vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
				vWorldPosition = worldPosition.xyz;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}
		</script>
		<script type="x-shader/x-fragment" id="fragmentShader">
			uniform vec3 topColor;
			uniform vec3 bottomColor;
			uniform float offset;
			uniform float exponent;

			varying vec3 vWorldPosition;

			void main() {
				float h = normalize( vWorldPosition + offset ).y;
				gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
			}
		</script>
	</div>
</template>

<script>
import * as THREE from "three";

export default {
	props: [
		"nodeDimensions",
		"grid",
		"rows",
		"cols",
		"start",
		"finish",
		"visualizerState",
		"colors",
		"controlType",
		"worldSetup",
		"selectedAlgorithm",
		"streaming",
		"thresholdValue"
	],
	data: () => ({
		scene: null,
		camera: null,
		cameraY: 0,
		defaultCameraY: 250,
		renderer: null,
		pointerLock: {
			moveForward: false,
			moveBackward: false,
			moveLeft: false,
			moveRight: false,
			velocity: null,
			direction: null,
			prevTime: null,
		},
		controls: null,
		orbitControls: null,
		pointerLockControls: null,
		raycaster: null,
		ambientLight: null,
		hemisphereLight: null,
		directionalLight: null,
		ground: null,
		wallGeomtery: null,
		wallMaterials: [],
		walls: {},
		down: false,
		moved: false,
		currentEvent: null,
		mouse: null,
		intersectedNode: null,
		clock: null,
		stats: null,
		// Device cam
		videoCanvas: null,
		video: null
	}),
}
</script>