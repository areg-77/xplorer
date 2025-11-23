<script setup>
import { ref, watch, inject, onMounted } from 'vue';
import DataField from './DataField.vue';
import DataGroup from './DataGroup.vue';
import DataText from './DataText.vue';
import { TNode } from './model/TNode';
import { onStartTyping, useMagicKeys, whenever } from '@vueuse/core';
import { renameNode } from './model/nodeFunctions';
import VersionPanel from './VersionPanel.vue';

const isDev = inject('isDev');

const { source: tree, selected } = defineProps({
  source: Object,
  selected: {
    type: Object,
    required: true
  }
});

const tempNode = ref(null);
watch(() => selected.nodes.slice(), () => tempNode.value = selected.nodes.at(-1) || null, { deep: true });
const invalidChars = `\\/:?"<>|\n`;

const { f2 } = useMagicKeys();

const labelRef = ref(null);
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
        <DataText ref="labelRef" :value="selected.nodes.at(-1)?.label" :invalid-chars="invalidChars" focus-mode="select-name"
          @setvalue="val => {
            if (selected.nodes.at(-1))
              renameNode(selected.nodes.at(-1).path, val);
          }"
          @livevalue="val => {
            if (selected.nodes.at(-1))
              tempNode = new TNode(val, selected.nodes.at(-1).type);
          }"
          :type="!!selected.nodes.at(-1) ? 'edit' : 'none'" border-radius-mask="0110">
          <span v-if="selected.nodes.at(-1) && tempNode" :title="tempNode?.mimeType || undefined" class="icon" :class="[tempNode.type, ...(tempNode.type !== 'folder' ? [tempNode.mimeType ? tempNode.mimeType.replace('/', ' ') : null, tempNode.extension] : [])].filter(Boolean).join(' ')"></span>
        </DataText>
      </DataField>
      <DataField label="Type">
        <DataText :value="selected.nodes.at(-1)?.type" border-radius-mask="0110"/>
      </DataField>
    </DataGroup>

    <DataGroup v-show="selected.nodes.at(-1) && (selected.nodes.at(-1)?.version.index !== -1 || selected.nodes.at(-1)?.parent.children[0].equals(selected.nodes.at(-1)))" label="Version Control" icon="ui version" class="version">
      <template v-if="isDev">
        <DataField label="Index">
          <DataText :value="selected.nodes.at(-1)?.version.index" @setvalue="val => selected.nodes.at(-1) && (selected.nodes.at(-1).version.index = JSON.parse(val))" :type="!!selected.nodes.at(-1) && selected.nodes.at(-1)?.version.index !== -1 ? 'edit' : 'none'" focus-mode="select" border-radius-mask="0110"/>
        </DataField>
      </template>

      <DataField label="Versions" direction="vertical">
        <VersionPanel :source="tree" :selected="selected" border-radius-mask="0011"/>
      </DataField>
    </DataGroup>

    <DataGroup v-if="isDev" label="Developer" icon="ui code">
      <DataField label="Id">
        <DataText :value="selected.nodes.at(-1)?.id" border-radius-mask="0110"/>
      </DataField>
      <DataField label="Extension">
        <DataText :value="tempNode?.extension" border-radius-mask="0110"/>
      </DataField>
      <DataField label="Mime">
        <DataText :value="tempNode?.mimeType" border-radius-mask="0110"/>
      </DataField>
      <DataField label="Expanded">
        <DataText :value="selected.nodes.at(-1)?.expanded" focus-mode="select" @setvalue="val => selected.nodes.at(-1) && (selected.nodes.at(-1).expanded = JSON.parse(val))" :type="!!selected.nodes.at(-1) ? 'edit' : 'none'" border-radius-mask="0110"/>
      </DataField>
      <DataField label="Parent">
        <DataText :value="selected.nodes.at(-1)?.parent?.label" border-radius-mask="0110"/>
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
