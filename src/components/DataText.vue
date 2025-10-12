<script setup>
const { value } = defineProps({
  value: {
    required: true
  }
});
</script>

<template>
  <span class="data-text">
    {{ value }}
  </span>
</template>

<style scoped>
.data-text {
  flex: 1;
  font-size: 13px;
  background-color: var(--region);
  color: var(--fg-dark);
  border: 1px solid var(--border-darker);
  display: flex;
  overflow: hidden;
  align-items: center;
  height: 100%;
  border-radius: var(--border-radius);
  padding: 0 0.4em;
}
</style>
