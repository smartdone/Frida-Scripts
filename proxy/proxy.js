if(Java.available) {
    Java.perform(function(){
        // 修改为你burp的ip端口，端口也要用字符串
        var HOST = "172.16.102.48";
        var PORT_INT = 8080;
        var PORT = "" + PORT_INT;
        var System = undefined;
        var InetSocketAddress = undefined;
        var String = undefined;
        var HTTP = Java.use("java.net.Proxy$Type").HTTP;
        var OkHttpClient_Builder = undefined;

        System = Java.use("java.lang.System");
        
        if(System != undefined) {
            System.setProperty("http.proxySet", "true");
            System.setProperty("http.proxyHost", HOST);
            System.setProperty("http.proxyPort", PORT);
            
            // 针对https也开启代理
            System.setProperty("https.proxyHost", HOST);
            System.setProperty("https.proxyPort", PORT);
            console.log("http.proxy already set. (" + HOST + ":" + PORT + ")");
        }
        Proxy = Java.use("java.net.Proxy");
        InetSocketAddress = Java.use("java.net.InetSocketAddress");
        String = Java.use("java.lang.String");
        
        if(Proxy != undefined && InetSocketAddress != undefined && String != undefined) {
            var addr = InetSocketAddress.$new(String.$new(HOST), PORT_INT);
            var proxy_addr = Proxy.$new(HTTP.value, addr);
            console.log("set okhttp porxy: " + proxy_addr);
            try {
                OkHttpClient_Builder = Java.use("okhttp3.OkHttpClient$Builder");
                if(OkHttpClient_Builder != undefined) {
                    OkHttpClient_Builder.build.overload().implementation = function() {
                        this.proxy(proxy_addr);
                        return this.build();
                    };
                }
            } catch (error) {
                console.error(error);
            }
        }

    });
}