<template>
  <div id="app">
    <Visualizer />
  </div>
</template>

<script>
import Visualizer from './PathfindingVisualizer/index.vue';

export default {
  name: 'App',
  components: {
    Visualizer
  }
}
</script>

<style lang="scss">
body {
	font-family: Arial, Helvetica, sans-serif;
	margin: 0;
}
* {
	box-sizing: border-box;
}
#app {
	// background: blueviolet;
	min-height: 100vh;
}
</style>
