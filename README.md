# cgyy

## 依赖
安装[node.js](https://nodejs.org/en/download/current)

安装python3

```
npm install fs puppeteer child_process
pip install opencv-python
```

## 修改配置
修改`cgyy.js`开头的配置；

注意！！！！！！！！！
`cgyy.js`第190行`await delay();`最好根据电脑配置来减小已加快速度，实测在本人电脑无需这条命令。

如果你的账号在登陆时没有“您目前的登录密码过于简单，为保障系统安全，建议您立即修改密码。”的提示，请将49-53行删去或注释。

![tips](tips.png)


## 测试
使用pingpong来测试，如果所选时间段的对应编号场已被预约，网页会卡在“请选择需要预订的场地信息！”，可以确认后手动再选场提交！

```
cd <path-to-proj>
node .\cgyy.js
```