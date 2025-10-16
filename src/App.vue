<script setup>
import { ref, reactive, provide, onMounted, onBeforeUnmount } from 'vue';
import Tree from './components/Tree.vue';
import TreeData from './components/TreeData.vue';
import BottomPanel from './components/BottomPanel.vue';
import DataField from './components/DataField.vue';
import DataGroup from './components/DataGroup.vue';
import DataText from './components/DataText.vue';

const dir = 'D:/_ELECTRON/_XPLORER/Project';

const selectedNodes = reactive([]);
const lastNode = ref(null);
provide('selection', { selectedNodes, lastNode });

const ctrlCmdPressed = ref(false);
const shiftPressed = ref(false);

provide('ctrlCmdPressed', ctrlCmdPressed);
provide('shiftPressed', shiftPressed);

onMounted(() => {
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
  return path.substring(0, path.lastIndexOf('/'));
}

function renameNode(path, value) {
  window.explorer.rename(path, pathDir(path) + '/' + value);
}
</script>

<template>
  <main class="maingrid">
    <Tree :path="dir"/>
    <TreeData>
      <DataGroup label="Properties" icon="ui properties">
        <DataField label="Name">
          <DataText :value="selectedNodes[0]?.label" @setvalue="val => {
            if (selectedNodes[0])
              renameNode(selectedNodes[0].path, val);
          }"
          border-radius-mask="0110" :editable="!!selectedNodes[0]"/>
        </DataField>
        <DataField label="Type">
          <DataText :value="selectedNodes[0]?.type" border-radius-mask="0110"/>
        </DataField>
        <DataField label="Mime">
          <DataText :value="selectedNodes[0]?.mimeType" border-radius-mask="0110"/>
        </DataField>
      </DataGroup>

      <DataGroup label="Developer" icon="ui code">
        <DataField label="Id">
          <DataText :value="selectedNodes[0]?.id" border-radius-mask="0110"/>
        </DataField>
        <DataField label="Node">
          <DataText :value="selectedNodes[0] ? `[${selectedNodes[0].node.map(n => n.label).join(', ')}]` : ''" border-radius-mask="0110"/>
        </DataField>
        <DataField label="VersionIndex">
          <DataText :value="selectedNodes[0]?.vIndex" border-radius-mask="0110"/>
        </DataField>
        <DataField label="Parent">
          <DataText :value="selectedNodes[0]?.parent?.label" border-radius-mask="0110"/>
        </DataField>
        <!-- <DataField label="Tree" direction="vertical" border-radius-offset="4px" slot-border-radius-offset="">
          <Tree :path="dir"/>
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
</style>
