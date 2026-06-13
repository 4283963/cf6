<template>
  <div class="revenue-pie-wrapper">
    <div ref="chartRef" class="pie-chart"></div>
    <div class="pie-legend">
      <div
        v-for="item in legendData"
        :key="item.role"
        class="legend-item"
      >
        <span class="legend-color" :style="{ background: item.color }"></span>
        <span class="legend-role">{{ item.roleLabel }}</span>
        <span class="legend-percent">{{ item.percentage }}%</span>
        <span class="legend-amount">¥{{ formatNumber(item.amount) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  shares: {
    type: Array,
    default: () => []
  },
  totalRevenue: {
    type: [Number, String],
    default: 0
  },
  title: {
    type: String,
    default: '版权分账比例'
  }
});

const chartRef = ref(null);
let chartInstance = null;

const roleColors = {
  LYRICIST: '#e94560',
  COMPOSER: '#d4af37',
  ARRANGER: '#10b981',
  LEAD_VOCAL: '#6366f1'
};

const roleLabels = {
  LYRICIST: '作词',
  COMPOSER: '作曲',
  ARRANGER: '编曲',
  LEAD_VOCAL: '主唱'
};

const legendData = ref([]);

function formatNumber(num) {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildChartData() {
  const shares = props.shares || [];
  legendData.value = shares.map(s => ({
    role: s.role,
    roleLabel: s.roleLabel || roleLabels[s.role] || s.role,
    percentage: s.percentage,
    amount: s.amount,
    color: roleColors[s.role] || '#8a8a9a'
  }));

  const total = parseFloat(props.totalRevenue) || shares.reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  const chartData = shares.map(s => ({
    name: s.roleLabel || roleLabels[s.role] || s.role,
    value: parseFloat(s.amount || 0) || (parseFloat(s.percentage || 0) * total / 100),
    itemStyle: {
      color: roleColors[s.role] || '#8a8a9a'
    }
  }));

  return { chartData, total };
}

function initChart() {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  renderChart();
}

function renderChart() {
  if (!chartInstance) return;

  const { chartData, total } = buildChartData();

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const percent = params.percent != null ? params.percent : 0;
        return `
          <div style="padding: 4px 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
            <div>金额: ¥${formatNumber(params.value)}</div>
            <div>占比: ${percent.toFixed(2)}%</div>
          </div>
        `;
      },
      backgroundColor: 'rgba(26, 26, 46, 0.95)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 13 }
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '80%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => [
            `{title|${props.title}}`,
            `{total|¥${formatNumber(total)}}`
          ].join('\n'),
          rich: {
            title: {
              fontSize: 13,
              color: '#8a8a9a',
              padding: [0, 0, 6, 0]
            },
            total: {
              fontSize: 24,
              fontWeight: 700,
              color: '#1a1a2e'
            }
          }
        },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 16,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.15)'
          }
        },
        data: chartData
      }
    ]
  };

  chartInstance.setOption(option, true);
}

function handleResize() {
  chartInstance?.resize();
}

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

watch(() => [props.shares, props.totalRevenue], () => {
  renderChart();
}, { deep: true });

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});
</script>

<style scoped>
.revenue-pie-wrapper {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.pie-chart {
  width: 320px;
  height: 320px;
  flex-shrink: 0;
}

.pie-legend {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: grid;
  grid-template-columns: 14px 60px 60px 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-role {
  font-weight: 500;
  color: var(--color-text);
}

.legend-percent {
  color: var(--color-accent);
  font-weight: 600;
}

.legend-amount {
  color: var(--color-primary);
  font-weight: 600;
  text-align: right;
}
</style>
