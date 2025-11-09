<script setup>
import { ref, watch, inject, onMounted } from 'vue';
import DataField from './/DataField.vue';
import DataGroup from './/DataGroup.vue';
import DataText from './/DataText.vue';
import { TNode } from './model/TNode';
import VTree from './VTree.vue';
import { onStartTyping, useMagicKeys, whenever } from '@vueuse/core';

const isDev = inject('isDev');

const { selected } = defineProps({
  selected: {
    type: Object,
    required: true
  }
});

function pathDir(path) {
  return path.substring(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')));
}

function renameNode(path, value) {
  window.explorer.rename(path, pathDir(path) + '/' + value);
}

const tempNode = ref(null);
watch(() => selected.nodes.slice(), () => tempNode.value = selected.nodes[0] || null, { deep: true });
const invalidChars = `\\/:?"<>|\n`;

const vTree = ref(null);
onMounted(() => {
  vTree.value.$el.style.height = '7rem';
});

const labelRef = ref(null);

const { f2 } = useMagicKeys();

function focusLabel() {
  if (labelRef.value && !labelRef.value.active)
    labelRef.value.focus();
}

whenever(f2, focusLabel);
onStartTyping(focusLabel);
</script>

<template>
  <div class="tree-data">
    <DataGroup label="Properties" icon="ui properties">
      <DataField label="Name">
        <DataText ref="labelRef" :value="selected.nodes[0]?.label" :invalid-chars="invalidChars" focus-mode="select-name"
          @setvalue="val => {
            if (selected.nodes[0])
              renameNode(selected.nodes[0].path, val);
          }"
          @livevalue="val => {
            if (selected.nodes[0])
              tempNode = new TNode(val, selected.nodes[0].type);
          }"
          :editable="!!selected.nodes[0]" border-radius-mask="0110">
          <span v-if="selected.nodes[0] && tempNode" :title="tempNode?.mimeType || undefined" class="icon" :class="[tempNode.type, ...(tempNode.type !== 'folder' ? [tempNode.mimeType ? tempNode.mimeType.replace('/', ' ') : null, tempNode.extension] : [])].filter(Boolean).join(' ')"></span>
        </DataText>
      </DataField>
      <DataField label="Type">
        <DataText :value="selected.nodes[0]?.type" border-radius-mask="0110"/>
      </DataField>
    </DataGroup>

    <DataGroup v-show="selected.nodes[0] && selected.nodes[0]?.version.index !== -1" label="Version Control" icon="ui version">
      <template v-if="isDev">
        <DataField label="Index">
          <DataText :value="selected.nodes[0]?.version.index" @setvalue="val => selected.nodes[0] && (selected.nodes[0].version.index = JSON.parse(val))" :editable="!!selected.nodes[0] && selected.nodes[0]?.version.index !== -1" focus-mode="select" border-radius-mask="0110"/>
        </DataField>
      </template>

      <DataField v-show="selected.nodes[0]?.version.index !== -1" label="Versions" direction="vertical" border-radius-offset="4px" slot-border-radius-offset="">
        <VTree ref="vTree" :source="selected.nodes[0]?.version.node" :index="selected.nodes[0]?.version.index" @set-index="newIndex => selected.nodes[0].version.index = newIndex" style="resize: vertical; min-height: 5.3rem;"/>
      </DataField>
    </DataGroup>

    <DataGroup v-if="isDev" label="Developer" icon="ui code">
      <DataField label="Id">
        <DataText :value="selected.nodes[0]?.id" border-radius-mask="0110"/>
      </DataField>
      <DataField label="Extension">
        <DataText :value="tempNode?.extension" border-radius-mask="0110"/>
      </DataField>
      <DataField label="Mime">
        <DataText :value="tempNode?.mimeType" border-radius-mask="0110"/>
      </DataField>
      <DataField label="Expanded">
        <DataText :value="selected.nodes[0]?.expanded" @setvalue="val => selected.nodes[0] && (selected.nodes[0].expanded = JSON.parse(val))" :editable="!!selected.nodes[0]" border-radius-mask="0110"/>
      </DataField>
      <DataField label="Parent">
        <DataText :value="selected.nodes[0]?.parent?.label" border-radius-mask="0110"/>
      </DataField>
    </DataGroup>
  </div>
</template>

<style scoped>
.tree-data {
  display: flex;
  overflow-y: auto;
  flex-direction: column;
  gap: 0.5rem;
  background-color: var(--region-light);
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 2px);
  padding: 1rem;
}
</style>
