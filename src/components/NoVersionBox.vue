<script setup>
import ButtonDefault from './ButtonDefault.vue';
import { createVersion } from './model/nodeFunctions';

const { selected } = defineProps({
  selected: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div class="no-version-box">
    No version available.
    <ButtonDefault class="version" @click="createVersion(selected.nodes.at(-1).parent)">
      <span class="icon ui version"></span>
      Create a Version
    </ButtonDefault>
  </div>
</template>

<style scoped>
.no-version-box {
  font-size: 14px;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  color: var(--fg-dark);
  background-color: var(--secondary-dark);
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 0.5rem);
  margin: 1rem;
  padding: 0.5rem 2rem;
  gap: 0.5rem;
}
</style>
