<script setup>
const props = defineProps({
  id: Number,
  title: String,
  likes: Number,
});

const emit = defineEmits(['like']);

function sendLike() {
  emit('like', props.id);
}
</script>

<template>
  <div style="border: 1px solid blue; margin: 10px; padding: 15px">
    <h3>{{ title }}</h3>

    <p>
      Like-uri pentru această secțiune:
      <strong>{{ likes }}</strong>
    </p>

    <button @click="sendLike">👍 Like</button>
  </div>
</template>
