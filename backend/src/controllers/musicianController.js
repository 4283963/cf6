const prisma = require('../utils/prisma');

async function listMusicians(_req, res, next) {
  try {
    const list = await prisma.musician.findMany({
      include: {
        _count: { select: { vinylRecords: true, works: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      message: '获取成功',
      data: list
    });
  } catch (err) {
    next(err);
  }
}

async function createMusician(req, res, next) {
  try {
    const { name, studioName, avatar, bio } = req.body;

    if (!name || !studioName) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数：name、studioName',
        data: null
      });
    }

    const musician = await prisma.musician.create({
      data: { name, studioName, avatar, bio }
    });

    res.json({
      success: true,
      message: '音乐人创建成功',
      data: musician
    });
  } catch (err) {
    next(err);
  }
}

async function getMusicianWorks(req, res, next) {
  try {
    const { id } = req.params;
    const works = await prisma.copyrightWork.findMany({
      where: { musicianId: parseInt(id) },
      include: {
        shares: { include: { musician: { select: { id: true, name: true } } } },
        streams: true
      }
    });

    res.json({
      success: true,
      message: '获取成功',
      data: works
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMusicians,
  createMusician,
  getMusicianWorks
};
