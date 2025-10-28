<script setup>
import { ref, provide, onMounted, onBeforeUnmount } from 'vue';
import Tree from './components/Tree.vue';
import TreeTools from './components/TreeTools.vue';
import TreeData from './components/TreeData.vue';
import BottomPanel from './components/BottomPanel.vue';
import { TNode, nodeByPath } from './components/model/TNode';
import { SNode } from './components/model/SNode';

const isDev = window?.env?.isDev ?? false;
provide('isDev', isDev);

const dir = 'resources/Project';

const ctrlCmdPressed = ref(false);
const shiftPressed = ref(false);

provide('ctrlCmdPressed', ctrlCmdPressed);
provide('shiftPressed', shiftPressed);

const selected = new SNode(ctrlCmdPressed, shiftPressed);

const tree = ref(null);
onMounted(async () => {
  const rawTree = await window.explorer.readFolder(dir);
  function toTNode(node) {
    return TNode(node.label, node.type, node.children ? node.children.map(toTNode) : []);
  }
  tree.value = toTNode(rawTree);
  tree.value.path = dir;

  // dir watcher
  const eventHandlers = {
    add: (data) => {
      console.log(`add: ${data.path}`);
      const node = TNode(data.basename, data.isDir ? 'folder' : 'file');
      const parent = nodeByPath(data.dirname, tree.value);
      if (node && parent) node.parent = parent;
    },
    delete: (data) => {
      console.log(`delete: ${data.path}`);
      const node = nodeByPath(data.path, tree.value);
      if (node) node.parent = null;
    },
    rename: (data) => { 
      console.log(`rename: ${data.oldpath} -> ${data.path}`);
      const node = nodeByPath(data.oldpath, tree.value);
      if (node) node.label = data.basename;
    },
    move: (data) => {
      console.log(`move: ${data.oldpath} -> ${data.path}`);
      const node = nodeByPath(data.oldpath, tree.value);
      const newParent = nodeByPath(data.dirname, tree.value);
      if (node && newParent) node.parent = newParent;
    }
  };

  window.watcher.start(dir, (event, data) => {
    const handler = eventHandlers[event] || ((d) => {
      console.warn(`unhandled event (${event})`, d);
    });
    handler(data);
  });
});

// ctrl/cmd and shift tracking
function handleKeyHold(e) {
  ctrlCmdPressed.value = e.ctrlKey || e.metaKey;
  shiftPressed.value = e.shiftKey;
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyHold);
  window.addEventListener('keyup', handleKeyHold);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyHold);
  window.removeEventListener('keyup', handleKeyHold);
});
</script>

<template>
  <main class="maingrid">
    <div class="tree-container">
      <!-- todo: instead of v-if add a skeleton loading -->
      <TreeTools v-if="tree" :source="tree" :selected="selected"/>
      <Tree v-if="tree" :source="tree" :selected="selected" :draggable="true"/>
    </div>
    <TreeData :selected="selected"/>
  </main>
  <BottomPanel :selected="selected"/>
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

.tree-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 0.5rem;
}
</style>
