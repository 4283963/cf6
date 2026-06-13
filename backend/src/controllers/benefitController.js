const prisma = require('../utils/prisma');
const benefitUnlockService = require('../services/benefitUnlockService');

async function listBenefits(req, res, next) {
  try {
    const { vinylRecordId, unlocked } = req.query;
    const where = {};
    if (vinylRecordId) where.vinylRecordId = parseInt(vinylRecordId);
    if (unlocked !== undefined) where.unlocked = unlocked === 'true';

    const list = await prisma.vinylBenefit.findMany({
      where,
      include: {
        vinylRecord: { select: { id: true, title: true, coverImage: true } }
      },
      orderBy: [{ sortOrder: 'asc' }, { thresholdPercent: 'asc' }]
    });

    const data = list.map(b => ({
      ...b,
      thresholdPercent: parseFloat(b.thresholdPercent)
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

async function listBenefitsWithStatus(req, res, next) {
  try {
    const { vinylRecordId } = req.params;
    if (!vinylRecordId) {
      return res.status(400).json({ success: false, message: '缺少 vinylRecordId', data: null });
    }

    const data = await benefitUnlockService.getVinylBenefitsWithStatus(parseInt(vinylRecordId));

    res.json({
      success: true,
      message: '获取成功',
      data
    });
  } catch (err) {
    next(err);
  }
}

async function createBenefit(req, res, next) {
  try {
    const { vinylRecordId, title, description, type, thresholdPercent, contentUrl, contentText, sortOrder } = req.body;

    if (!vinylRecordId || !title || thresholdPercent == null) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数：vinylRecordId、title、thresholdPercent',
        data: null
      });
    }

    const threshold = parseFloat(thresholdPercent);
    if (Number.isNaN(threshold) || threshold < 0 || threshold > 100) {
      return res.status(400).json({
        success: false,
        message: '解锁比例必须在 0 到 100 之间',
        data: null
      });
    }

    const existing = await prisma.vinylBenefit.findMany({
      where: {
        vinylRecordId: parseInt(vinylRecordId),
        thresholdPercent: threshold
      }
    });

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `${threshold}% 阶梯已存在，请设置其他比例`,
        data: null
      });
    }

    const benefit = await prisma.vinylBenefit.create({
      data: {
        vinylRecordId: parseInt(vinylRecordId),
        title,
        description: description || null,
        type: type || 'DOWNLOAD_LINK',
        thresholdPercent: threshold,
        contentUrl: contentUrl || null,
        contentText: contentText || null,
        sortOrder: sortOrder != null ? parseInt(sortOrder) : 0
      }
    });

    res.json({
      success: true,
      message: '福利创建成功',
      data: {
        ...benefit,
        thresholdPercent: parseFloat(benefit.thresholdPercent)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateBenefit(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, type, thresholdPercent, contentUrl, contentText, sortOrder, unlocked } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (thresholdPercent !== undefined) data.thresholdPercent = parseFloat(thresholdPercent);
    if (contentUrl !== undefined) data.contentUrl = contentUrl;
    if (contentText !== undefined) data.contentText = contentText;
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder);
    if (unlocked !== undefined) {
      data.unlocked = unlocked === true;
      if (data.unlocked) data.unlockedAt = new Date();
    }

    const benefit = await prisma.vinylBenefit.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({
      success: true,
      message: '更新成功',
      data: {
        ...benefit,
        thresholdPercent: parseFloat(benefit.thresholdPercent)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function deleteBenefit(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.vinylBenefit.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: '删除成功', data: null });
  } catch (err) {
    next(err);
  }
}

async function getOrderBenefits(req, res, next) {
  try {
    const { orderId } = req.params;
    const data = await benefitUnlockService.getUnlockedBenefitsForOrder(parseInt(orderId));
    res.json({ success: true, message: '获取成功', data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listBenefits,
  listBenefitsWithStatus,
  createBenefit,
  updateBenefit,
  deleteBenefit,
  getOrderBenefits
};
