const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化种子数据...');

  const m1 = await prisma.musician.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '林夕',
      studioName: '梦先生工作室',
      avatar: null,
      bio: '华语乐坛著名作词人'
    }
  });

  const m2 = await prisma.musician.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '周杰伦',
      studioName: '杰威尔音乐',
      avatar: null,
      bio: '华语流行音乐天王、词曲创作人'
    }
  });

  const m3 = await prisma.musician.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: '洪敬尧',
      studioName: '尧音乐工作室',
      avatar: null,
      bio: '华语乐坛著名编曲人'
    }
  });

  const m4 = await prisma.musician.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: '五月天阿信',
      studioName: '相信音乐',
      avatar: null,
      bio: '五月天乐队主唱、词曲创作人'
    }
  });

  console.log('✅ 音乐人数据初始化完成');

  const vinyl1 = await prisma.vinylRecord.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: '晴天 · 珍藏版黑胶',
      coverImage: null,
      description: '经典《晴天》20周年限量珍藏版黑胶唱片，采用180g高品质黑胶制作，附精美歌词画册。',
      targetAmount: 100000,
      unitPrice: 299,
      currentAmount: 35880,
      initialStock: 500,
      stock: 497,
      version: 0,
      status: 'FUNDING',
      deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      musicianId: m2.id
    }
  });

  const vinyl2 = await prisma.vinylRecord.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: '温柔 · 双碟典藏版',
      coverImage: null,
      description: '五月天经典作品《温柔》双碟典藏黑胶，收录现场版与录音室版。',
      targetAmount: 80000,
      unitPrice: 368,
      currentAmount: 82368,
      initialStock: 300,
      stock: 299,
      version: 0,
      status: 'SUCCESS',
      deadline: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      musicianId: m4.id
    }
  });

  console.log('✅ 黑胶唱片数据初始化完成');

  const work1 = await prisma.copyrightWork.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: '晴天',
      isrc: 'CN-A01-03-00001',
      duration: 269,
      releaseDate: new Date('2003-07-31'),
      musicianId: m2.id,
      vinylRecordId: vinyl1.id
    }
  });

  const work2 = await prisma.copyrightWork.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: '温柔',
      isrc: 'CN-A02-00-00001',
      duration: 271,
      releaseDate: new Date('2000-07-07'),
      musicianId: m4.id,
      vinylRecordId: vinyl2.id
    }
  });

  console.log('✅ 版权作品数据初始化完成');

  await prisma.revenueShare.deleteMany({});

  await prisma.revenueShare.createMany({
    data: [
      { workId: work1.id, musicianId: m1.id, role: 'LYRICIST', percentage: 25 },
      { workId: work1.id, musicianId: m2.id, role: 'COMPOSER', percentage: 35 },
      { workId: work1.id, musicianId: m3.id, role: 'ARRANGER', percentage: 20 },
      { workId: work1.id, musicianId: m2.id, role: 'LEAD_VOCAL', percentage: 20 },
      { workId: work2.id, musicianId: m4.id, role: 'LYRICIST', percentage: 30 },
      { workId: work2.id, musicianId: m4.id, role: 'COMPOSER', percentage: 30 },
      { workId: work2.id, musicianId: m3.id, role: 'ARRANGER', percentage: 15 },
      { workId: work2.id, musicianId: m4.id, role: 'LEAD_VOCAL', percentage: 25 }
    ]
  });

  console.log('✅ 分账比例数据初始化完成');

  await prisma.streamRevenue.deleteMany({});

  await prisma.streamRevenue.createMany({
    data: [
      { workId: work1.id, platform: 'NETEASE', playCount: 1250000, revenue: 8750.00, periodStart: new Date('2026-05-01'), periodEnd: new Date('2026-05-31') },
      { workId: work1.id, platform: 'QQ_MUSIC', playCount: 980000, revenue: 6860.00, periodStart: new Date('2026-05-01'), periodEnd: new Date('2026-05-31') },
      { workId: work1.id, platform: 'KUGOU', playCount: 560000, revenue: 3920.00, periodStart: new Date('2026-05-01'), periodEnd: new Date('2026-05-31') },
      { workId: work1.id, platform: 'BILIBILI', playCount: 320000, revenue: 2240.00, periodStart: new Date('2026-05-01'), periodEnd: new Date('2026-05-31') },
      { workId: work2.id, platform: 'NETEASE', playCount: 890000, revenue: 6230.00, periodStart: new Date('2026-05-01'), periodEnd: new Date('2026-05-31') },
      { workId: work2.id, platform: 'QQ_MUSIC', playCount: 720000, revenue: 5040.00, periodStart: new Date('2026-05-01'), periodEnd: new Date('2026-05-31') },
      { workId: work2.id, platform: 'SPOTIFY', playCount: 150000, revenue: 1800.00, periodStart: new Date('2026-05-01'), periodEnd: new Date('2026-05-31') }
    ]
  });

  console.log('✅ 流媒体收益数据初始化完成');

  const fan1 = await prisma.fan.upsert({
    where: { id: 1 },
    update: {},
    create: { nickname: '音乐发烧友小王', phone: '13800138000', email: 'fan@example.com', address: '北京市朝阳区音乐大道88号' }
  });

  await prisma.order.deleteMany({});
  await prisma.order.createMany({
    data: [
      { orderNo: 'VNY20260601ABC001', vinylRecordId: vinyl1.id, fanId: fan1.id, quantity: 2, totalAmount: 598, engravingNumber: 66, status: 'PAID' },
      { orderNo: 'VNY20260601ABC002', vinylRecordId: vinyl1.id, fanId: fan1.id, quantity: 1, totalAmount: 299, engravingNumber: 188, status: 'PAID' },
      { orderNo: 'VNY20260601ABC003', vinylRecordId: vinyl2.id, fanId: fan1.id, quantity: 1, totalAmount: 368, engravingNumber: 99, status: 'PAID' }
    ]
  });

  console.log('✅ 粉丝与订单数据初始化完成');

  await prisma.vinylBenefit.deleteMany({});
  await prisma.vinylBenefit.createMany({
    data: [
      { vinylRecordId: vinyl1.id, title: '数字专辑无损 FLAC 下载', type: 'DOWNLOAD_LINK', thresholdPercent: 10, contentUrl: 'https://example.com/vinyl/晴天/flac', description: '24bit/96kHz 无损音质，包含所有曲目', sortOrder: 1, unlocked: true, unlockedAt: new Date() },
      { vinylRecordId: vinyl1.id, title: '高清伴奏带 (Instrumental)', type: 'DOWNLOAD_LINK', thresholdPercent: 50, contentUrl: 'https://example.com/vinyl/晴天/instrumental', description: 'WAV 格式所有曲目的纯伴奏版本，可用于翻唱/Remix', sortOrder: 2, unlocked: false },
      { vinylRecordId: vinyl1.id, title: '独家创作手记 PDF', type: 'LYRIC_SHEET', thresholdPercent: 75, contentUrl: 'https://example.com/vinyl/晴天/notes', contentText: '创作手记：这首歌写于2003年一个下雨的午后...', description: '包含手写乐谱与创作故事', sortOrder: 3, unlocked: false },
      { vinylRecordId: vinyl1.id, title: '录音室花絮视频', type: 'BEHIND_SCENES', thresholdPercent: 90, contentUrl: 'https://example.com/vinyl/晴天/bts', description: '4K 未公开的录音室幕后花絮，15 分钟', sortOrder: 4, unlocked: false },
      { vinylRecordId: vinyl1.id, title: '全套解锁 · 实体周边礼', type: 'PHYSICAL_GIFT', thresholdPercent: 100, contentText: '实体海报 + 明信片套装，将随黑胶一同寄出', description: '亲笔签名海报、明信片 x5、定制保护袋', sortOrder: 5, unlocked: false },
      { vinylRecordId: vinyl2.id, title: '《温柔》2025 Remaster 下载', type: 'DOWNLOAD_LINK', thresholdPercent: 10, contentUrl: 'https://example.com/vinyl/温柔/remaster', sortOrder: 1, unlocked: true, unlockedAt: new Date() },
      { vinylRecordId: vinyl2.id, title: '演唱会现场 Live 录音', type: 'DOWNLOAD_LINK', thresholdPercent: 50, contentUrl: 'https://example.com/vinyl/温柔/live', sortOrder: 2, unlocked: true, unlockedAt: new Date() },
      { vinylRecordId: vinyl2.id, title: '五月天乐手分轨工程文件', type: 'DOWNLOAD_LINK', thresholdPercent: 100, contentUrl: 'https://example.com/vinyl/温柔/stems', description: '包含吉他/Bass/鼓/人声分轨', sortOrder: 3, unlocked: false }
    ]
  });

  console.log('✅ 阶梯福利数据初始化完成');
  console.log('🎉 所有种子数据初始化完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
