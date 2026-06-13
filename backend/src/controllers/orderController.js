const prisma = require('../utils/prisma');

function generateOrderNo() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VNY${y}${m}${d}${random}`;
}

async function createOrder(req, res, next) {
  try {
    const { vinylRecordId, quantity, fanId, nickname, phone, email, address } = req.body;

    if (!vinylRecordId || !quantity) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数：vinylRecordId、quantity',
        data: null
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: '购买数量必须大于0',
        data: null
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const vinyl = await tx.vinylRecord.findUnique({
        where: { id: parseInt(vinylRecordId) }
      });

      if (!vinyl) {
        throw new Error('黑胶唱片不存在');
      }

      if (vinyl.status !== 'FUNDING') {
        throw new Error('该黑胶唱片不在众筹中');
      }

      let fan;
      if (fanId) {
        fan = await tx.fan.findUnique({ where: { id: parseInt(fanId) } });
      }

      if (!fan) {
        fan = await tx.fan.create({
          data: {
            nickname: nickname || `粉丝${Math.floor(Math.random() * 10000)}`,
            phone,
            email,
            address
          }
        });
      }

      const totalAmount = Math.round(parseFloat(vinyl.unitPrice) * quantity * 100) / 100;
      const orderNo = generateOrderNo();

      const order = await tx.order.create({
        data: {
          orderNo,
          vinylRecordId: vinyl.id,
          fanId: fan.id,
          quantity,
          totalAmount,
          status: 'PAID'
        }
      });

      const newCurrent = parseFloat(vinyl.currentAmount) + totalAmount;
      await tx.vinylRecord.update({
        where: { id: vinyl.id },
        data: {
          currentAmount: newCurrent,
          status: newCurrent >= parseFloat(vinyl.targetAmount) ? 'SUCCESS' : 'FUNDING'
        }
      });

      return { order, fan, vinyl: { ...vinyl, currentAmount: newCurrent } };
    });

    res.json({
      success: true,
      message: '下单成功',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const { vinylRecordId, fanId } = req.query;
    const where = {};
    if (vinylRecordId) where.vinylRecordId = parseInt(vinylRecordId);
    if (fanId) where.fanId = parseInt(fanId);

    const list = await prisma.order.findMany({
      where,
      include: {
        vinylRecord: { select: { id: true, title: true, coverImage: true } },
        fan: { select: { id: true, nickname: true, phone: true, email: true, address: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      message: '获取成功',
      data: list.map(o => ({ ...o, totalAmount: parseFloat(o.totalAmount) }))
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  listOrders
};
