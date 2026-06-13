<template>
  <div class="revenue-share-chart">
    <div ref="chartRef" class="chart-container"></div>
    <div class="chart-legend">
      <div
        v-for="item in shares"
        :key="item.id"
        class="legend-item"
      >
        <span class="legend-dot" :style="{ background: getRoleColor(item.role) }"></span>
        <span class="legend-label">{{ item.roleLabel }}</span>
        <span class="legend-name">{{ item.musicianName }}</span>
        <span class="legend-percent">{{ item.percentage }}%</span>
        <span class="legend-amount">¥{{ formatNumber(item.amount) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts';

const props = defineProps({
  shares: { type: Array, default: () => [] },
  totalAmount: { type: [Number, String], default: 0 }
});

const chartRef = ref(null);
let chartInstance = null;

const getRoleColor = (role) => {
  const colors = {
    LYRICIST: '#e94560',
    COMPOSER: '#d4af37',
    ARRANGER: '#4f46e5',
    LEAD_VOCAL: '#10b981'
  };
  return colors[role] || '#9ca3af';
};

const formatNumber = (num) => {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const initChart = () => {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);

  const data = props.shares.map(s => ({
    name: `${s.roleLabel} - ${s.musicianName}`,
    value: s.amount || (parseFloat(s.percentage) * parseFloat(props.totalAmount || 0) / 100),
    itemStyle: { color: getRoleColor(s.role) }
  }));

  const total = parseFloat(props.totalAmount) || data.reduce((s, d) => s + d.value, 0);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const share = props.shares[params.dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
            <div>比例: <b>${share?.percentage || 0}%</b></div>
            <div>金额: <b style="color: #e94560;">¥${formatNumber(params.value)}</b></div>
          </div>
        `;
      }
    },
    series: [
      {
        name: '分账明细',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 3
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            return `{a|总收益}\n{b|¥${formatNumber(total)}}`;
          },
          rich: {
            a: {
              fontSize: 13,
              color: '#8a8a9a',
              lineHeight: 22
            },
            b: {
              fontSize: 24,
              fontWeight: 700,
              color: '#1a1a2e',
              lineHeight: 32
            }
          }
        },
        emphasis: {
          label: {
            show: true
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        labelLine: {
          show: false
        },
        data
      }
    ]
  };

  chartInstance.setOption(option);
};

const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});

watch(() => [props.shares, props.totalAmount], () => {
  nextTick(() => initChart());
}, { deep: true });
</script>

<style scoped>
.revenue-share-chart {
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 320px;
}

.chart-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-bg);
  border-radius: 8px;
  font-size: 13px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-weight: 600;
  color: var(--color-text);
  flex-shrink: 0;
}

.legend-name {
  color: var(--color-muted);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-percent {
  font-weight: 600;
  color: var(--color-primary);
  flex-shrink: 0;
}

.legend-amount {
  color: var(--color-accent);
  font-weight: 600;
  flex-shrink: 0;
}
</style>
