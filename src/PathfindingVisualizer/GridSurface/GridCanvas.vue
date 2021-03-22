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

	mounted() {
		this.init();
		
		this.videoCanvas = document.querySelector('#video-canvas');
		this.video = document.querySelector('video');
	},
	methods: {
		init() {
			let width = window.innerWidth,
				height = window.innerHeight;

			//Scene
			this.scene = new THREE.Scene();
			this.scene.background = new THREE.Color(0x5280c7);
			this.scene.fog = new THREE.Fog(0xffffff, 50, 850);

			//Camera
			this.camera = new THREE.PerspectiveCamera(62, width / height, 5, 5000);
			this.camera.position.y = this.cameraY + 2000;
			this.camera.position.x = -500;
			this.camera.position.z = 500;
			// var helper = new THREE.CameraHelper(this.camera);
			// this.scene.add(helper);

			//Renderer
			this.renderer = new THREE.WebGLRenderer({ antialias: true });
			this.renderer.setSize(width, height);
			this.renderer.shadowMap.enabled = true;
			// this.renderer.shadowMap.type = THREE.BasicShadowMap;
			document.getElementById("visualizer").appendChild(this.renderer.domElement);

			// Controls
			this.addControls();
			this.setControls(true);

			// Raycaster
			this.raycaster = new THREE.Raycaster();

			// Ground
			let gridWidth = this.cols * this.nodeDimensions.width,
				gridHeight = this.rows * this.nodeDimensions.height;
			let vm = this;
			let groundGeometry = new THREE.PlaneGeometry(gridWidth, gridHeight, this.cols, this.rows);
			groundGeometry.rotateX(-Math.PI / 2);
			let loader = new THREE.TextureLoader();
			loader.load(
				require("@/assets/textures/ground.png"),
				function(texture) {
					texture.wrapS = THREE.RepeatWrapping;
					texture.wrapT = THREE.RepeatWrapping;
					texture.repeat.x = vm.rows;
					texture.repeat.y = vm.cols;
					var groundMaterial = new THREE.MeshLambertMaterial({
						map: texture,
						side: THREE.FrontSide,
						vertexColors: THREE.FaceColors,
					});
					vm.ground = new THREE.Mesh(groundGeometry, groundMaterial);
					vm.ground.receiveShadow = true;
					vm.ground.position.y = 0.02;
					vm.scene.add(vm.ground);
					vm.initGrid();
					vm.$emit("groundInitialized", vm.ground);
				},
				undefined,
				function(error) {
					console.log(error);
				}
			);
			let fakeGroundGeometry = new THREE.PlaneGeometry(1000, 1000, this.cols, this.rows);
			fakeGroundGeometry.rotateX(-Math.PI / 2);
			var fakeGroundMaterial = new THREE.MeshLambertMaterial({
				// color: 0x87775d,
				color: 0xBBC2D0,
				side: THREE.FrontSide,
			});
			let fakeGround = new THREE.Mesh(fakeGroundGeometry, fakeGroundMaterial);
			this.scene.add(fakeGround);

			//Grid helper
			var size = this.cols * this.nodeDimensions.height;
			var divisions = this.cols;
			var gridHelper = new THREE.GridHelper(size, divisions, 0x316e2f, 0x316e2f);
			gridHelper.position.y = 0.035;
			this.scene.add(gridHelper);

			// Wall
			// let wallHeight = this.nodeDimensions.width * 2 + Math.random() * this.nodeDimensions.width * 3;
			let wallHeight = this.nodeDimensions.height * 3;
			this.wallGeomtery = new THREE.BoxBufferGeometry(
				this.nodeDimensions.width,
				wallHeight,
				this.nodeDimensions.height
			);
			let wallTextureObject = this.wallTextures[
				Math.floor(Math.random() * this.wallTextures.length)
			];
			this.wallMaterials.push(
				new THREE.MeshPhongMaterial({
					color: new THREE.Color(this.colors.wall.r, this.colors.wall.g, this.colors.wall.b),
				})
			);
			for (let tex of this.wallTextures) {
				loader.load(
					require("@/assets/textures/" + tex.path),
					function(texture) {
						texture.wrapT = THREE.RepeatWrapping;
						texture.repeat.y = tex.repeatY;
						vm.wallMaterials.push(new THREE.MeshLambertMaterial({ map: texture }));
					},
					undefined,
					function(error) {
						console.log(error);
					}
				);
			}

			// Ambient Light
			this.ambientLight = new THREE.AmbientLight(0xfdfbd3, 1);
			this.scene.add(this.ambientLight);

			// LIGHTS
			this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.1);
			this.hemisphereLight.color.setHSL(0.6, 1, 0.6);
			this.hemisphereLight.groundColor.setHex(0xf7bf63);
			this.hemisphereLight.position.set(0, 5, 0);
			this.scene.add(this.hemisphereLight);

			// let hemiLightHelper = new THREE.HemisphereLightHelper(this.hemisphereLight, 10);
			// this.scene.add(hemiLightHelper);

			this.directionalLight = new THREE.DirectionalLight(0xfdfbd3, 0.5);
			this.directionalLight.color.setHSL(0.1, 1, 0.95);
			this.directionalLight.position.set(-1, 1.75, 1);
			this.directionalLight.position.multiplyScalar(70);
			this.scene.add(this.directionalLight);

			this.directionalLight.castShadow = true;
			this.directionalLight.shadow.mapSize.width = 2048;
			this.directionalLight.shadow.mapSize.height = 2048;

			var d = 200;
			this.directionalLight.shadow.camera.left = -d;
			this.directionalLight.shadow.camera.right = d;
			this.directionalLight.shadow.camera.top = d;
			this.directionalLight.shadow.camera.bottom = -d;
			this.directionalLight.shadow.camera.far = 350;

			// SKYDOME
			var vertexShader = document.getElementById("vertexShader").textContent;
			var fragmentShader = document.getElementById("fragmentShader").textContent;
			var uniforms = {
				topColor: { value: new THREE.Color(0x0077ff) },
				bottomColor: { value: new THREE.Color(0xffffff) },
				offset: { value: 33 },
				exponent: { value: 0.6 },
			};
			uniforms["topColor"].value.copy(this.hemisphereLight.color);

			this.scene.fog.color.copy(uniforms["bottomColor"].value);
			var skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
			var skyMat = new THREE.ShaderMaterial({
				uniforms: uniforms,
				vertexShader: vertexShader,
				fragmentShader: fragmentShader,
				side: THREE.BackSide,
			});
			var sky = new THREE.Mesh(skyGeo, skyMat);
			this.scene.add(sky);

			// Stats
			this.stats = new Stats();
			this.stats.dom.style.top = "auto";
			this.stats.dom.style.bottom = '5px';
			this.stats.dom.style.left = '3px';
			document.getElementById("visualizer").appendChild(this.stats.dom);

			//Resize handler
			window.addEventListener("resize", this.resizeHandler);
			this.renderer.domElement.addEventListener("mousedown", this.onMouseDown, true);
			this.renderer.domElement.addEventListener("touchstart", this.onMouseDown, true);
			this.renderer.domElement.addEventListener("mousemove", this.onMouseMove, true);
			this.renderer.domElement.addEventListener("touchmove", this.onMouseMove, true);
			this.renderer.domElement.addEventListener("mouseup", this.onMouseup, true);
			this.renderer.domElement.addEventListener("mouseleave", this.onMouseLeave, true);
			this.renderer.domElement.addEventListener("touchend", this.onMouseup, true);

			// Setting hover handler
			this.mouse = new THREE.Vector2();

			this.renderLoop();
		},
	}
}
</script>