<template>
  <Teleport to="body">
    <div v-if="visible" class="wheel-mask" @click.self="handleClose">
      <div class="wheel-dialog" :class="{ show: animatedShow }">
        <div class="wheel-header">
          <div>
            <div class="wheel-title">🎖️ 黑胶专属编号刻字</div>
            <div class="wheel-sub">
              选择你的幸运数字，这个编号将永久蚀刻在你的限量版黑胶唱片标签上
              <span class="wheel-remain">
                · 剩余 <b>{{ available }}</b> / {{ maxNumber }} 个编号
              </span>
            </div>
          </div>
          <button class="wheel-close" @click="handleClose" :disabled="locking">×</button>
        </div>

        <div class="wheel-main">
          <div class="wheel-stage">
            <div class="wheel-ring-outer">
              <div
                class="wheel-rotate"
                :style="{ transform: `rotate(${wheelDeg}deg)`, transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none' }"
              >
                <div class="wheel-ring">
                  <div
                    v-for="n in displayNumbers"
                    :key="n"
                    :class="['wheel-sector', getSectorClass(n)]"
                    :style="{ transform: `rotate(${(n - 1) * sectorDeg}deg)` }"
                  >
                    <div class="sector-label" :style="{ transform: `rotate(${sectorDeg / 2}deg) translateY(-62%)` }">
                      <span class="sector-number">{{ formatNum(n) }}</span>
                      <span v-if="isLucky(n)" class="lucky-star">★</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="wheel-pointer"></div>

              <div class="wheel-center">
                <div v-if="!spinning" class="center-number" :class="{ lucky: isLucky(selectedNumber), occupied: isOccupied(selectedNumber) }">
                  <span class="center-prefix">NO.</span>
                  <span class="center-value">{{ formatNum(selectedNumber) }}</span>
                </div>
                <div v-else class="center-spinner">
                  <div class="spinner-ring"></div>
                </div>
              </div>
            </div>

            <button
              class="spin-btn"
              :disabled="spinning || locking"
              @click="spin"
            >
              {{ spinning ? '转动中...' : '🎲 随机转一下' }}
            </button>
          </div>

          <div class="wheel-side">
            <div class="side-card">
              <div class="side-title">🔢 手动选号</div>
              <div class="manual-row">
                <input
                  type="number"
                  v-model.number="inputNumber"
                  :min="1"
                  :max="maxNumber"
                  class="manual-input"
                  :disabled="locking"
                  placeholder="输入 1 - 500"
                  @keyup.enter="confirmManual"
                />
                <button class="btn btn-ghost btn-sm" :disabled="locking" @click="confirmManual">确定</button>
              </div>
              <div class="side-tip" v-if="lastCheckResult">
                <span :class="['tip-icon', lastCheckResult.ok ? 'ok' : 'bad']">
                  {{ lastCheckResult.ok ? '✅' : '⚠️' }}
                </span>
                <span :class="lastCheckResult.ok ? 'tip-ok' : 'tip-bad'">{{ lastCheckResult.msg }}</span>
              </div>
            </div>

            <div class="side-card">
              <div class="side-title">⭐ 热门幸运数字</div>
              <div class="lucky-list">
                <button
                  v-for="n in luckyNumbers"
                  :key="n"
                  :class="['lucky-chip', { selected: selectedNumber === n, occupied: isOccupied(n) }]"
                  :disabled="locking || isOccupied(n)"
                  @click="selectNumber(n)"
                >
                  {{ formatNum(n) }}
                </button>
              </div>
            </div>

            <div class="side-card preview-card">
              <div class="side-title">💿 刻字预览</div>
              <div class="vinyl-preview">
                <div class="preview-disc">
                  <div class="preview-grooves"></div>
                  <div class="preview-label">
                    <span class="label-title">黑胶专属</span>
                    <span class="label-number">NO.{{ formatNum(selectedNumber) }}</span>
                  </div>
                </div>
              </div>
              <div class="preview-desc">
                编号将刻在唱片中心标签的金色序列号位置
              </div>
            </div>
          </div>
        </div>

        <div class="wheel-footer">
          <button class="btn btn-ghost" :disabled="locking" @click="handleClose">
            {{ orderEngravingNumber != null ? `保留当前编号 ${formatNum(orderEngravingNumber)}` : '稍后再选' }}
          </button>
          <button
            class="btn btn-gold"
            :disabled="spinning || locking || isOccupied(selectedNumber) || !isValidRange(selectedNumber)"
            @click="confirmLock"
          >
            <template v-if="locking">
              <span class="btn-spinner"></span> 锁定中...
            </template>
            <template v-else>🔒 锁定编号 NO.{{ formatNum(selectedNumber) }}</template>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { orderApi, useToast } from '@/api';

const props = defineProps({
  visible: Boolean,
  vinylRecordId: { type: [Number, String], required: true },
  orderId: { type: [Number, String], required: true },
  orderEngravingNumber: { type: Number, default: null }
});

const emit = defineEmits(['close', 'locked']);
const toast = useToast();

const sectorCount = 24;
const sectorDeg = 360 / sectorCount;
const maxNumber = 500;

const occupied = ref(new Set());
const available = ref(maxNumber);
const spinning = ref(false);
const locking = ref(false);
const animatedShow = ref(false);
const wheelDeg = ref(0);
const selectedNumber = ref(1);
const inputNumber = ref(1);
const lastCheckResult = ref(null);
const displayNumbers = ref([]);

const luckyNumbers = [6, 8, 9, 66, 88, 99, 168, 188, 520, 521, 666, 888];

const isValidRange = (n) => Number.isInteger(n) && n >= 1 && n <= maxNumber;
const isOccupied = (n) => occupied.value.has(n);
const isLucky = (n) => luckyNumbers.includes(n);
const formatNum = (n) => (Number.isInteger(n) ? String(n).padStart(3, '0') : '—');

function getSectorClass(n) {
  if (isOccupied(n)) return 'occupied';
  if (isLucky(n)) return 'lucky';
  return 'normal';
}

function generateSectorNumbers(center) {
  const arr = [];
  const half = Math.floor(sectorCount / 2);
  for (let i = 0; i < sectorCount; i++) {
    let n = center - half + i;
    if (n < 1) n += maxNumber;
    if (n > maxNumber) n -= maxNumber;
    arr.push(n);
  }
  displayNumbers.value = arr;
}

function selectNumber(n) {
  if (locking.value || spinning.value) return;
  if (!isValidRange(n)) return;
  if (isOccupied(n)) {
    lastCheckResult.value = { ok: false, msg: `NO.${formatNum(n)} 已被别人抢先啦！` };
    return;
  }
  selectedNumber.value = n;
  inputNumber.value = n;
  lastCheckResult.value = isLucky(n)
    ? { ok: true, msg: `太棒了！NO.${formatNum(n)} 是个幸运数字 🎉` }
    : { ok: true, msg: `已选择 NO.${formatNum(n)}` };
  generateSectorNumbers(n);
  wheelDeg.value = -((n - 1) * sectorDeg) % 360;
}

async function confirmManual() {
  const n = parseInt(inputNumber.value);
  if (!isValidRange(n)) {
    lastCheckResult.value = { ok: false, msg: '请输入 1 到 500 之间的整数' };
    return;
  }
  selectNumber(n);
}

function spin() {
  if (spinning.value || locking.value) return;
  spinning.value = true;
  lastCheckResult.value = null;

  const fullRounds = 5 + Math.floor(Math.random() * 4);
  let target;
  let tries = 0;
  do {
    target = Math.floor(Math.random() * maxNumber) + 1;
    tries++;
  } while (isOccupied(target) && tries < 50);

  if (isOccupied(target)) {
    for (let i = 1; i <= maxNumber; i++) {
      if (!isOccupied(i)) { target = i; break; }
    }
  }

  const finalDeg = wheelDeg.value - (fullRounds * 360 + (target - 1) * sectorDeg % 360);
  wheelDeg.value = finalDeg;
  generateSectorNumbers(target);

  setTimeout(() => {
    selectedNumber.value = target;
    inputNumber.value = target;
    spinning.value = false;
    lastCheckResult.value = isLucky(target)
      ? { ok: true, msg: `转到幸运数字 NO.${formatNum(target)}！手气超棒 🌟` }
      : { ok: true, msg: `指针指向 NO.${formatNum(target)}` };
  }, 4100);
}

async function confirmLock() {
  if (locking.value || spinning.value) return;
  const n = selectedNumber.value;
  if (!isValidRange(n)) {
    toast.show('请选择有效的编号', 'warn');
    return;
  }
  if (isOccupied(n)) {
    lastCheckResult.value = { ok: false, msg: `NO.${formatNum(n)} 已被抢占，请换一个！` };
    return;
  }
  locking.value = true;
  try {
    const res = await orderApi.lockEngravingNumber({
      orderId: props.orderId,
      engravingNumber: n
    });
    if (res.success) {
      occupied.value.add(n);
      available.value = Math.max(0, available.value - 1);
      toast.show(res.message, 'success');
      emit('locked', res.data);
      setTimeout(() => {
        emit('close');
      }, 600);
    } else {
      if (res.code === 'ENGRAVING_OCCUPIED') {
        occupied.value.add(res.data?.requestedNumber ?? n);
        lastCheckResult.value = { ok: false, msg: res.message || '编号被抢占' };
      } else if (res.code === 'ENGRAVING_ALREADY_SET') {
        toast.show(res.message, 'warn');
        emit('locked', { engravingNumber: res.data?.currentNumber });
        emit('close');
      } else {
        toast.show(res.message || '锁定失败', 'error');
      }
    }
  } catch (e) {
    toast.show(e.message || '锁定失败，请重试', 'error');
  } finally {
    locking.value = false;
  }
}

async function fetchOccupied() {
  try {
    const res = await orderApi.getEngravingNumbers(props.vinylRecordId);
    if (res.success) {
      occupied.value = new Set(res.data.occupied || []);
      available.value = res.data.available ?? maxNumber;
    }
  } catch (e) {
    console.error('获取编号占用情况失败', e);
  }
}

function handleClose() {
  if (locking.value) return;
  emit('close');
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      animatedShow.value = false;
      fetchOccupied().then(() => {
        requestAnimationFrame(() => {
          animatedShow.value = true;
        });
        let initial = props.orderEngravingNumber;
        if (!initial || isOccupied(initial)) {
          for (let i = 1; i <= maxNumber; i++) {
            if (!isOccupied(i)) { initial = i; break; }
          }
        }
        selectedNumber.value = initial || 1;
        inputNumber.value = initial || 1;
        generateSectorNumbers(selectedNumber.value);
        wheelDeg.value = -((selectedNumber.value - 1) * sectorDeg) % 360;
        lastCheckResult.value = null;
      });
    } else {
      animatedShow.value = false;
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (props.visible) fetchOccupied();
});
</script>

<style scoped>
.wheel-mask {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 25, 0.78);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: mask-in 0.25s ease;
}
@keyframes mask-in { from { opacity: 0; } to { opacity: 1; } }

.wheel-dialog {
  width: min(960px, 100%);
  background: linear-gradient(180deg, #14142b 0%, #1a1a35 100%);
  color: #fff;
  border-radius: 24px;
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.25);
  overflow: hidden;
  transform: translateY(40px) scale(0.95);
  opacity: 0;
  transition: all 0.35s cubic-bezier(0.15, 0.85, 0.25, 1);
}
.wheel-dialog.show { transform: translateY(0) scale(1); opacity: 1; }

.wheel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 24px 28px 16px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}
.wheel-title { font-size: 22px; font-weight: 700; letter-spacing: 0.5px; color: #ffd97a; }
.wheel-sub { margin-top: 6px; font-size: 13px; color: rgba(255, 255, 255, 0.65); }
.wheel-remain b { color: #ffd97a; font-weight: 700; }

.wheel-close {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.wheel-close:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); }

.wheel-main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  padding: 24px 28px;
}

.wheel-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.wheel-ring-outer {
  position: relative;
  width: 360px;
  height: 360px;
}

.wheel-rotate {
  position: absolute;
  inset: 0;
  transform-origin: 50% 50%;
  will-change: transform;
}

.wheel-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  overflow: hidden;
  background: conic-gradient(from 0deg, #2a1e14, #3a2e1f, #2a1e14);
  box-shadow: inset 0 0 0 8px #1a1a2b, inset 0 0 0 10px rgba(212, 175, 55, 0.5), 0 20px 50px rgba(0, 0, 0, 0.5);
}

.wheel-sector {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 50%;
  height: 50%;
  transform-origin: 0 0;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

.wheel-sector.normal { background: rgba(212, 175, 55, 0.06); }
.wheel-sector.lucky { background: linear-gradient(90deg, rgba(233, 69, 96, 0.35), rgba(212, 175, 55, 0.25)); }
.wheel-sector.occupied { background: rgba(107, 114, 128, 0.2); }
.wheel-sector.occupied .sector-number { text-decoration: line-through; opacity: 0.35; }

.sector-label {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-origin: 0 0;
  padding-top: 10px;
}
.sector-number { font-size: 11px; color: #fff; font-weight: 600; letter-spacing: 0.5px; }
.wheel-sector.lucky .sector-number { color: #ffd97a; text-shadow: 0 0 8px rgba(212, 175, 55, 0.6); }
.lucky-star { font-size: 9px; color: #ffd97a; line-height: 1; margin-top: 1px; }

.wheel-pointer {
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-top: 26px solid #e94560;
  filter: drop-shadow(0 3px 6px rgba(233, 69, 96, 0.5));
  z-index: 10;
}
.wheel-pointer::after {
  content: '';
  position: absolute;
  top: -30px;
  left: -6px;
  width: 12px;
  height: 12px;
  background: #e94560;
  border-radius: 50%;
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, #1a1a2b 0%, #0a0a1a 100%);
  box-shadow: inset 0 0 0 5px rgba(212, 175, 55, 0.5), 0 6px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 5;
}
.center-prefix { font-size: 10px; color: rgba(255, 255, 255, 0.4); letter-spacing: 2px; }
.center-value { font-size: 38px; font-weight: 800; color: #ffd97a; letter-spacing: 2px; line-height: 1; }
.center-number.lucky .center-value { color: #e94560; text-shadow: 0 0 20px rgba(233, 69, 96, 0.5); }
.center-number.occupied .center-value { color: #6b7280; text-decoration: line-through; }

.spinner-ring {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #ffd97a;
  border-radius: 50%;
  animation: spin-anim 0.9s linear infinite;
}
@keyframes spin-anim { to { transform: rotate(360deg); } }

.spin-btn {
  padding: 12px 36px;
  background: linear-gradient(135deg, #e94560, #d4af37);
  border: none;
  border-radius: 999px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(233, 69, 96, 0.35);
  transition: all 0.2s;
}
.spin-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(233, 69, 96, 0.45); }
.spin-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.wheel-side { display: flex; flex-direction: column; gap: 14px; }

.side-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
}
.side-title { font-size: 13px; font-weight: 600; color: #ffd97a; margin-bottom: 10px; }

.manual-row { display: flex; gap: 8px; }
.manual-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  -moz-appearance: textfield;
}
.manual-input::-webkit-outer-spin-button,
.manual-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.manual-input:focus { outline: none; border-color: #ffd97a; }

.side-tip { margin-top: 8px; font-size: 12px; display: flex; gap: 6px; align-items: center; }
.tip-ok { color: #10b981; }
.tip-bad { color: #ef4444; }

.lucky-list { display: flex; flex-wrap: wrap; gap: 6px; }
.lucky-chip {
  min-width: 54px;
  height: 32px;
  padding: 0 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.lucky-chip:hover:not(:disabled) { background: rgba(212, 175, 55, 0.15); border-color: #ffd97a; color: #ffd97a; }
.lucky-chip.selected { background: linear-gradient(135deg, #e94560, #d4af37); border-color: transparent; color: #fff; }
.lucky-chip.occupied { opacity: 0.3; text-decoration: line-through; cursor: not-allowed; }

.preview-card { text-align: center; }
.vinyl-preview { display: flex; justify-content: center; padding: 8px 0; }
.preview-disc {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, #1a1a2b 0% 28%, #0a0a1a 28% 100%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  position: relative;
  animation: slow-spin 12s linear infinite;
}
@keyframes slow-spin { to { transform: rotate(360deg); } }
.preview-grooves {
  position: absolute;
  inset: 6%;
  border-radius: 50%;
  background: repeating-radial-gradient(circle, transparent 0, transparent 2px, rgba(255, 255, 255, 0.04) 2px, rgba(255, 255, 255, 0.04) 4px);
}
.preview-label {
  position: absolute;
  inset: 32%;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4af37, #e94560);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.label-title { font-size: 9px; letter-spacing: 1px; opacity: 0.85; }
.label-number { font-size: 15px; font-weight: 800; letter-spacing: 1px; margin-top: 2px; }

.preview-desc { margin-top: 6px; font-size: 11px; color: rgba(255, 255, 255, 0.5); }

.wheel-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 28px 24px;
  border-top: 1px solid rgba(212, 175, 55, 0.15);
}
.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: -2px;
  animation: spin-anim 0.8s linear infinite;
}

@media (max-width: 820px) {
  .wheel-main { grid-template-columns: 1fr; }
  .wheel-ring-outer { width: 300px; height: 300px; }
  .wheel-side { flex-direction: row; flex-wrap: wrap; }
  .side-card { flex: 1 1 45%; }
}
</style>
