---
title: Frida劫持加固应用java方法
toc: false
date: 2018-09-10 22:26:05
tags: [Android, Hook, Frida, 加固]
---

### 需求

在对一些加固的Android应用做测试的时候，脱壳二次打包是一个相当相当复杂的工作。所以一般是脱壳分析代码，然后用hook的方式来动态劫持代码。使用xposed来hook加固的应用大家可能已经很熟悉了，但是使用frida大概没有多少人尝试，今天就给大家分享下如何使用xposed来hook加固之后的Android应用。

### 基本原理

要hook加固的应用分为三步，第一步是拿到加载应用本事dex的classloader；第二步是通过这个classloader去找到被加固的类；第三步是通过这个类去hook需要hook的方法

得到第一步的classloader之后的hook操作和hook未加固的应用基本类似。

#### 如何获取classloader

我们看Android的`android.app.Application`的源码[http://androidxref.com/7.1.2_r36/xref/frameworks/base/core/java/android/app/Application.java#188](http://androidxref.com/7.1.2_r36/xref/frameworks/base/core/java/android/app/Application.java#188)可以发现，自己定义的`Application`的`attachBaseContext`方法是在`Application`的`attach`方法里面被调用的。而基本上所有的壳都是在`attachBaseContext`里面完成的代码解密并且内存加载dex，在`attachBaseContext`执行完之后就可以去拿classloader，此时的classloader就已经是加载过加固dex的classloader了。

### 开始hook加固应用

以`i春秋`app为例，此应用使用的360加固，我们的目标是hook他的`flytv.run.monitor.fragment.user.AyWelcome`的`onCreate`方法，然后弹出一个`Toast`。

#### 直接使用`Java.use`

我们直接使用Java.use来获取这个Activity，代码如下：

```javascript
if(Java.available) {
	Java.perform(function(){
		var AyWelcome = Java.use("flytv.run.monitor.fragment.user.AyWelcome");
		if(AyWelcome != undefined) {
			console.log("AyWelcome: " + AyWelcome.toString());
		} else {
			console.log("AyWelcome: undefined");
		}
	});
}
```

使用如下命令来注入这个js：

```shell
frida -R -f com.ni.ichunqiu -l hook_java.js
```

运行之后会报如下的错误：

```txt
Spawned `com.ni.ichunqiu`. Use %resume to let the main thread start executing!
[Remote::com.ni.ichunqiu]-> %resume
[Remote::com.ni.ichunqiu]-> Error: java.lang.ClassNotFoundException: Didn't find class "flytv.run.monitor.fragment.user.AyWelcome" on path: DexPathList[[zip file "/data/app/com.ni.ichunqiu-1/base.apk"],nativeLibraryDirectories=[/data/app/com.ni.ichunqiu-1/lib/arm, /system/fake-libs, /data/app/com.ni.ichunqiu-1/base.apk!/lib/armeabi-v7a, /system/lib, /vendor/lib]]
    at frida/node_modules/frida-java/lib/env.js:222
    at ensureClass (frida/node_modules/frida-java/lib/class-factory.js:777)
    at frida/node_modules/frida-java/lib/class-factory.js:164
    at [anon] (repl1.js:3)
    at frida/node_modules/frida-java/lib/vm.js:39
    at v (frida/node_modules/frida-java/index.js:338)
    at frida/node_modules/frida-java/index.js:319
    at input:1
[Remote::com.ni.ichunqiu]->
```

也就是找不到这个类，也就是我们现在这个默认的classloader找不到`flytv.run.monitor.fragment.user.AyWelcome`这个类。

#### 获取classloader

代码如下：

```javascript
if(Java.available) {
	Java.perform(function(){
		var application = Java.use("android.app.Application");
		application.attach.overload('android.content.Context').implementation = function(context) {
			var result = this.attach(context); // 先执行原来的attach方法
			var classloader = context.getClassLoader();
			
			return result;
		}

	});
}
```

现在我们在`attach`方法执行之后拿到了Context，并且通过context获取了classloader，我们看现在的classloader是否加载了被加固的dex。我们使用classloader的`loadClass`方法去加载`flytv.run.monitor.fragment.user.AyWelcome`这个类，看是否成功：

```javascript
if(Java.available) {
	Java.perform(function(){
		var application = Java.use("android.app.Application");
		var reflectClass = Java.use("java.lang.Class");

		application.attach.overload('android.content.Context').implementation = function(context) {
			var result = this.attach(context); // 先执行原来的attach方法
			var classloader = context.getClassLoader(); // 获取classloader
			var AyWelcome = classloader.loadClass("flytv.run.monitor.fragment.user.AyWelcome"); // 使用classloader加载类
			AyWelcome = Java.cast(AyWelcome, reflectClass); // 因为loadClass得到的是一个Object对象，我们需要把它强制转换成Class
			console.log("AyWelcome class name: " + AyWelcome.getName());
			return result;
		}

	});
}
```

注入这个js，可以正确的打印出`flytv.run.monitor.fragment.user.AyWelcome`类名，说明我们拿到这个这个classloader是加载了加固过的dex的。

#### 转换成`Java.use`获取到的js对象

在上一步我们虽然可以通过frida来获取到加固之后的class，但是你如果直接使用这个`{class}.{fuction}`依然会失败，因为class没有这个成员变量，所以我们需要来实现获取到与`Java.use`一样的js对象，那么如何解决呢？当然是`read the fuking source code`。

我们看frida-java的`use`方法的实现，代码在[https://github.com/frida/frida-java/blob/9becc27091576fc198dc2a719c0fedb30a270b28/lib/class-factory.js#L139](https://github.com/frida/frida-java/blob/9becc27091576fc198dc2a719c0fedb30a270b28/lib/class-factory.js#L139)代码如下：

```javascript
this.use = function (className) {
    let C = classes[className];
    if (!C) {
      const env = vm.getEnv();
      if (loader !== null) {
        const usedLoader = loader;

        if (cachedLoaderMethod === null) {
          cachedLoaderInvoke = env.vaMethod('pointer', ['pointer']);
          cachedLoaderMethod = loader.loadClass.overload('java.lang.String').handle;
        }

        const getClassHandle = function (env) {
          const classNameValue = env.newStringUtf(className);
          const tid = Process.getCurrentThreadId();
          ignore(tid);
          try {
            return cachedLoaderInvoke(env.handle, usedLoader.$handle, cachedLoaderMethod, classNameValue);
          } finally {
            unignore(tid);
            env.deleteLocalRef(classNameValue);
          }
        };

        C = ensureClass(getClassHandle, className);
      } else {
        const canonicalClassName = className.replace(/\./g, '/');

        const getClassHandle = function (env) {
          const tid = Process.getCurrentThreadId();
          ignore(tid);
          try {
            return env.findClass(canonicalClassName);
          } finally {
            unignore(tid);
          }
        };

        C = ensureClass(getClassHandle, className);
      }
    }

    return new C(null);
  };
```

从代码中我们可以看出来，他会先到他存class的一个列表里面去找，如果找不到，就会判断loader是不是null，loader不为null，就会使用loader加载class，loader为null就会使用`JNIEnv`的findClass方法去找类，也就是使用默认的classloader。所以现在目标明确了，我们只需要让这个`loader`是我们从`Applicaiton`的attach方法获取到的classloader即可，那么怎么替换呢？

很显然直接`Java.loader`会说undefined，我们看最终导出的是index.js这个脚本[https://github.com/frida/frida-java/blob/022bc7d95c00d627091d4edc0ff87b67de5a9739/index.js#L22](https://github.com/frida/frida-java/blob/022bc7d95c00d627091d4edc0ff87b67de5a9739/index.js#L22)，有下面几个成员变量：

```javascript
  let initialized = false;
  let api = null;
  let apiError = null;
  let vm = null;
  let classFactory = null;
  let pending = [];
  let threadsInPerform = 0;
  let cachedIsAppProcess = null;
```

我们看到了，这个`classFactory`不就是我们刚刚上面看到的那个`loader`所在的地方吗，那么要引用这个loader就很简单了，直接`Java.classFactory.loader`就可以引用了，你可以使用`console.log("classloader: " + Java.classFactory.loader);`来获取这个loader的值，后面我们直接将这个值替换为我们获取的classloader就行了，代码如下：

```javascript
if(Java.available) {
	Java.perform(function(){
		var application = Java.use("android.app.Application");
		var reflectClass = Java.use("java.lang.Class");

		console.log("application: " + application);

		application.attach.overload('android.content.Context').implementation = function(context) {
			var result = this.attach(context); // 先执行原来的attach方法
			var classloader = context.getClassLoader(); // 获取classloader
			Java.classFactory.loader = classloader;
			var AyWelcome = Java.classFactory.use("flytv.run.monitor.fragment.user.AyWelcome"); //这里能直接使用Java.use，因为java.use会检查在不在perform里面，不在就会失败
			console.log("AyWelcome: " + AyWelcome);
			
			return result;
		}

	});
}
```

#### 写hook加固的类的代码，弹出toast

```javascript
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

```

最后效果如下：

![a.png](./a.png)