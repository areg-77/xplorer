<script setup>
import { ref, reactive, provide, onMounted, onBeforeUnmount, watch } from 'vue';
import Tree from './components/Tree.vue';
import TreeTools from './components/TreeTools.vue';
import TreeData from './components/TreeData.vue';
import BottomPanel from './components/BottomPanel.vue';
import DataField from './components/DataField.vue';
import DataGroup from './components/DataGroup.vue';
import DataText from './components/DataText.vue';
import { TNode, nodeByPath } from './components/model/TNode';

const isDev = window?.env?.isDev ?? false;
provide('isDev', isDev);

const dir = 'resources/Project';

const selectedNodes = reactive([]);
const lastNode = ref(null);
provide('selection', { selectedNodes, lastNode });

const ctrlCmdPressed = ref(false);
const shiftPressed = ref(false);

provide('ctrlCmdPressed', ctrlCmdPressed);
provide('shiftPressed', shiftPressed);

const tree = ref(null);
onMounted(async () => {
  const rawTree = await window.electronAPI.readFolder(dir);
  function toTNode(node) {
    return TNode(node.label, node.type, node.children ? node.children.map(toTNode) : []);
  }
  tree.value = toTNode(rawTree);
  tree.value.path = dir;

  // dir watcher
  const eventHandlers = {
    add: (data) => {
      console.log(`add: ${data.path}`);
      const node = new TNode(data.basename, data.isDir ? 'folder' : 'file');
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

  // ctrl/cmd and shift tracking
  const handleKeyHold = (e) => {
    ctrlCmdPressed.value = e.ctrlKey || e.metaKey;
    shiftPressed.value = e.shiftKey;
  }
  
  window.addEventListener('keydown', handleKeyHold);
  window.addEventListener('keyup', handleKeyHold);

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyHold);
    window.removeEventListener('keyup', handleKeyHold);
  });
});

function pathDir(path) {
  return path.substring(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')));
}

function renameNode(path, value) {
  window.explorer.rename(path, pathDir(path) + '/' + value);
}

const tempNode = ref(null);
watch(() => selectedNodes.slice(), () => {
  // remove deleted nodes from selected
  for (let i = selectedNodes.length - 1; i >= 0; i--) {
    const node = selectedNodes[i];
    if (!node.parent) {
      selectedNodes.splice(i, 1);
    }
  }
  if (lastNode.value && !lastNode.value.parent)
    lastNode.value = null;

  tempNode.value = selectedNodes[0] || null;
  selectedNodes.forEach(node => node.parents().forEach(p => p.expanded = true));
},
{ deep: true });

const invalidChars = `\\/:?"<>|\n`;
</script>

<template>
  <main class="maingrid">
    <div class="tree-container">
      <TreeTools/>
      <Tree :source="tree"/>
    </div>
    <TreeData>
      <DataGroup label="Properties" icon="ui properties">
        <DataField label="Name">
          <DataText :value="selectedNodes[0]?.label" :invalid-chars="invalidChars"
            @setvalue="val => {
              if (selectedNodes[0])
                renameNode(selectedNodes[0].path, val);
            }"
            @livevalue="val => {
              if (selectedNodes[0])
                tempNode = new TNode(val, selectedNodes[0].type);
            }"
            border-radius-mask="0110" :editable="!!selectedNodes[0]">
            <span v-if="selectedNodes[0] && tempNode" class="icon" :class="[tempNode.type, ...(tempNode.type !== 'folder' ? [tempNode.mimeType ? tempNode.mimeType.replace('/', ' ') : null, tempNode.extension] : [])].filter(Boolean).join(' ')"></span>
          </DataText>
        </DataField>
        <DataField label="Type">
          <DataText :value="selectedNodes[0]?.type" border-radius-mask="0110"/>
        </DataField>
        <DataField label="Mime">
          <DataText :value="tempNode?.mimeType" border-radius-mask="0110"/>
        </DataField>
      </DataGroup>

      <DataGroup v-if="isDev" label="Developer" icon="ui code">
        <DataField label="Id">
          <DataText :value="selectedNodes[0]?.id" border-radius-mask="0110"/>
        </DataField>
        <DataField label="Node">
          <DataText :value="selectedNodes[0] ? `[${selectedNodes[0].node.map(n => n.label).join(', ')}]` : ''" border-radius-mask="0110"/>
        </DataField>
        <DataField label="VersionIndex">
          <DataText :value="selectedNodes[0]?.vIndex" @setvalue="val => selectedNodes[0] && (selectedNodes[0].vIndex = val)" border-radius-mask="0110" :editable="!!selectedNodes[0]"/>
        </DataField>
        <DataField label="Parent">
          <DataText :value="selectedNodes[0]?.parent?.label" border-radius-mask="0110"/>
        </DataField>
        <!-- <DataField v-if="selectedNodes[0]?.children.length > 0" label="Children" direction="vertical" border-radius-offset="4px" slot-border-radius-offset="">
          <Tree :source="selectedNodes[0]"/>
        </DataField> -->
      </DataGroup>
    </TreeData>
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

.tree-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 0.5rem;
}
</style>
