<script setup>
import DataText from './DataText.vue';
import ButtonDefault from './ButtonDefault.vue';

const { source: tree, selected } = defineProps({
  source: Object,
  selected: {
    type: Object,
    required: true
  }
});

function deleteSelected() {
  Promise.all(selected.nodes.map(s => window.explorer.delete(s.path)));
}

function createFolder() {
  window.explorer.createFolder(selected.nodes[0]?.path, 'New Folder');
}
</script>

<template>
  <div class="tree-tools">
    <DataText :value="selected.nodes[0]?.path" font-size="12px" style="color: var(--fg-dark); margin-right: 0.5em;"/>

    <ButtonDefault class="icon" :disabled="!source || !selected.nodes[0]">
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

    <ButtonDefault class="icon" @click="createFolder" :disabled="!source || !selected.nodes[0]">
      <span class="icon ui folder-add"></span>
    </ButtonDefault>

    <!-- <ButtonDefault class="icon version" :disabled="!source || !selected.nodes[0]">
      <span class="icon ui version"></span>
    </ButtonDefault> -->

    <div class="divider"></div>

    <ButtonDefault class="icon danger" @click="deleteSelected" :disabled="!source || !selected.nodes[0]">
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
  height: 1.5em;
  margin-inline: 2px;
  background-color: var(--border-darker);
}
</style>
