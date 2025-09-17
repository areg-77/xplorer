<script setup>
import { ref, reactive, provide, onMounted } from 'vue';
import Tree from './components/Tree.vue';
import TreeData from './components/TreeData.vue';
import BottomPanel from './components/BottomPanel.vue';

const dirPath = 'D:/_ELECTRON/_XPLORER/Project';

const selectedNodes = reactive([]);
const lastNode = ref(null);
provide('selection', { selectedNodes, lastNode });

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
    <Tree :path="dirPath"/>
    <TreeData/>
  </main>
  <BottomPanel/>
</template>

<style>
#app, .maingrid {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  box-sizing: border-box;
}

#app {
  display: flex;
  flex-direction: column;
}

.maingrid {
  display: grid;
  padding: 1rem;
  grid-template-columns: 55fr 45fr;
  gap: 0.5rem;
}
</style>
