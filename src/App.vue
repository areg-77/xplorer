<script setup>
import { ref, provide, onMounted, watch } from 'vue';
import Tree from './components/Tree.vue';
import TreeData from './components/TreeData.vue';
import BottomPanel from './components/BottomPanel.vue';

const selectedNodes = ref([]);
const lastNode = ref(null);
provide('selection', { selectedNodes, lastNode });

let lastParentWatcher = null;
watch(lastNode, (newLastNode) => {
  if (lastParentWatcher) {
    lastParentWatcher();
    lastParentWatcher = null;
  }
  
  if (newLastNode) {
    lastParentWatcher = watch(newLastNode.parent, () => {
      lastNode.value = null;
    }, { immediate: false });
  }
}, { immediate: true });

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
