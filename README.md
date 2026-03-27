# Tampermonkey 脚本仓库说明

本仓库用于存放我个人维护的所有油猴（Tampermonkey）脚本。

不同网站、不同项目的脚本会按目录分类存放，便于统一管理、维护与更新。

## 文件结构

```text
tampermonkey/
├─ README.md ← 当前文件
└─ 学起plus/
   ├─ README.md ← 学起plus脚本说明
   ├─ autopaly.js ← 1.0 精简版（仅自动下一集）
   └─ StudyAids.js ← 3.1.6 完整版
```
## 脚本分类说明

### 学起plus
学起plus目录用于存放与学起平台相关的油猴脚本。

包含以下版本：

#### 1.0 精简版
- 文件名：`autopaly.js`
- 功能：仅保留自动下一集功能
- Greasy Fork 链接：
  https://greasyfork.org/zh-CN/scripts/571333

#### 3.1.6 完整版
- 文件名：`StudyAids.js`
- 功能：完整增强版脚本
- Greasy Fork 链接：
  https://greasyfork.org/zh-CN/scripts/571362

## 使用说明

1. 安装浏览器扩展 Tampermonkey
2. 进入对应脚本目录
3. 选择需要的脚本版本
4. 将脚本导入 Tampermonkey 后启用
5. 打开对应页面即可生效

## 备注

- 本仓库是油猴脚本总仓库
- 各脚本按项目或网站分类存放
- `学起plus` 目录下当前包含 1.0 精简版与 3.1.6 完整版两个脚本
