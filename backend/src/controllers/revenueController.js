const prisma = require('../utils/prisma');
const { calculateAndDistributeShares } = require('../services/revenueShareService');

async function addStreamRevenue(req, res, next) {
  try {
    const { workId, platform, playCount, revenue, periodStart, periodEnd } = req.body;

    if (!workId || !platform || revenue == null) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数：workId、platform、revenue',
        data: null
      });
    }

    const validPlatforms = ['NETEASE', 'QQ_MUSIC', 'KUGOU', 'KUWO', 'BILIBILI', 'SPOTIFY', 'OTHER'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: `platform 必须是: ${validPlatforms.join(', ')}`,
        data: null
      });
    }

    const work = await prisma.copyrightWork.findUnique({
      where: { id: parseInt(workId) }
    });

    if (!work) {
      return res.status(404).json({
        success: false,
        message: '版权作品不存在',
        data: null
      });
    }

    const stream = await prisma.streamRevenue.create({
      data: {
        workId: parseInt(workId),
        platform,
        playCount: playCount ? BigInt(playCount) : 0,
        revenue: parseFloat(revenue),
        periodStart: periodStart ? new Date(periodStart) : new Date(),
        periodEnd: periodEnd ? new Date(periodEnd) : new Date()
      }
    });

    res.json({
      success: true,
      message: '流媒体收益录入成功',
      data: {
        ...stream,
        playCount: stream.playCount.toString(),
        revenue: parseFloat(stream.revenue)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function settleRevenue(req, res, next) {
  try {
    const { workId } = req.params;
    const result = await calculateAndDistributeShares(parseInt(workId));

    res.json({
      success: true,
      message: '分账计算完成',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getWorkRevenue(req, res, next) {
  try {
    const { workId } = req.params;
    const work = await prisma.copyrightWork.findUnique({
      where: { id: parseInt(workId) },
      include: {
        streams: true,
        shares: {
          include: { musician: { select: { id: true, name: true } } }
        }
      }
    });

    if (!work) {
      return res.status(404).json({ success: false, message: '版权作品不存在', data: null });
    }

    const totalRevenue = work.streams.reduce((s, r) => s + parseFloat(r.revenue), 0);
    const totalPlays = work.streams.reduce((s, r) => s + Number(r.playCount || 0), 0);

    const sharesByRole = work.shares.map(s => ({
      id: s.id,
      role: s.role,
      roleLabel: {
        LYRICIST: '作词',
        COMPOSER: '作曲',
        ARRANGER: '编曲',
        LEAD_VOCAL: '主唱'
      }[s.role] || s.role,
      musicianId: s.musicianId,
      musicianName: s.musician.name,
      percentage: parseFloat(s.percentage),
      amount: parseFloat(s.amount)
    }));

    const platformStats = {};
    for (const stream of work.streams) {
      if (!platformStats[stream.platform]) {
        platformStats[stream.platform] = { playCount: 0, revenue: 0 };
      }
      platformStats[stream.platform].playCount += Number(stream.playCount || 0);
      platformStats[stream.platform].revenue += parseFloat(stream.revenue);
    }

    res.json({
      success: true,
      message: '获取成功',
      data: {
        workId: work.id,
        title: work.title,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPlays,
        shares: sharesByRole,
        platformStats,
        streams: work.streams.map(s => ({
          ...s,
          playCount: s.playCount.toString(),
          revenue: parseFloat(s.revenue)
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addStreamRevenue,
  settleRevenue,
  getWorkRevenue
};
