const prisma = require('../utils/prisma');

async function calculateAndDistributeShares(workId) {
  const work = await prisma.copyrightWork.findUnique({
    where: { id: workId },
    include: {
      streams: true,
      shares: { include: { musician: true } }
    }
  });

  if (!work) {
    throw new Error('版权作品不存在');
  }

  const totalRevenue = work.streams.reduce((sum, s) => {
    return sum + parseFloat(s.revenue);
  }, 0);

  const totalPlays = work.streams.reduce((sum, s) => {
    return sum + Number(s.playCount || 0);
  }, 0);

  const shareResults = [];
  for (const share of work.shares) {
    const amount = (totalRevenue * parseFloat(share.percentage)) / 100;
    const rounded = Math.round(amount * 100) / 100;

    await prisma.revenueShare.update({
      where: { id: share.id },
      data: { amount: rounded }
    });

    shareResults.push({
      shareId: share.id,
      musicianName: share.musician.name,
      role: share.role,
      percentage: parseFloat(share.percentage),
      amount: rounded
    });
  }

  await prisma.streamRevenue.updateMany({
    where: { workId, settled: false },
    data: { settled: true }
  });

  return {
    workId,
    workTitle: work.title,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalPlays,
    shares: shareResults
  };
}

module.exports = {
  calculateAndDistributeShares
};
