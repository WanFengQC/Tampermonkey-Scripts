# Tampermonkey-Scripts

这个仓库用来存放我编写和维护的油猴脚本。

目前仓库中包含两个版本：

- `autopaly.js`：1.0 精简版，仅保留自动下一课功能
- `学起plus/StudyAids.js`：3.2.2 完整版，包含课程定位、自动连播、低音量模式、悬浮球控制等功能

---

## 脚本列表

### 1. 学起plus自动连播（精简版）

- 文件名：`autopaly.js`
- 版本：`1.0`
- 功能：当前视频播放结束后自动进入下一课
- 适合：只想要自动下一课，不需要其他附加功能的场景

GreasyFork 安装地址：  
[学起plus自动连播 1.0](https://greasyfork.org/zh-CN/scripts/571333)

---

### 2. 学起plus学习助手（完整版）

- 文件名：`学起plus/StudyAids.js`
- 版本：`3.2.2`
- 功能：
  - 自动定位未达标课程
  - 自动定位未完成小节
  - 视频结束自动下一课
  - 视频暂停自动恢复播放
  - 低音量模式（替代脚本静音）
  - 悬浮球控制面板
  - 多页面设置同步

GreasyFork 安装地址：  
[学起plus学习助手 3.2.2](https://greasyfork.org/zh-CN/scripts/571362)

---

## 仓库结构

```text
tampermonkey/
├─ README.md
├─ autopaly.js
└─ 学起plus/
   ├─ README.md
   └─ StudyAids.js
```

---

## 版本说明

### 精简版 1.0

适合只需要“自动下一课”功能的用户，逻辑简单，兼容性高。

### 完整版 3.2.2

在精简版基础上扩展了完整的学习辅助能力，并持续针对以下问题进行优化：

- 自动下一课失效
- 页面局部刷新导致绑定丢失
- 后台播放容易暂停
- 脚本静音影响稳定性
- 控制面板配置同步

---

## 使用说明

### autopaly.js

安装后进入目标视频页面即可自动生效，无需额外设置。

### StudyAids.js

安装后页面右侧会出现悬浮球，可在控制面板中开启或关闭以下功能：

- 自动打开第一门未达标课程
- 自动打开第一个未完成小节
- 视频结束自动下一课
- 视频暂停自动恢复播放
- 低音量模式

---

## 适用站点

### 精简版 1.0

- `*.sccchina.net/venus/study/activity/video/study.do*`

### 完整版 3.2.2

- `cjyw.hdu.edu.cn/student/*`
- `*.sccchina.net/venus/study/index/study.do*`
- `*.sccchina.net/venus/study/activity/video/study.do*`

---

## 说明

本仓库脚本仅用于个人学习辅助与功能优化，请根据实际需求自行使用。
