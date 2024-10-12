import { Context, Random, Schema, h, sleep } from 'koishi'

export const name = 'fantan-game'
export const usage = `
## 使用

1. 设置指令别名。
2. 给玩家充值。

## 注意事项

- 仅群聊。
- 场方将抽取获胜投注的 5% 作为佣金。

## 游戏规则

- 游戏开始，玩家投注 1、2、3、4。
- 投注时间结束，开盘结算。

## 投注项目及赔率

- 单双投注：可选择下注单（1、3）或双（2、4）。赔率为 1 赔 1。
- 正投注：可选择下注某个数字 X，当开出 X 时，下注 X 正赢；开出对面数字输；开出两边数字为和局。例如，如果开出 1，则下注“1 正”赢，“3 正”输，“2 正”和局，“4正”和局。赔率为 1 赔 1。
- 番投注：可选择下注某个数字 X，当开出 X 时，其他数字输。赔率为 1 赔 3。
- 念投注：可选择下注 X 念 Y，当开出 X 时，开出 Y 为和局，其他数字输。赔率为 1 赔 2。例如，如果开出1时，下注 1 念 2 和 1 念 4 赢，下注 2 念 1 和 4 念 1 为和局，其他情况输。
- 角投注：可选择下注 XY，当开出 X 或 Y 时赢，其他数字输。赔率为 1 赔 1。
- 通(Y)投注：投注三个号码，选定其中两个为赢，另一个为和。赔率为 2 赔 1。例如，下注“12通4”的 1 和 2，如果结果为 1 或 2，则赢；如果结果为 3，则输；如果结果为 4，则和局，退回本金。
- 中（三红）投注：可选择下注 XYZ，当开出 X、Y、Z 其中一个为赢，其他数字输。赔率为 3 赔 1。

## 关键指令

| 命令                      | 描述          | 示例                                  |
|-------------------------|-------------|-------------------------------------|
| \`fantan.单投注 <投注>\`       | 单投注（1 或 3）  | \`fantan.single 500\`                 |
| \`fantan.双投注 <投注>\`       | 双投注（2 或 4）  | \`fantan.double 500\`                 |
| \`fantan.正投注 <数> <投注>\`   | 正投注（具体的数字）  | \`fantan.zheng 1 500\`                |
| \`fantan.番投注 <数> <投注>\`   | 番投注（具体的数字）  | \`fantan.fan 1 500\`                  |
| \`fantan.念投注 <数> <投注>\`   | 念投注（一对数字）   | \`fantan.nian 12 500\`                |
| \`fantan.角投注 <数> <投注>\`   | 角投注（一对数字）   | \`fantan.jiao 13 500\`                |
| \`fantan.通投注 <数> <投注>\`   | 通投注（三个数字）   | \`fantan.tong 124 500\`               |
| \`fantan.中投注 <数> <投注>\`   | 中投注（三个数字）   | \`fantan.middle 123 500\`             |
| \`fantan.充值 <投注>\`        | 充值账户余额      | \`fantan.rechargeAmount 1000\`        |
| \`fantan.充值用户 <用户> <投注>\` | 充值其他用户的账户余额 | \`fantan.userRecharge @Alice 1000\`   |
| \`fantan.提现 <投注>\`        | 提现账户余额      | \`fantan.withdrawalAmount 1000\`      |
| \`fantan.提现用户 <用户> <投注>\` | 提现其他用户的账户余额 | \`fantan.userWithdrawal @Alice 1000\` |`

export interface Config {
  betWaitingTime: number
  waitingForLotteryTime: number
  waitingForSettlementTime: number
}

export const Config: Schema<Config> = Schema.object({
  betWaitingTime: Schema.number().default(45).description('等待玩家下注的时长（单位：秒）'),
  waitingForLotteryTime: Schema.number().default(5).description('等待开奖的时长（单位：秒）'),
  waitingForSettlementTime: Schema.number().default(5).description('等待结算的时长（单位：秒）'),
})

declare module 'koishi' {
  interface Tables {
    fantan_games: FantanGame
    fantan_player_records: FantanPlayerRecord
    ffantan_player_infos: FantanPlayerInfo
  }
}

export interface FantanGame {
  id: number
  guildId: string
  issuePrefix: string
  issueSuffix: string
  gameStartTime: string
  isBettingTimeOver: boolean
  lotteryResult: number
  scoreSummary: number
}
export interface FantanPlayerRecord {
  id: number
  guildId: string
  userId: string
  userName: string
  // issueNumber: string
  betType: string
  bettingNumber: string
  amount: number // 投注金额
  commission: number // 赔付金额
  score: number // 得分
}
export interface FantanPlayerInfo {
  id: number
  userId: string
  userName: string
  balance: number // 余额
  totalRounds: number
  scoreSummary: number
}
const msg = {
  gameStartFail: "本期游戏已经开始，无法加入。请等待下一期游戏开始后再投注。",
  betFailInsufficientBalance: "您的余额不足，无法完成投注。请先充值或减少投注金额。",
  betFailInvalidNumber: "您输入的投注数字无效，请输入一个0到9之间的整数，并且只能有一位。",
  betFailInvalidAmount: "您输入的投注金额无效，请输入一个大于零的整数。",
  betFailNotInWinningNumbers: "您的投注数字不在开奖结果中，请重新选择投注数字。",
  betSuccessRecorded: "恭喜您，投注成功！您的投注记录已保存！",
  betEndAnnouncement: "本期投注时间已结束！请耐心等待开奖结果！",
  betFailGameNotStartedOrEndTimeExpired: "对不起，现在不是投注时间。请在游戏开始后及时投注，或者等待下一期游戏开始。",
  gameNoBettors: "本期游戏没有任何人参与投注，因此无需开奖和结算。本期游戏已自动结束。",
  gameEndPerfect: "感谢您参与本期番摊游戏！祝您玩得开心！",
  rechargeSuccess: "充值成功！您的余额已更新！",
  withdrawSuccess: "提现成功！您的余额已更新！",
  withdrawBettingsSuccess: "撤销投注成功！您的投注记录已清空！",
  withdrawFailNoBettingRecords: "撤销投注失败，您没有任何有效的投注记录。",
};
// 帮助 规则 开始 充值/提现(上下分) 下注 撤投 历史
export function apply(ctx: Context, config: Config) {
  ctx = ctx.guild()
  ctx.model.extend('fantan_games', {
    id: 'unsigned',
    guildId: 'string',
    issuePrefix: 'string',
    issueSuffix: 'string',
    gameStartTime: 'string',
    isBettingTimeOver: 'boolean',
    lotteryResult: 'integer',
    scoreSummary: 'double',
  })
  ctx.model.extend('fantan_player_records', {
    id: 'unsigned',
    guildId: 'string',
    userId: 'string',
    userName: 'string',
    // issueNumber: 'string', // 期号
    betType: 'string',
    bettingNumber: 'string',
    amount: 'double',
    commission: 'double',
    score: 'double',
  })
  ctx.model.extend('ffantan_player_infos', {
    id: 'unsigned',
    userId: 'string',
    userName: 'string',
    balance: 'double',
    totalRounds: 'integer',
    scoreSummary: 'double',
  })

  const {
    betWaitingTime,
    waitingForLotteryTime,
    waitingForSettlementTime,
  } = config

  ctx.command('fantan', '查看番摊指令帮助')
    .action(async ({ session }) => {
      await session.execute(`fantan -h`)
    })
  ctx.command('fantan.rule', '查看番摊游戏规则').alias('番摊规则')
    .action(async ({ session }) => {
      await session.send(`番摊游戏规则说明：

1. 游戏准备：

  - 当游戏开始时，玩家可以选择投注。
  - 投注结束后根据开奖结果计算每位玩家的得分情况。
  - 开奖结果为 1、2、3、4 其中的一个。

2. 注意事项：

  - 如果玩家投注的项目和开奖结果相符，即为赢；如果不相符，即为输；如果有特殊规定，即为和局（退回本金）。
  - 所有获胜的投注项目，场方将抽取5%作为佣金。

3. 投注项目及赔率：

  - 单双投注：可选择下注单（1、3）或双（2、4）。赔率为1赔1。
  - 正投注：可选择下注某个数字X，当开出X时，下注X正赢；开出对面数字输；开出两边数字为和局。例如，如果开出1，则下注"1正"赢，"3正"输，"2正"和局，"4正"和局。赔率为1赔1。
  - 番投注：可选择下注某个数字X，当开出X时，其他数字输。赔率为1赔3。
  - 念投注：可选择下注X念Y，当开出X时，开出Y为和局，其他数字输。赔率为1赔2。例如，如果开出1时，下注1念2和1念4赢，下注2念1和4念1为和局，其他情况输。
  - 角投注：可选择下注XY，当开出X或Y时赢，其他数字输。赔率为1赔1。
  - 通(Y)投注：投注三个号码，选定其中两个为赢，另一个为和。赔率为2赔1。例如，下注"12通4"的1和2，如果结果为1或2，则赢；如果结果为3，则输；如果结果为4，则和局，退回本金。
  - 中（三红）投注：可选择下注XYZ，当开出X、Y、Z其中一个为赢，其他数字输。赔率为3赔1。`)
    })


  ctx.command('fantan.start', '开始一期番摊游戏').alias('开摊')
    .action(async ({ session }) => {
      const {
        guildId,
      } = session

      const issuePrefix = formatDateString();
      const issueInfo = await ctx.database.get('fantan_games', { guildId, issuePrefix })

      // 调用函数，生成期号后缀
      const issueSuffix = await generateIssueSuffix(issueInfo, issuePrefix, guildId)

      // 如果返回null，说明当前期还没有结束，发送失败消息
      if (issueSuffix === null) {
        return msg.gameStartFail
      }

      await session.send(`当前期号为：【${issuePrefix}${issueSuffix}】

投注时长为：【${betWaitingTime}】秒！

请各位玩家在规定时间内发送投注指令进行投注！

投注项目及赔率如下所示：

- 单：赔率为1赔1。
- 双：赔率为1赔1。
- 正：赔率为1赔1。
- 番：赔率为1赔3。
- 念：赔率为1赔2。
- 角：赔率为1赔1。
- 通：赔率为2赔1。
- 中：赔率为3赔1。

投注格式为：
【投注类型 投注数字 投注金额】
（单双投注例外，仅需发送投注金额即可）

例如（发送指令时不需要【】）：
【单 500】：下注单（1、3），下注金额为 500。
【念 12 500】：下注 1念2，下注金额为 500。
【正 1 100】：下注 1 正，下注金额为 100。

注意：
1. 投注时长结束后禁止投注！
2. 可发送【番摊规则】查看游戏规则。`)

      // 投注时长
      await sleep(betWaitingTime * 1000)
      // 生成一个 [1, 4] 的随机整数
      const random = new Random(() => Math.random())
      const lotteryResult = random.int(1, 5)
      // 结束投注
      await ctx.database.set('fantan_games', { guildId, issuePrefix, issueSuffix }, { isBettingTimeOver: true, lotteryResult })
      // 公布开奖结果并结算
      await session.send(msg.betEndAnnouncement)

      // 统计玩家投注记录
      const playerInfos = await ctx.database.get('fantan_player_records', { guildId })
      if (playerInfos.length !== 0) {
        // 初始化一个空字符串
        let betInfoString = '';

        // 遍历 playerInfos 数组
        for (const player of playerInfos) {
          // 拼接玩家信息到字符串
          const playerInfoString = `用户名: 【${player.userName}】
投注类型: 【${player.betType}】
投注号码: 【${player.bettingNumber}】
投注金额：【${player.amount}】\n\n`;

          // 将玩家信息字符串追加到输出字符串
          betInfoString += playerInfoString;
        }
        await session.send(`本期投注记录如下：

${betInfoString}`)
      } else {
        await ctx.database.remove('fantan_player_records', { guildId })
        await sleep(1000)
        return msg.gameNoBettors
      }

      // 等待开奖的时间
      await sleep(waitingForLotteryTime * 1000)

      await session.send(`本期期号为：【${issuePrefix}${issueSuffix}】

本期开奖结果为：【${lotteryResult}】！

正在结算中！请稍等片刻......`)

      // 等待结算的时间
      await sleep(waitingForSettlementTime * 1000)

      // 拉取当前群组所有玩家记录
      const playerRecords = await ctx.database.get('fantan_player_records', { guildId })
      let settlementRecord: string = ''
      // 遍历 playerRecords 的所有元素，分别调用函数计算每位玩家的得分情况和平台抽水
      for (const playerRecord of playerRecords) {
        const { userId, userName, betType, bettingNumber, amount } = playerRecord;

        // 调用函数计算玩家得分情况
        const record = await calculatePlayerScore(guildId, issuePrefix, issueSuffix, userId, userName, betType, bettingNumber, amount, lotteryResult);
        settlementRecord = settlementRecord + record

      }
      const gameInfo = (await ctx.database.get('fantan_games', { guildId, issuePrefix, issueSuffix }))[0]
      await session.send(`游戏结算成功！结果如下：

${settlementRecord}
本期投注记录总数为：【${playerRecords.length}】条！
得分合计为：【${gameInfo.scoreSummary}】`)
      await ctx.database.remove('fantan_player_records', { guildId })
      await sleep(1000)
      return msg.gameEndPerfect
    })

  ctx.command('fantan.single <amount:number>', '单投注').alias('单投注')
    .action(async ({ session }, amount: number) => {
      const {
        username,
        userId,
        guildId,
      } = session
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      // 获取玩家信息并检查余额是否足够
      const playerInfo = await getPlayerInfo(userId, username)
      if (playerInfo.balance < amount) {
        return `${msg.betFailInsufficientBalance}
您当前的余额为：【${playerInfo.balance}】`
      }
      const issuePrefix = formatDateString();
      const issueInfo = await ctx.database.get('fantan_games', { guildId, issuePrefix })
      if (issueInfo.length === 0 || issueInfo[issueInfo.length - 1].isBettingTimeOver) {
        return msg.betFailGameNotStartedOrEndTimeExpired
      }
      await Promise.all([
        ctx.database.create('fantan_player_records', { guildId, userId, userName: username, betType: '单', bettingNumber: '13', amount }),
      ])
      const playerRecords = await ctx.database.get('fantan_player_records', { guildId, userId })
      let outputString = '';

      for (const record of playerRecords) {
        const { betType, bettingNumber, amount } = record;
        outputString += `投注类型：【${betType}】
投注数字：【${bettingNumber}】
投注金额：【${amount}】\n\n`;
      }

      return `${h.at(userId)} ~\n${msg.betSuccessRecorded}

您在本期的投注记录如下：
用户名：【${username}】

${outputString}`
    })
  ctx.command('fantan.double <amount:number>', '双投注').alias('双投注')
    .action(async ({ session }, amount: number) => {
      const {
        username,
        userId,
        guildId,
      } = session
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      // 获取玩家信息并检查余额是否足够
      const playerInfo = await getPlayerInfo(userId, username)
      if (playerInfo.balance < amount) {
        return `${msg.betFailInsufficientBalance}
您当前的余额为：【${playerInfo.balance}】`
      }
      await Promise.all([
        ctx.database.create('fantan_player_records', { guildId, userId, userName: username, betType: '双', bettingNumber: '24', amount }),

      ])
      const playerRecords = await ctx.database.get('fantan_player_records', { guildId, userId })
      let outputString = '';

      for (const record of playerRecords) {
        const { betType, bettingNumber, amount } = record;
        outputString += `投注类型：【${betType}】
投注数字：【${bettingNumber}】
投注金额：【${amount}】\n\n`;
      }

      return `${h.at(userId)} ~\n${msg.betSuccessRecorded}

您在本期的投注记录如下：
用户名：【${username}】

${outputString}`
    })
  ctx.command('fantan.zheng <bettingNumber:string> <amount:number>', '正投注').alias('正投注')
    .action(async ({ session }, bettingNumber: string, amount: number) => {
      const {
        username,
        userId,
        guildId,
      } = session
      if (!bettingNumber || !amount) {
        return
      }
      // 判断 bettingNumber 是否为有效数字，并且只能有一位
      if (bettingNumber.length !== 1 || isNaN(Number(bettingNumber))) {
        return msg.betFailInvalidNumber
      }
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      // 判断 bettingNumber 是否为开奖结果中的一个
      const winningNumbers = [1, 2, 3, 4];
      const bettingNum = Number(bettingNumber);
      if (!winningNumbers.includes(bettingNum)) {
        return msg.betFailNotInWinningNumbers
      }
      // 获取玩家信息并检查余额是否足够
      const playerInfo = await getPlayerInfo(userId, username)
      if (playerInfo.balance < amount) {
        return `${msg.betFailInsufficientBalance}
您当前的余额为：【${playerInfo.balance}】`
      }
      const issuePrefix = formatDateString();
      const issueInfo = await ctx.database.get('fantan_games', { guildId, issuePrefix })
      if (issueInfo.length === 0 || issueInfo[issueInfo.length - 1].isBettingTimeOver) {
        return msg.betFailGameNotStartedOrEndTimeExpired
      }
      await Promise.all([
        ctx.database.create('fantan_player_records', { guildId, userId, userName: username, betType: '正', bettingNumber, amount }),

      ])
      const playerRecords = await ctx.database.get('fantan_player_records', { guildId, userId })
      let outputString = '';

      for (const record of playerRecords) {
        const { betType, bettingNumber, amount } = record;
        outputString += `投注类型：【${betType}】
投注数字：【${bettingNumber}】
投注金额：【${amount}】\n\n`;
      }

      return `${h.at(userId)} ~\n${msg.betSuccessRecorded}

您在本期的投注记录如下：
用户名：【${username}】

${outputString}`
    })
  ctx.command('fantan.fan <bettingNumber:string> <amount:number>', '番投注').alias('番投注')
    .action(async ({ session }, bettingNumber: string, amount: number) => {
      const {
        username,
        userId,
        guildId,
      } = session
      if (!bettingNumber || !amount) {
        return
      }
      // 判断 bettingNumber 是否为有效数字，并且只能有一位
      if (bettingNumber.length !== 1 || isNaN(Number(bettingNumber))) {
        return msg.betFailInvalidNumber
      }
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      // 判断 bettingNumber 是否为开奖结果中的一个
      const winningNumbers = [1, 2, 3, 4];
      const bettingNum = Number(bettingNumber);
      if (!winningNumbers.includes(bettingNum)) {
        return msg.betFailNotInWinningNumbers
      }
      // 获取玩家信息并检查余额是否足够
      const playerInfo = await getPlayerInfo(userId, username)
      if (playerInfo.balance < amount) {
        return `${msg.betFailInsufficientBalance}
您当前的余额为：【${playerInfo.balance}】`
      }
      const issuePrefix = formatDateString();
      const issueInfo = await ctx.database.get('fantan_games', { guildId, issuePrefix })
      if (issueInfo.length === 0 || issueInfo[issueInfo.length - 1].isBettingTimeOver) {
        return msg.betFailGameNotStartedOrEndTimeExpired
      }
      await Promise.all([
        ctx.database.create('fantan_player_records', { guildId, userId, userName: username, betType: '番', bettingNumber, amount }),

      ])
      const playerRecords = await ctx.database.get('fantan_player_records', { guildId, userId })
      let outputString = '';

      for (const record of playerRecords) {
        const { betType, bettingNumber, amount } = record;
        outputString += `投注类型：【${betType}】
投注数字：【${bettingNumber}】
投注金额：【${amount}】\n\n`;
      }

      return `${h.at(userId)} ~\n${msg.betSuccessRecorded}

您在本期的投注记录如下：
用户名：【${username}】

${outputString}`
    })
  ctx.command('fantan.nian <bettingNumber:string> <amount:number>', '念投注').alias('念投注')
    .action(async ({ session }, bettingNumber: string, amount: number) => {
      const {
        username,
        userId,
        guildId,
      } = session
      if (!bettingNumber || !amount) {
        return
      }
      // 判断 bettingNumber 是否为有效数字，并且只能有两位
      if (bettingNumber.length !== 2 || isNaN(Number(bettingNumber))) {
        return msg.betFailInvalidNumber
      }
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      // 判断 bettingNumber 的每一位是否都为开奖结果中的一个
      const winningNumbers = [1, 2, 3, 4];
      for (let i = 0; i < bettingNumber.length; i++) {
        const digit = Number(bettingNumber[i]);
        if (!winningNumbers.includes(digit)) {
          return msg.betFailNotInWinningNumbers
        }
      }
      // 获取玩家信息并检查余额是否足够
      const playerInfo = await getPlayerInfo(userId, username)
      if (playerInfo.balance < amount) {
        return `${msg.betFailInsufficientBalance}
您当前的余额为：【${playerInfo.balance}】`
      }
      const issuePrefix = formatDateString();
      const issueInfo = await ctx.database.get('fantan_games', { guildId, issuePrefix })
      if (issueInfo.length === 0 || issueInfo[issueInfo.length - 1].isBettingTimeOver) {
        return msg.betFailGameNotStartedOrEndTimeExpired
      }
      await Promise.all([
        ctx.database.create('fantan_player_records', { guildId, userId, userName: username, betType: '念', bettingNumber, amount }),

      ])
      const playerRecords = await ctx.database.get('fantan_player_records', { guildId, userId })
      let outputString = '';

      for (const record of playerRecords) {
        const { betType, bettingNumber, amount } = record;
        outputString += `投注类型：【${betType}】
投注数字：【${bettingNumber}】
投注金额：【${amount}】\n\n`;
      }

      return `${h.at(userId)} ~\n${msg.betSuccessRecorded}

您在本期的投注记录如下：
用户名：【${username}】

${outputString}`
    })
  ctx.command('fantan.jiao <bettingNumber:string> <amount:number>', '角投注').alias('角投注')
    .action(async ({ session }, bettingNumber: string, amount: number) => {
      const {
        username,
        userId,
        guildId,
      } = session
      if (!bettingNumber || !amount) {
        return
      }
      // 判断 bettingNumber 是否为有效数字，并且只能有两位
      if (bettingNumber.length !== 2 || isNaN(Number(bettingNumber))) {
        return msg.betFailInvalidNumber
      }
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      // 判断 bettingNumber 的每一位是否都为开奖结果中的一个
      const winningNumbers = [1, 2, 3, 4];
      for (let i = 0; i < bettingNumber.length; i++) {
        const digit = Number(bettingNumber[i]);
        if (!winningNumbers.includes(digit)) {
          return msg.betFailNotInWinningNumbers
        }
      }
      // 获取玩家信息并检查余额是否足够
      const playerInfo = await getPlayerInfo(userId, username)
      if (playerInfo.balance < amount) {
        return `${msg.betFailInsufficientBalance}
您当前的余额为：【${playerInfo.balance}】`
      }
      const issuePrefix = formatDateString();
      const issueInfo = await ctx.database.get('fantan_games', { guildId, issuePrefix })
      if (issueInfo.length === 0 || issueInfo[issueInfo.length - 1].isBettingTimeOver) {
        return msg.betFailGameNotStartedOrEndTimeExpired
      }
      await Promise.all([
        ctx.database.create('fantan_player_records', { guildId, userId, userName: username, betType: '角', bettingNumber, amount }),

      ])
      const playerRecords = await ctx.database.get('fantan_player_records', { guildId, userId })
      let outputString = '';

      for (const record of playerRecords) {
        const { betType, bettingNumber, amount } = record;
        outputString += `投注类型：【${betType}】
投注数字：【${bettingNumber}】
投注金额：【${amount}】\n\n`;
      }

      return `${h.at(userId)} ~\n${msg.betSuccessRecorded}

您在本期的投注记录如下：
用户名：【${username}】

${outputString}`
    })
  ctx.command('fantan.tong <bettingNumber:string> <amount:number>', '通投注').alias('通投注')
    .action(async ({ session }, bettingNumber: string, amount: number) => {
      const {
        username,
        userId,
        guildId,
      } = session
      if (!bettingNumber || !amount) {
        return
      }
      // 判断 bettingNumber 是否为有效数字，并且只能有三位
      if (bettingNumber.length !== 3 || isNaN(Number(bettingNumber))) {
        return msg.betFailInvalidNumber
      }
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      // 判断 bettingNumber 的每一位是否都为开奖结果中的一个
      const winningNumbers = [1, 2, 3, 4];
      for (let i = 0; i < bettingNumber.length; i++) {
        const digit = Number(bettingNumber[i]);
        if (!winningNumbers.includes(digit)) {
          return msg.betFailNotInWinningNumbers
        }
      }
      // 获取玩家信息并检查余额是否足够
      const playerInfo = await getPlayerInfo(userId, username)
      if (playerInfo.balance < amount) {
        return `${msg.betFailInsufficientBalance}
您当前的余额为：【${playerInfo.balance}】`
      }
      const issuePrefix = formatDateString();
      const issueInfo = await ctx.database.get('fantan_games', { guildId, issuePrefix })
      if (issueInfo.length === 0 || issueInfo[issueInfo.length - 1].isBettingTimeOver) {
        return msg.betFailGameNotStartedOrEndTimeExpired
      }
      await Promise.all([
        ctx.database.create('fantan_player_records', { guildId, userId, userName: username, betType: '通', bettingNumber, amount }),

      ])
      const playerRecords = await ctx.database.get('fantan_player_records', { guildId, userId })
      let outputString = '';

      for (const record of playerRecords) {
        const { betType, bettingNumber, amount } = record;
        outputString += `投注类型：【${betType}】
投注数字：【${bettingNumber}】
投注金额：【${amount}】\n\n`;
      }

      return `${h.at(userId)} ~\n${msg.betSuccessRecorded}

您在本期的投注记录如下：
用户名：【${username}】

${outputString}`
    })
  ctx.command('fantan.middle <bettingNumber:string> <amount:number>', '中投注').alias('中投注')
    .action(async ({ session }, bettingNumber: string, amount: number) => {
      const {
        username,
        userId,
        guildId,
      } = session
      if (!bettingNumber || !amount) {
        return
      }
      // 判断 bettingNumber 是否为有效数字，并且只能有三位
      if (bettingNumber.length !== 3 || isNaN(Number(bettingNumber))) {
        return msg.betFailInvalidNumber
      }
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      // 判断 bettingNumber 的每一位是否都为开奖结果中的一个
      const winningNumbers = [1, 2, 3, 4];
      for (let i = 0; i < bettingNumber.length; i++) {
        const digit = Number(bettingNumber[i]);
        if (!winningNumbers.includes(digit)) {
          return msg.betFailNotInWinningNumbers
        }
      }
      // 获取玩家信息并检查余额是否足够
      const playerInfo = await getPlayerInfo(userId, username)
      if (playerInfo.balance < amount) {
        return `${msg.betFailInsufficientBalance}
您当前的余额为：【${playerInfo.balance}】`
      }
      const issuePrefix = formatDateString();
      const issueInfo = await ctx.database.get('fantan_games', { guildId, issuePrefix })
      if (issueInfo.length === 0 || issueInfo[issueInfo.length - 1].isBettingTimeOver) {
        return msg.betFailGameNotStartedOrEndTimeExpired
      }
      await Promise.all([
        ctx.database.create('fantan_player_records', { guildId, userId, userName: username, betType: '中', bettingNumber, amount }),
      ])
      const playerRecords = await ctx.database.get('fantan_player_records', { guildId, userId })
      let outputString = '';

      for (const record of playerRecords) {
        const { betType, bettingNumber, amount } = record;
        outputString += `投注类型：【${betType}】
投注数字：【${bettingNumber}】
投注金额：【${amount}】\n\n`;
      }

      return `${h.at(userId)} ~\n${msg.betSuccessRecorded}

您在本期的投注记录如下：
用户名：【${username}】

${outputString}`
    })

  ctx.command('fantan.withdrawBettings', '撤销本期所有投注').alias('撤投')
    .action(async ({ session }) => {
      const {
        guildId,
        userId,
      } = session
      const playerRecords = await ctx.database.get('fantan_player_records', { guildId, userId })
      if (playerRecords.length === 0) {
        return `${msg.withdrawFailNoBettingRecords}`
      }
      await ctx.database.remove('fantan_player_records', { guildId, userId })
      return `${msg.withdrawBettingsSuccess}`
    })
  ctx.command('fantan.myInfo', '查看个人信息')
    .action(async ({ session }) => {
      const {
        userId,
        username
      } = session
      const playerInfo = await getPlayerInfo(userId, username)
      return `用户名：【${playerInfo.userName}】
余额：【${playerInfo.balance}】
参与次数：【${playerInfo.totalRounds}】
总得分情况：【${playerInfo.scoreSummary}】`
    })
  ctx.command('fantan.rechargeAmount <amount:number>', '给自己充值')
    .action(async ({ session }, amount: number) => {
      const {
        userId,
        username
      } = session
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      const playerInfo = await getPlayerInfo(userId, username)
      await ctx.database.set('ffantan_player_infos', { userId }, { balance: playerInfo.balance + amount })
      return `${msg.rechargeSuccess}
您当前的余额为：【${playerInfo.balance + amount}】`
    })
  ctx.command('fantan.userRecharge <arg:user> <amount:number>', '给指定用户充值')
    .action(async ({ session }, user, amount: number) => {
      const {
        username
      } = session
      if (!user) {
        return;
      }
      const userId = user.split(":")[1];
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      const playerInfo = await getPlayerInfo(userId, username)
      await ctx.database.set('ffantan_player_infos', { userId }, { balance: playerInfo.balance + amount })
      return `${msg.rechargeSuccess}
指定的用户当前的余额为：【${playerInfo.balance + amount}】`
    })
  ctx.command('fantan.withdrawalAmount <amount:number>', '给自己提现')
    .action(async ({ session }, amount: number) => {
      const {
        userId,
        username
      } = session
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      const playerInfo = await getPlayerInfo(userId, username)
      await ctx.database.set('ffantan_player_infos', { userId }, { balance: playerInfo.balance - amount })
      return `${msg.withdrawSuccess}
您当前的余额为：【${playerInfo.balance - amount}】`
    })
  ctx.command('fantan.userWithdrawal <arg:user> <amount:number>', '给指定用户提现')
    .action(async ({ session }, user, amount: number) => {
      const {
        username
      } = session
      if (!user) {
        return;
      }
      const userId = user.split(":")[1];
      // 检查 amount 是否为有效数字，并且大于零
      if (isNaN(amount) || amount <= 0) {
        return msg.betFailInvalidAmount
      }
      const playerInfo = await getPlayerInfo(userId, username)
      await ctx.database.set('ffantan_player_infos', { userId }, { balance: playerInfo.balance - amount })
      return `${msg.withdrawSuccess}
指定的用户当前的余额为：【${playerInfo.balance - amount}】`
    })
  ctx.command('fantan.history', '查看最近的番摊游戏记录').alias('番摊历史')
    .action(async ({ session }) => {
      const {
        guildId,
      } = session
      const gameInfos = await ctx.database.get('fantan_games', { guildId })

      let output = '';

      gameInfos.sort((a, b) => {
        const dateA = new Date(a.gameStartTime).getTime();
        const dateB = new Date(b.gameStartTime).getTime();
        return dateB - dateA;
      });
      const numRecords = Math.min(gameInfos.length, 10);

      for (let i = 0; i < numRecords; i++) {
        const { issuePrefix, issueSuffix, gameStartTime, lotteryResult, scoreSummary } = gameInfos[i];
        const issue = issuePrefix + issueSuffix;
        output += `期号：【${issue}】
开始时间：【${gameStartTime}】
开奖结果：【${lotteryResult}】
得分总计：【${scoreSummary}】\n\n`;
      }

      return output
    })

  async function calculatePlayerScore(guildId: string, issuePrefix: string, issueSuffix: string, userId: string, userName: string, betType: string, bettingNumber: string, amount: number, lotteryResult: number) {
    let win: boolean;
    let draw: boolean; // 是否和局
    let payout: number; // 赔付金额
    let commission: number; // 场方佣金
    let score: number; // 得分

    switch (betType) {
      case '单':
        win = lotteryResult % 2 === 1;
        draw = false;
        payout = amount * 1;
        break;
      case '双':
        win = lotteryResult % 2 === 0;
        draw = false;
        payout = amount * 1;
        break;
      case '正':
        win = lotteryResult === parseInt(bettingNumber);
        draw = Math.abs(lotteryResult - parseInt(bettingNumber)) !== 2;
        payout = amount * 1;
        break;
      case '番':
        win = lotteryResult === parseInt(bettingNumber);
        draw = false;
        payout = amount * 3;
        break;
      case '念':
        win = lotteryResult === parseInt(bettingNumber[0]);
        draw = lotteryResult === parseInt(bettingNumber[1]);
        payout = amount * 2;
        break;
      case '角':
        win = lotteryResult === parseInt(bettingNumber[0]) || lotteryResult === parseInt(bettingNumber[1]);
        draw = false;
        payout = amount * 1;
        break;
      case '通':
        win = lotteryResult === parseInt(bettingNumber[0]) || lotteryResult === parseInt(bettingNumber[1]);
        draw = lotteryResult === parseInt(bettingNumber[2]);
        payout = amount * 2;
        break;
      case '中':
        win = bettingNumber.includes(lotteryResult.toString());
        draw = false;
        payout = amount * (1 / 3);
        break;
      default:
        return '无效的投注类型';
    }

    commission = win ? payout * 0.05 : 0;
    score = win ? payout - commission : (draw ? 0 : -amount);

    // 获取玩家的信息
    const playerInfo = (await ctx.database.get('ffantan_player_infos', { userId }))[0]
    const gameInfo = (await ctx.database.get('fantan_games', { guildId, issuePrefix, issueSuffix }))[0]
    const balance = playerInfo.balance + score
    await Promise.all([
      await ctx.database.set('fantan_games', { guildId, issuePrefix, issueSuffix }, { scoreSummary: gameInfo.scoreSummary + score }),
      // 更新玩家记录
      await ctx.database.set('fantan_player_records', { guildId, userId }, { commission, score }),
      // 更新玩家信息
      await ctx.database.set('ffantan_player_infos', { userId }, { balance, totalRounds: playerInfo.totalRounds + 1, scoreSummary: playerInfo.scoreSummary + score })
    ])

    return `用户名：【${userName}】\n投注类型：【${betType}】\n投注数字：【${bettingNumber}】\n投注金额：【${amount}】\n赔付金额：【${payout}】\n场方佣金：【${commission}】\n得分：【${score}】\n账户余额：【${balance}】\n\n`;
  }

  // 定义一个函数，用于生成期号的后缀
  async function generateIssueSuffix(issueInfo: FantanGame[], issuePrefix: string, guildId: string) {
    let issueSuffix: string
    if (issueInfo.length === 0) {
      issueSuffix = '001'
    } else {
      const currentIssueInfo = issueInfo[issueInfo.length - 1]
      if (!currentIssueInfo.isBettingTimeOver) {
        return null // 如果当前期还没有结束，返回null
      }
      const currentSuffix = parseInt(currentIssueInfo.issueSuffix, 10);
      const nextSuffix = currentSuffix + 1;
      issueSuffix = nextSuffix.toString().padStart(3, '0');
    }
    // 在数据库中创建新的期号
    await ctx.database.create('fantan_games', {
      guildId, issuePrefix, issueSuffix, gameStartTime: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Shanghai',
        // timeZoneName: 'short'
      }), isBettingTimeOver: false
    })
    return issueSuffix // 返回生成的期号后缀
  }

  async function getPlayerInfo(userId: string, userName: string): Promise<FantanPlayerInfo> {
    const playerInfo = await ctx.database.get('ffantan_player_infos', { userId })
    if (playerInfo.length === 0) {
      return await ctx.database.create('ffantan_player_infos', { userId, userName, balance: 0 })
    }
    if (userName !== playerInfo[0].userName) {
      await ctx.database.set('ffantan_player_infos', { userId }, { userName })
      playerInfo[0].userName = userName
    }
    return playerInfo?.[0]
  }
}

function formatDateString(): string {
  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // 获取月份并补零
  const day = String(currentDate.getDate()).padStart(2, '0'); // 获取日期并补零
  const formattedString = `${month}${day}`;
  return formattedString;
}

