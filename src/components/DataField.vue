<script setup>
const { label } = defineProps({
  label: {
    type: String,
    required: true
  }
});
</script>

<template>
  <div class="data-field">
    <div class="data-label">{{ label }}</div>
    <div class="data-value">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.data-field {
  display: flex;
  flex-shrink: 0;
  overflow: hidden;
  background-color: var(--region);
  padding: 3px;
  border-radius: calc(var(--border-radius) + 3px);
}

.data-label {
  display: flex;
  align-items: center;
  overflow: hidden;
  background-color: var(--secondary);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  padding: var(--control-padding-1);
}

.data-value {
  flex: 1;
  display: flex;
  overflow: hidden;
  align-items: center;
  background-color: var(--region-light);
  border: 1px solid var(--border-dark);
  border-left: none;
  border-radius: var(--border-radius);
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  padding: 2px;
}
</style>
