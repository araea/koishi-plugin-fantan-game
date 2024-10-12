# koishi-plugin-fantan-game

[![npm](https://img.shields.io/npm/v/koishi-plugin-fantan-game?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-fantan-game)

## 简介

Koishi 的番摊赌博游戏插件。

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
| `fantan.单投注 <投注>`       | 单投注（1 或 3）  | `fantan.single 500`                 |
| `fantan.双投注 <投注>`       | 双投注（2 或 4）  | `fantan.double 500`                 |
| `fantan.正投注 <数> <投注>`   | 正投注（具体的数字）  | `fantan.zheng 1 500`                |
| `fantan.番投注 <数> <投注>`   | 番投注（具体的数字）  | `fantan.fan 1 500`                  |
| `fantan.念投注 <数> <投注>`   | 念投注（一对数字）   | `fantan.nian 12 500`                |
| `fantan.角投注 <数> <投注>`   | 角投注（一对数字）   | `fantan.jiao 13 500`                |
| `fantan.通投注 <数> <投注>`   | 通投注（三个数字）   | `fantan.tong 124 500`               |
| `fantan.中投注 <数> <投注>`   | 中投注（三个数字）   | `fantan.middle 123 500`             |
| `fantan.充值 <投注>`        | 充值账户余额      | `fantan.rechargeAmount 1000`        |
| `fantan.充值用户 <用户> <投注>` | 充值其他用户的账户余额 | `fantan.userRecharge @Alice 1000`   |
| `fantan.提现 <投注>`        | 提现账户余额      | `fantan.withdrawalAmount 1000`      |
| `fantan.提现用户 <用户> <投注>` | 提现其他用户的账户余额 | `fantan.userWithdrawal @Alice 1000` |

## 致谢

- [Koishi](https://koishi.chat/) - 聊天机器人框架。
- [fantanRule](https://www.sa-rules.com/sc/fantan.html) - 番摊游戏规则。

## QQ 群

- 956758505

## License

MIT License © 2024
