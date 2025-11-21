<script setup>
import DataText from './DataText.vue';
import ButtonDefault from './ButtonDefault.vue';
import { ref, watchEffect } from 'vue';
import { addNode, deleteNodes } from './model/nodeFunctions';

const { source: tree, selected } = defineProps({
  source: Object,
  selected: {
    type: Object,
    required: true
  }
});

const invalidChars = `\\/:?"<>|\n`;

const mask = ref('');
watchEffect(() => {
  if (!tree) return;

  for (const node of tree.childrens()) {
    if (node.label.includes(mask.value) && !(node.label === '.version' && node.type === 'folder')) {
      node.hidden = false;

      node.parents().forEach(p => {
        if (!(p.label === '.version' && p.type === 'folder'))
          p.hidden = false;
      });
    }
    else
      node.hidden = true;
  }
});
</script>

<template>
  <div class="tree-tools">
    <DataText v-show="!!selected.nodes.at(-1)" :value="selected.nodes.at(-1)?.path" type="select" focus-mode="select" font-size="12px" style="color: var(--fg-dark); margin-right: 0.5em;"/>
    <DataText v-show="!selected.nodes.at(-1)" :value="mask" :type="tree ? 'edit' : 'none'" @livevalue="val => mask = val" :invalid-chars="invalidChars" focus-mode="select" font-size="12px" style="color: var(--fg-dark); margin-right: 0.5em;"/>

    <ButtonDefault class="icon" :disabled="!source || !selected.nodes.at(-1)">
      <span class="icon ui file-add"></span>

      <template #dropdown>
        <ButtonDefault class="ghost">
          <span class="icon ui plus-box"></span>
          New File
        </ButtonDefault>
        <ButtonDefault class="ghost">
          <span class="icon ui upload"></span>
          Import File
        </ButtonDefault>
      </template>
    </ButtonDefault>

    <ButtonDefault class="icon" @click="addNode(selected.nodes.at(-1), 'New Folder', 'folder')" :disabled="!source || !selected.nodes.at(-1)">
      <span class="icon ui folder-add"></span>
    </ButtonDefault>

    <!-- <ButtonDefault class="icon version" :disabled="!source || !selected.nodes.at(-1)">
      <span class="icon ui version"></span>
    </ButtonDefault> -->

    <div class="divider"></div>

    <ButtonDefault class="icon danger" @click="deleteNodes(selected.nodes)" :disabled="!source || !selected.nodes.at(-1)">
      <span class="icon ui delete"></span>
    </ButtonDefault>

    <div class="divider"></div>

    <ButtonDefault class="icon" dropdown-offset="100%" :disabled="!source">
      <span class="icon ui dots"></span>

      <template #dropdown>
        <ButtonDefault class="ghost" @click="tree.childrens().forEach(c => c.expanded = true)">
          <span class="icon ui expand-all"></span>
          Expand All
        </ButtonDefault>
        <ButtonDefault class="ghost" @click="tree.childrens().forEach(c => c.expanded = false)">
          <span class="icon ui collapse-all"></span>
          Collapse All
        </ButtonDefault>
      </template>
    </ButtonDefault>
  </div>
</template>

<style scoped>
.tree-tools {
  display: flex;
  align-items: center;
  font-size: 13px;
  gap: 2px;
  background-color: var(--region-light);
  border: 1px solid var(--border-dark);
  padding: 2px;
  border-radius: calc(var(--border-radius) + 2px);
}

.divider {
  width: 1px;
  height: 90%;
  margin-inline: 2px;
  background-color: var(--border-darker);
}
</style>
