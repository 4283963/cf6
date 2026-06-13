const prisma = require('../utils/prisma');

async function createVinylRecord(req, res, next) {
  try {
    const { title, coverImage, description, targetAmount, unitPrice, initialStock, deadline, musicianId, workInfo, shares } = req.body;

    if (!title || !targetAmount || !unitPrice || !musicianId) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数：title、targetAmount、unitPrice、musicianId',
        data: null
      });
    }

    const parsedStock = parseInt(initialStock);
    const result = await prisma.$transaction(async (tx) => {
      const vinyl = await tx.vinylRecord.create({
        data: {
          title,
          coverImage,
          description,
          targetAmount: parseFloat(targetAmount),
          unitPrice: parseFloat(unitPrice),
          initialStock: Number.isFinite(parsedStock) && parsedStock > 0 ? parsedStock : 0,
          stock: Number.isFinite(parsedStock) && parsedStock > 0 ? parsedStock : 0,
          deadline: deadline ? new Date(deadline) : null,
          musicianId: parseInt(musicianId)
        }
      });

      let work = null;
      if (workInfo) {
        work = await tx.copyrightWork.create({
          data: {
            title: workInfo.title || title,
            isrc: workInfo.isrc,
            duration: workInfo.duration,
            releaseDate: workInfo.releaseDate ? new Date(workInfo.releaseDate) : null,
            musicianId: parseInt(musicianId),
            vinylRecordId: vinyl.id
          }
        });

        if (shares && Array.isArray(shares) && shares.length > 0) {
          const totalPercent = shares.reduce((s, r) => s + parseFloat(r.percentage || 0), 0);
          if (Math.abs(totalPercent - 100) > 0.01) {
            throw new Error(`分账比例总和必须等于100%，当前为${totalPercent}%`);
          }

          for (const share of shares) {
            await tx.revenueShare.create({
              data: {
                workId: work.id,
                musicianId: parseInt(share.musicianId),
                role: share.role,
                percentage: parseFloat(share.percentage)
              }
            });
          }
        }
      }

      return { vinyl, work };
    });

    res.json({
      success: true,
      message: '黑胶众筹预售创建成功',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function listVinylRecords(req, res, next) {
  try {
    const { status, musicianId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (musicianId) where.musicianId = parseInt(musicianId);

    const list = await prisma.vinylRecord.findMany({
      where,
      include: {
        musician: { select: { id: true, name: true, studioName: true, avatar: true } },
        _count: { select: { orders: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const data = list.map(v => ({
      ...v,
      targetAmount: parseFloat(v.targetAmount),
      unitPrice: parseFloat(v.unitPrice),
      currentAmount: parseFloat(v.currentAmount),
      progressPercent: v.targetAmount > 0
        ? Math.min(100, Math.round((parseFloat(v.currentAmount) / parseFloat(v.targetAmount)) * 10000) / 100)
        : 0,
      supporterCount: v._count.orders
    }));

    res.json({
      success: true,
      message: '获取成功',
      data
    });
  } catch (err) {
    next(err);
  }
}

async function getVinylDetail(req, res, next) {
  try {
    const { id } = req.params;
    const vinyl = await prisma.vinylRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        musician: { select: { id: true, name: true, studioName: true, avatar: true, bio: true } },
        work: {
          include: {
            shares: { include: { musician: { select: { id: true, name: true } } } },
            streams: true
          }
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { fan: { select: { id: true, nickname: true } } }
        },
        _count: { select: { orders: true } }
      }
    });

    if (!vinyl) {
      return res.status(404).json({ success: false, message: '黑胶唱片不存在', data: null });
    }

    const targetAmount = parseFloat(vinyl.targetAmount);
    const currentAmount = parseFloat(vinyl.currentAmount);

    res.json({
      success: true,
      message: '获取成功',
      data: {
        ...vinyl,
        targetAmount,
        unitPrice: parseFloat(vinyl.unitPrice),
        currentAmount,
        progressPercent: targetAmount > 0
          ? Math.min(100, Math.round((currentAmount / targetAmount) * 10000) / 100)
          : 0,
        supporterCount: vinyl._count.orders
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createVinylRecord,
  listVinylRecords,
  getVinylDetail
};
