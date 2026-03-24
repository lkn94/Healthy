<template>
  <div class="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-glow">
    <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
      <slot name="label">Label</slot>
      <slot name="meta"></slot>
    </div>
    <p class="mt-3 text-4xl font-display text-white">
      <slot></slot>
    </p>
    <p class="mt-2 text-sm text-white/60">
      <slot name="description"></slot>
    </p>
  </div>
</template>
