const prisma = require('../utils/prisma');
const { Prisma } = require('@prisma/client');

function generateOrderNo() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VNY${y}${m}${d}${random}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RETRY = 5;
const BASE_DELAY = 30;

class StockInsufficientError extends Error {
  constructor(message) {
    super(message || '库存不足，手慢啦！');
    this.name = 'StockInsufficientError';
    this.status = 409;
  }
}

class VersionConflictError extends Error {
  constructor(message) {
    super(message || '并发冲突，请稍后重试');
    this.name = 'VersionConflictError';
    this.status = 409;
  }
}

let _mysqlVersionSupportsSkipLocked = null;

async function detectMysqlSkipLocked() {
  if (_mysqlVersionSupportsSkipLocked !== null) return _mysqlVersionSupportsSkipLocked;
  try {
    const rows = await prisma.$queryRaw`SELECT VERSION() as v`;
    const versionStr = rows && rows[0] ? String(rows[0].v || '') : '';
    const match = versionStr.match(/^(\d+)\.(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      _mysqlVersionSupportsSkipLocked = major > 8 || (major === 8 && minor >= 0);
    } else {
      _mysqlVersionSupportsSkipLocked = true;
    }
  } catch (e) {
    _mysqlVersionSupportsSkipLocked = false;
  }
  console.log(
    `[MySQL] 版本检测 SKIP LOCKED 支持: ${_mysqlVersionSupportsSkipLocked}`
  );
  return _mysqlVersionSupportsSkipLocked;
}

async function selectVinylForUpdate(tx, id, useSkipLocked) {
  if (useSkipLocked) {
    const rows = await tx.$queryRaw(
      Prisma.sql`SELECT * FROM VinylRecord WHERE id = ${id} FOR UPDATE SKIP LOCKED`
    );
    return Array.isArray(rows) ? rows[0] : null;
  }
  const rows = await tx.$queryRaw(
    Prisma.sql`SELECT * FROM VinylRecord WHERE id = ${id} FOR UPDATE`
  );
  return Array.isArray(rows) ? rows[0] : null;
}

async function createOrderWithLock(vinylRecordIdInt, quantity, fanPayload) {
  let attempt = 0;
  const useSkipLocked = await detectMysqlSkipLocked();

  while (attempt < MAX_RETRY) {
    attempt++;

    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const lockVinyl = await selectVinylForUpdate(
            tx,
            vinylRecordIdInt,
            useSkipLocked
          );

          if (!lockVinyl) {
            throw new VersionConflictError('黑胶唱片被其他请求锁定或不存在，请重试');
          }

          if (lockVinyl.status !== 'FUNDING') {
            throw new Error('该黑胶唱片不在众筹中');
          }

          if (lockVinyl.stock < quantity) {
            throw new StockInsufficientError(
              `库存仅剩 ${lockVinyl.stock} 张，您购买的 ${quantity} 张已超过当前库存`
            );
          }

          let fan;
          if (fanPayload.fanId) {
            fan = await tx.fan.findUnique({ where: { id: fanPayload.fanId } });
          }

          if (!fan) {
            fan = await tx.fan.create({
              data: {
                nickname: fanPayload.nickname || `粉丝${Math.floor(Math.random() * 10000)}`,
                phone: fanPayload.phone || null,
                email: fanPayload.email || null,
                address: fanPayload.address || null
              }
            });
          }

          const totalAmount =
            Math.round(parseFloat(lockVinyl.unitPrice) * quantity * 100) / 100;
          const orderNo = generateOrderNo();

          const newStock = lockVinyl.stock - quantity;
          const newCurrent = parseFloat(lockVinyl.currentAmount) + totalAmount;
          const expectedVersion = lockVinyl.version;
          const newStatus = newCurrent >= parseFloat(lockVinyl.targetAmount) ? 'SUCCESS' : 'FUNDING';

          const updateRes = await tx.vinylRecord.updateMany({
            where: {
              id: lockVinyl.id,
              version: expectedVersion,
              stock: { gte: quantity }
            },
            data: {
              stock: { decrement: quantity },
              currentAmount: newCurrent,
              status: newStatus,
              version: { increment: 1 }
            }
          });

          if (updateRes.count !== 1) {
            throw new VersionConflictError('版本号冲突或库存已被占用，数据已被其他请求修改');
          }

          const order = await tx.order.create({
            data: {
              orderNo,
              vinylRecordId: lockVinyl.id,
              fanId: fan.id,
              quantity,
              totalAmount,
              status: 'PAID'
            }
          });

          return {
            order,
            fan,
            vinyl: {
              id: lockVinyl.id,
              title: lockVinyl.title,
              stock: newStock,
              initialStock: lockVinyl.initialStock,
              currentAmount: newCurrent,
              targetAmount: parseFloat(lockVinyl.targetAmount),
              status: newStatus,
              version: expectedVersion + 1
            }
          };
        },
        {
          isolationLevel: 'ReadCommitted',
          maxWait: 3500,
          timeout: 10000
        }
      );

      return result;
    } catch (err) {
      const isConflict =
        err instanceof VersionConflictError ||
        err.code === 'P2025' ||
        err.code === 'P2034' ||
        err.code === 'P2002' ||
        (err && typeof err.message === 'string' &&
          (err.message.toLowerCase().includes('deadlock') ||
            err.message.toLowerCase().includes('lock')));

      if (isConflict && attempt < MAX_RETRY) {
        const delay = BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 20;
        console.warn(
          `[订单并发] 第${attempt}次冲突(${err.code || err.name})，${delay.toFixed(0)}ms 后重试...`
        );
        await sleep(delay);
        continue;
      }

      throw err;
    }
  }

  throw new VersionConflictError(`系统繁忙，已重试 ${MAX_RETRY} 次，请稍后再试`);
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

    const qty = parseInt(quantity);
    if (qty < 1 || Number.isNaN(qty)) {
      return res.status(400).json({
        success: false,
        message: '购买数量必须为大于0的整数',
        data: null
      });
    }

    const preCheck = await prisma.vinylRecord.findUnique({
      where: { id: parseInt(vinylRecordId) },
      select: { id: true, stock: true, status: true }
    });

    if (!preCheck) {
      return res.status(404).json({
        success: false,
        message: '黑胶唱片不存在',
        data: null
      });
    }

    if (preCheck.stock < qty) {
      return res.status(409).json({
        success: false,
        message: `库存仅剩 ${preCheck.stock} 张，您购买的 ${qty} 张已超过当前库存`,
        code: 'STOCK_INSUFFICIENT',
        data: { currentStock: preCheck.stock }
      });
    }

    const result = await createOrderWithLock(parseInt(vinylRecordId), qty, {
      fanId: fanId ? parseInt(fanId) : null,
      nickname,
      phone,
      email,
      address
    });

    res.json({
      success: true,
      message: '下单成功',
      data: result
    });
  } catch (err) {
    if (err instanceof StockInsufficientError) {
      return res.status(err.status || 409).json({
        success: false,
        message: err.message,
        code: 'STOCK_INSUFFICIENT',
        data: null
      });
    }

    if (err instanceof VersionConflictError) {
      return res.status(err.status || 409).json({
        success: false,
        message: err.message,
        code: 'VERSION_CONFLICT',
        data: null
      });
    }

    if (err.code === 'P2025') {
      console.error('[Prisma P2025 捕获] 记录不存在或乐观锁冲突', err.message);
      return res.status(409).json({
        success: false,
        message: '下单人数过多，库存已被抢购，刷新页面后重试',
        code: 'STOCK_RACE_FAIL',
        data: null
      });
    }

    if (err.code === 'P2034') {
      console.error('[Prisma P2034 捕获] 事务死锁/序列化失败', err.message);
      return res.status(409).json({
        success: false,
        message: '系统繁忙，抢购人数过多，请稍后重试',
        code: 'DEADLOCK_FAIL',
        data: null
      });
    }

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
      data: list.map((o) => ({ ...o, totalAmount: parseFloat(o.totalAmount) }))
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  listOrders
};
