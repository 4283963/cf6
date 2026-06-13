const prisma = require('../utils/prisma');

async function checkAndUnlockBenefits(vinylRecordId, trx) {
  const db = trx || prisma;

  const vinyl = await db.vinylRecord.findUnique({
    where: { id: vinylRecordId },
    select: {
      id: true,
      currentAmount: true,
      targetAmount: true,
      title: true,
      benefits: {
        where: { unlocked: false },
        orderBy: { thresholdPercent: 'asc' }
      }
    }
  });

  if (!vinyl || !vinyl.benefits || vinyl.benefits.length === 0) {
    return { unlocked: [], totalUnlocked: 0 };
  }

  const target = parseFloat(vinyl.targetAmount);
  const current = parseFloat(vinyl.currentAmount);
  const progressPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  const newlyUnlocked = [];

  for (const benefit of vinyl.benefits) {
    const threshold = parseFloat(benefit.thresholdPercent);
    if (progressPercent >= threshold) {
      const updated = await db.vinylBenefit.update({
        where: { id: benefit.id },
        data: {
          unlocked: true,
          unlockedAt: new Date()
        }
      });
      newlyUnlocked.push(updated);
    }
  }

  if (newlyUnlocked.length > 0) {
    console.log(
      `[福利解锁] 黑胶《${vinyl.title}》达到 ${progressPercent.toFixed(1)}%，解锁 ${newlyUnlocked.length} 项福利:`,
      newlyUnlocked.map(b => `[${b.thresholdPercent}%] ${b.title}`).join(', ')
    );
  }

  return {
    unlocked: newlyUnlocked,
    totalUnlocked: newlyUnlocked.length,
    progressPercent
  };
}

async function getVinylBenefitsWithStatus(vinylRecordId) {
  const vinyl = await prisma.vinylRecord.findUnique({
    where: { id: vinylRecordId },
    select: {
      id: true,
      currentAmount: true,
      targetAmount: true
    }
  });

  if (!vinyl) return [];

  const target = parseFloat(vinyl.targetAmount);
  const current = parseFloat(vinyl.currentAmount);
  const progressPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  const benefits = await prisma.vinylBenefit.findMany({
    where: { vinylRecordId },
    orderBy: [{ sortOrder: 'asc' }, { thresholdPercent: 'asc' }]
  });

  return benefits.map(b => ({
    ...b,
    thresholdPercent: parseFloat(b.thresholdPercent),
    contentUrl: b.unlocked ? b.contentUrl : null,
    contentText: b.unlocked ? b.contentText : null,
    isUnlocked: b.unlocked || progressPercent >= parseFloat(b.thresholdPercent)
  }));
}

async function getUnlockedBenefitsForOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      vinylRecordId: true,
      fanId: true,
      status: true
    }
  });

  if (!order || order.status !== 'PAID') return [];

  const benefits = await prisma.vinylBenefit.findMany({
    where: {
      vinylRecordId: order.vinylRecordId,
      unlocked: true
    },
    orderBy: [{ sortOrder: 'asc' }, { thresholdPercent: 'asc' }]
  });

  return benefits.map(b => ({
    ...b,
    thresholdPercent: parseFloat(b.thresholdPercent)
  }));
}

module.exports = {
  checkAndUnlockBenefits,
  getVinylBenefitsWithStatus,
  getUnlockedBenefitsForOrder
};
