<script setup>
import { ref, provide, onMounted } from 'vue';
import Tree from './components/Tree.vue';
import TreeData from './components/TreeData.vue';

const selectedNodes = ref([]);
provide('selectedNodes', selectedNodes);

const ctrlCmdPressed = ref(false);
const shiftPressed = ref(false);

provide('ctrlCmdPressed', ctrlCmdPressed);
provide('shiftPressed', shiftPressed);

onMounted(() => {
  // ctrl/cmd and shift tracking
  window.addEventListener('keydown', (e) => {
    ctrlCmdPressed.value = e.ctrlKey || e.metaKey;
    shiftPressed.value = e.shiftKey;
  });
  window.addEventListener('keyup', (e) => {
    ctrlCmdPressed.value = e.ctrlKey || e.metaKey;
    shiftPressed.value = e.shiftKey;
  });
});
</script>

<template>
  <main class="maingrid">
    <Tree path="resources/Project"/>
    <TreeData/>
  </main>
</template>

<style>
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 1rem;
  overflow: hidden;
  box-sizing: border-box;
}

.maingrid {
  display: grid;
  overflow: hidden;
  grid-template-columns: 55fr 45fr;
  gap: 0.5rem;
  height: 100%;
}
</style>
