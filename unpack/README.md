## frida-Android脱壳
- [x] Android 7.1.2测试通过
- [x] 腾讯加固
- [x] 360加固
- [x] 爱加密 

## 使用

1. `pip install frida`
2. `pip install frida-tools`
3. 安装加固过的apk到手机
4. `frida -R -f {app包名} -l unpack.js` （用app包名替换`{app包名}`）
5. 在`/data/data/{app包名}/files/{数字}.dex`（从内存中dump的dex会放到files目录下面的十六进制数字命名的dex文件中，emm.dex不是哈）

