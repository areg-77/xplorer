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
  background-color: var(--region);;
  border: 1px solid var(--border-darker);
  display: flex;
  overflow: hidden;
  align-items: center;
  height: 100%;
  border-radius: calc(var(--border-radius) - 2px);
  padding: 0 0.4em;
}
</style>
