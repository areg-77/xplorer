<script setup>
import { ref, watch, provide, onMounted, onBeforeUnmount } from 'vue';
import Tree from './components/Tree.vue';
import TreeTools from './components/TreeTools.vue';
import TreeData from './components/TreeData.vue';
import BottomPanel from './components/BottomPanel.vue';
import { TNode, nodeByPath } from './components/model/TNode';
import { SNode } from './components/model/SNode';
import ButtonDefault from './components/ButtonDefault.vue';

const isDev = window?.env?.isDev ?? false;
provide('isDev', isDev);

const dir = ref('');
const tree = ref(null);

async function toTNode(node) {
  return TNode(node.label, node.type, node.children ? await Promise.all(node.children.map(toTNode)) : []);
}

async function loadTree(directory) {
  const rawTree = await window.explorer.readFolder(directory);
  const newTree = await toTNode(rawTree);
  tree.value = newTree;
  tree.value.path = directory;
}

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

watch(dir, async (newDir) => {
  if (!newDir) return;
  await loadTree(newDir);
  
  selected.clear();

  // window.watcher.stop();
  window.watcher.start(newDir, (event, data) => {
    const handler = eventHandlers[event] || ((d) => {
      console.warn(`unhandled event (${event})`, d);
    });
    handler(data);
  });
}, { immediate: true });

const ctrlCmdPressed = ref(false);
const shiftPressed = ref(false);

provide('ctrlCmdPressed', ctrlCmdPressed);
provide('shiftPressed', shiftPressed);

const selected = new SNode(ctrlCmdPressed, shiftPressed);

// ctrl/cmd and shift tracking
function handleKeyHold(e) {
  ctrlCmdPressed.value = e.ctrlKey || e.metaKey;
  shiftPressed.value = e.shiftKey;
}

onMounted(() => {
  window.electronAPI.on('open-folder', async () => openFolder());
  
  window.addEventListener('keydown', handleKeyHold);
  window.addEventListener('keyup', handleKeyHold);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyHold);
  window.removeEventListener('keyup', handleKeyHold);
});

async function openFolder() {
  const folderPath = await window.explorer.openFolder();
  if (folderPath)
    dir.value = folderPath;
}
</script>

<template>
  <main class="maingrid">
    <div class="tree-container">
      <TreeTools :source="tree" :selected="selected"/>
      <Tree v-if="tree" :source="tree" :selected="selected" :draggable="true"/>
      <Tree v-else>
        <div v-if="!dir" class="tree-control-box">
          You haven't opened a folder yet.
          <ButtonDefault class="version" @click="openFolder">
            <span class="icon ui open-folder"></span>
            Open Folder
          </ButtonDefault>
        </div>
        <div v-else class="tree-control-box">
          <span class="icon ui loading" style="height: 4rem;"></span>
          Loading...
        </div>
      </Tree>
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

.tree-control-box {
  font-size: 14px;
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translate(-50%, -35%);
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  background-color: var(--secondary-dark);
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 0.5rem);
  padding: 0.5rem 2rem;
  gap: 0.5rem;
}
</style>
