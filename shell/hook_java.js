if(Java.available) {
	Java.perform(function(){
		var application = Java.use("android.app.Application");
		var Toast = Java.use('android.widget.Toast');

		application.attach.overload('android.content.Context').implementation = function(context) {
			var result = this.attach(context); // 先执行原来的attach方法
			var classloader = context.getClassLoader(); // 获取classloader
			Java.classFactory.loader = classloader;
			var AyWelcome = Java.classFactory.use("flytv.run.monitor.fragment.user.AyWelcome"); //这里能直接使用Java.use，因为java.use会检查在不在perform里面，不在就会失败
			console.log("AyWelcome: " + AyWelcome);
			// 然后下面的代码就和写正常的hook一样啦
			AyWelcome.onCreate.overload('android.os.Bundle').implementation = function(bundle) {
				var ret = this.onCreate(bundle);
				Toast.makeText(context, "onCreate called", 1).show(); //弹出Toast
				return ret;
			}
			return result;
		}
	});
}
