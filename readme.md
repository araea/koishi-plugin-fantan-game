# koishi-plugin-fantan-game

[![npm](https://img.shields.io/npm/v/koishi-plugin-fantan-game?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-fantan-game)

## 🎈 简介

这是一个 [Koishi ↗](https://koishi.chat/) 插件，让你可以在群聊中与朋友们一起玩一场有趣刺激的番摊游戏。番摊是一种传统的中国赌博游戏，你可以从多种投注选项中选择，并根据赔率和规则赚取分数。

## 📦 安装

```
前往 Koishi 插件市场添加该插件即可
```

## ⚙️ 配置

- `betWaitingTime`：玩家下注的时间（以秒为单位），默认是 45 秒。
- `waitingForLotteryTime`：等待开奖结果的时间（以秒为单位），默认是 5 秒。
- `waitingForSettlementTime`：等待结算的时间（以秒为单位）默认是 5 秒。

## 🎮 使用

- 需要先使用充值指令为玩家充值喵~
- 该插件仅在群聊中可用。
- 建议为命令添加一些别名。

## ⚙️ 规则

番摊游戏规则说明：

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
  - 中（三红）投注：可选择下注XYZ，当开出X、Y、Z其中一个为赢，其他数字输。赔率为3赔1。

### 📝 命令

| 命令                                    | 描述                         | 示例                                |
| --------------------------------------- | ---------------------------- | ----------------------------------- |
| `fantan`                                | 显示 fantan 命令的帮助信息。 | `fantan`                            |
| `fantan.rule`                           | 显示 fantan 游戏的规则。     | `fantan.rule`                       |
| `fantan.start`                          | 开始新的 fantan 游戏。       | `fantan.start`                      |
| `fantan.single <amount>`                | 单投注（1 或 3）。           | `fantan.single 500`                 |
| `fantan.double <amount>`                | 双投注（2 或 4）。           | `fantan.double 500`                 |
| `fantan.fan <number> <amount>`          | 番投注（具体的数字）。       | `fantan.fan 1 500`                  |
| `fantan.nian <number> <amount>`         | 念投注（一对数字）。         | `fantan.nian 12 500`                |
| `fantan.jiao <number> <amount>`         | 角投注（一对数字）。         | `fantan.jiao 13 500`                |
| `fantan.tong <number> <amount>`         | 通投注（三个数字）。         | `fantan.tong 124 500`               |
| `fantan.middle <number> <amount>`       | 中投注（三个数字）。         | `fantan.middle 123 500`             |
| `fantan.withdrawBettings`               | 撤回当前游戏中的所有押注。   | `fantan.withdrawBettings`           |
| `fantan.myInfo`                         | 查看个人信息。               | `fantan.myInfo`                     |
| `fantan.rechargeAmount <amount>`        | 充值账户余额。               | `fantan.rechargeAmount 1000`        |
| `fantan.userRecharge <user> <amount>`   | 充值其他用户的账户余额。     | `@Alice fantan.userRecharge 1000`   |
| `fantan.withdrawalAmount <amount>`      | 提现账户余额。               | `fantan.withdrawalAmount 1000`      |
| `fantan.userWithdrawal <user> <amount>` | 提现其他用户的账户余额。     | `@Alice fantan.userWithdrawal 1000` |
| `fantan.history`                        | 查看最近的 fantan 游戏记录。 | `fantan.history`                    |

## 🌠 未来计划

- 增加更多的投注选项和功能。
- 改进用户界面和用户体验。
- 优化代码性能和质量。

## 🙏 致谢

- [Koishi ↗](https://koishi.chat/) - 聊天机器人框架。
- [fantanRule ↗](https://www.sa-rules.com/sc/fantan.html) - 番摊游戏规则。

## 📄 许可证

MIT许可证 © 2023