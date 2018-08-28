# 使用Frida给Android设置代理

## 使用脚本

1. 修改HOST和PORT为你burp的ip和监听的端口
2. 安装frida(`sudo pip install frida-tools`)
3. 下载Android的frida-server
4. 在手机上运行frida-server
5. 转发端口`adb forward tcp:27042 tcp:27042`
6. 运行frida注入脚本`frida -R -f {应用包名} -l proxy.js`

## 使用系统库做http请求

对于使用系统库做http请求的，我们可以使用如下代码来设置代理，我们可以通过主动调用这个方法来设置代理：

```java
System.setProperty("http.proxySet", "true");
System.setProperty("http.proxyHost", proxyHost);
System.setProperty("http.proxyPort", "" + proxyPort);
 
// 针对https也开启代理
System.setProperty("https.proxyHost", proxyHost);
System.setProperty("https.proxyPookhttpokhttprt", "" + proxyPort);
```

实现的frida代码为

```java
// 修改为你burp的ip端口，端口也要用字符串
var HOST = "192.168.0.101";
var PORT = "8080";

var System = Java.use("java.lang.System");
if(System != undefined) {
    System.setProperty("http.proxySet", "true");
    System.setProperty("http.proxyHost", HOST);
    System.setProperty("http.proxyPort", PORT);
    
    // 针对https也开启代理
    System.setProperty("https.proxyHost", HOST);
    System.setProperty("https.proxyPort", PORT);
}
```



## 使用okhttp做http请求

### okhttp2

### okhttp3

