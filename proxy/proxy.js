if(Java.available) {
    Java.perform(function(){
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
            console.log("已设置系统代理");
        }
    });
}