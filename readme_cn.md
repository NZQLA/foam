# Foam 社区 fork

> **非官方 fork：** 本仓库基于 [Foam](https://github.com/foambubble/foam) 开发，由社区独立维护，并非 Foam 官方发布版本。

## 向 Foam 原作者与社区致敬

谨向 Foam 的原始创作者 Jani Eväkallio、历任维护者以及所有贡献者致以诚挚感谢。你们在代码、文档和社区上的投入，建立了这个 fork 所依托的坚实基础。这个 fork 只是为了继续实践一些额外想法，并非要取代或淡化原项目。

## 本 fork 新增：像 Obsidian 一样用 Wiki 链接嵌入音视频

在 Foam 的 Markdown 预览里，可以像 Obsidian 一样用 Wiki 链接嵌入本地音频和视频，不用再手写 `<audio>` 或 `<video>` 标签：

- 带扩展名：
```markdown
![[meeting-recording.mp4]]
![[field-recording.mp3]]
```

- 不带扩展名：
```markdown
![[meeting-recording]]
![[field-recording]]
```

### 支持的音视频格式

视频：`.mp4`、`.webm`、`.avi`、`.mov`。音频：`.mp3`、`.wav`、`.m4a`。

[VS Code 并不原生支持所有音视频格式。](https://github.com/microsoft/vscode/issues/167685) 记得确认你的媒体文件格式能被 VS Code 播放。

原版 Foam 项目介绍、功能说明和贡献者名单保留在[英文 README](readme.md) 中。
