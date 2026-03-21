<script setup lang="ts">
import { ref, onMounted } from 'vue'

const modules = [
  {
    id: 'M1',
    title: '为什么需要 Fiber',
    desc: '旧同步渲染模型的控制力问题',
    color: '#61dafb',
    icon: '?',
    link: '/modules/m1',
    keyword: '问题意识',
  },
  {
    id: 'M2',
    title: 'Fiber 节点与树遍历',
    desc: '工作单元的结构与遍历骨架',
    color: '#4ade80',
    icon: '{}',
    link: '/modules/m2',
    keyword: '数据结构',
  },
  {
    id: 'M3',
    title: '双树与 render/commit',
    desc: 'current / workInProgress / 提交分离',
    color: '#a78bfa',
    icon: '||',
    link: '/modules/m3',
    keyword: '双树模型',
  },
  {
    id: 'M4',
    title: '一次 setState 全链路',
    desc: '从组件到 root，再到 commit 的完整过程',
    color: '#fb923c',
    icon: '->',
    link: '/modules/m4',
    keyword: '动态过程',
  },
  {
    id: 'M5',
    title: 'lanes / priority / scheduler',
    desc: '多条更新并存时的优先级协作',
    color: '#e8d44d',
    icon: '##',
    link: '/modules/m5',
    keyword: '调度系统',
  },
  {
    id: 'M6',
    title: 'Suspense / Offscreen / retry',
    desc: '工作卡住时的回退、隐藏与恢复',
    color: '#f87171',
    icon: '!!',
    link: '/modules/m6',
    keyword: '异常处理',
  },
]

const visible = ref(false)

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        visible.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.1 }
  )

  const el = document.querySelector('.module-timeline')
  if (el) observer.observe(el)
})
</script>

<template>
  <section class="module-timeline" :class="{ visible }">
    <div class="timeline-header">
      <span class="section-label">LEARNING PATH</span>
      <h2 class="section-title">六个模块，一条因果链</h2>
      <p class="section-desc">
        不是六个并列知识点，而是一条逐步加骨架的解释路径
      </p>
    </div>

    <div class="timeline-track">
      <!-- The fiber line -->
      <div class="fiber-line" />

      <div
        v-for="(mod, i) in modules"
        :key="mod.id"
        class="timeline-node"
        :style="{
          '--delay': `${i * 0.12}s`,
          '--color': mod.color,
        }"
      >
        <div class="node-connector">
          <div class="node-dot" />
        </div>

        <a :href="mod.link" class="node-card">
          <div class="card-header">
            <span class="card-id">{{ mod.id }}</span>
            <span class="card-keyword">{{ mod.keyword }}</span>
          </div>
          <h3 class="card-title">{{ mod.title }}</h3>
          <p class="card-desc">{{ mod.desc }}</p>
          <span class="card-arrow">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.module-timeline {
  padding: 4rem 2rem 5rem;
  max-width: 900px;
  margin: 0 auto;
}

.timeline-header {
  text-align: center;
  margin-bottom: 3.5rem;
}

.section-label {
  display: inline-block;
  font-family: var(--fiber-font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--fiber-blue);
  background: rgba(97, 218, 251, 0.08);
  padding: 4px 14px;
  border-radius: 999px;
  margin-bottom: 1rem;
}

.section-title {
  font-family: var(--fiber-font-heading);
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  font-weight: 700;
  color: var(--fiber-text);
  margin: 0.8rem 0 0.6rem;
}

.section-desc {
  color: var(--fiber-text-3);
  font-size: 1rem;
}

.timeline-track {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.fiber-line {
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    180deg,
    var(--fiber-blue) 0%,
    var(--fiber-green) 20%,
    var(--fiber-purple) 40%,
    var(--fiber-orange) 60%,
    var(--fiber-gold) 80%,
    var(--fiber-red) 100%
  );
  opacity: 0.3;
  border-radius: 1px;
}

.timeline-node {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 0.75rem 0;
  opacity: 0;
  transform: translateX(-10px);
  transition: opacity 0.5s ease var(--delay), transform 0.5s ease var(--delay);
}

.visible .timeline-node {
  opacity: 1;
  transform: translateX(0);
}

.node-connector {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-width: 40px;
  padding-top: 1.2rem;
}

.node-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color);
  box-shadow: 0 0 12px var(--color), 0 0 4px var(--color);
  position: relative;
  z-index: 1;
}

.node-card {
  flex: 1;
  display: block;
  padding: 1.2rem 1.5rem;
  background: var(--fiber-bg-card);
  border: 1px solid var(--fiber-border);
  border-radius: var(--fiber-radius);
  text-decoration: none;
  color: inherit;
  position: relative;
  transition: all 0.25s ease;
  overflow: hidden;
}

.node-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color);
  opacity: 0.6;
  transition: opacity 0.25s ease;
}

.node-card:hover {
  border-color: var(--color);
  background: rgba(15, 23, 41, 0.9);
  transform: translateX(4px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--color);
}

.node-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0.5rem;
}

.card-id {
  font-family: var(--fiber-font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color);
  background: color-mix(in srgb, var(--color) 12%, transparent);
  padding: 2px 10px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.card-keyword {
  font-family: var(--fiber-font-mono);
  font-size: 0.65rem;
  color: var(--fiber-text-3);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.card-title {
  font-family: var(--fiber-font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--fiber-text);
  margin: 0 0 0.3rem;
}

.card-desc {
  font-size: 0.85rem;
  color: var(--fiber-text-3);
  margin: 0;
  line-height: 1.5;
}

.card-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--fiber-text-3);
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.node-card:hover .card-arrow {
  opacity: 1;
  transform: translateY(-50%) translateX(3px);
  color: var(--color);
}

@media (max-width: 640px) {
  .module-timeline {
    padding: 3rem 1rem;
  }

  .fiber-line {
    left: 14px;
  }

  .node-connector {
    width: 28px;
    min-width: 28px;
  }

  .node-dot {
    width: 10px;
    height: 10px;
  }

  .timeline-node {
    gap: 1rem;
  }

  .node-card {
    padding: 1rem;
  }

  .card-arrow {
    display: none;
  }
}
</style>
