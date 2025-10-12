<script setup>
import { ref } from 'vue';

const { label, icon } = defineProps({
  label: {
    type: String,
    required: true
  },
  icon: String
});

const expanded = ref(true);
</script>

<template>
  <div class="data-group" :class="{ expanded }">
    <div class="group-label" @click="expanded = !expanded">
      <span v-if="icon" class="icon" :class="icon"></span>
      {{ label }}
    </div>
    <div class="children-container">
      <div class="group-children">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-group {
  display: flex;
  flex-direction: column;
  background-color: var(--region-light);
  border: 1px solid var(--border-darker);
  padding: 3px;
  border-radius: calc(var(--border-radius) + 3px);

  transition: border-radius 200ms;
}
.data-group.expanded {
  border-radius: calc(var(--border-radius) + 6px + 3px);
}

.group-label {
  cursor: pointer;
  display: flex;
  gap: 0.3em;
  align-items: center;
  background-color: var(--secondary-light);
  border: 1px solid var(--border);
  padding: var(--control-padding-2);
  border-radius: calc(var(--border-radius));

  transition: background-color 150ms, border-radius 200ms;
}
.data-group.expanded .group-label {
  border-radius: calc(var(--border-radius) + 6px);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.group-label:hover {
  background-color: var(--secondary-lighter);
  border-color: var(--border-light);
}
.group-label:active {
  background-color: var(--secondary);
  border-color: var(--border-light);
}

.children-container {
  display: grid;
  overflow: hidden;
  grid-template-rows: 0fr;

  transition: grid-template-rows 200ms;
}
.data-group.expanded .children-container {
  grid-template-rows: 1fr;
}

.group-children {
  margin-top: 3px;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  gap: 0.5rem;
  background-color: var(--region-light);
  border: 1px solid var(--border-dark);
  padding: 6px;
  border-radius: calc(var(--border-radius) + 6px);
  border-top-left-radius: 0;
  border-top-right-radius: 0;

  transition: margin-top 200ms;
}
.data-group:not(.expanded) .group-children {
  margin-top: -1rem;
}
</style>
