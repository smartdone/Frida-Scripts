## frida-Android脱壳
- [x] Android 7.1.2测试通过
- [x] 腾讯加固
- [x] 360加固
- [x] 爱加密 

## 使用

1. `pip install frida`
2. `pip install frida-tools`
3. 安装加固过的apk到手机
4. `adb forward tcp:27042 tcp:27042`
5. `frida -R -f {app包名} -l unpack.js` （用app包名替换`{app包名}`）
6. 在`/data/data/{app包名}/files/{数字}.dex`（从内存中dump的dex会放到files目录下面的十六进制数字命名的dex文件中，emm.dex不是哈）


#### dex b64

```java
package com.smartdone;

import android.util.Log;
import dalvik.system.DexFile;
import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Iterator;

public class EnumerateClass {
    private static final String TAG = "FRiDA_UNPACK";

    public static ArrayList getClassNameList(ClassLoader classLoader) {
        int i;
        ArrayList classNameList = new ArrayList();
        try {
            Object dexElements = EnumerateClass.getObjectField(EnumerateClass.getObjectField(classLoader, "pathList"), "dexElements");
            int dexElementsLength = Array.getLength(dexElements);
            i = 0;
            while(true) {
            label_8:
                if(i >= dexElementsLength) {
                    goto label_24;
                }

                Enumeration enumerations = ((DexFile)EnumerateClass.getObjectField(Array.get(dexElements, i), "dexFile")).entries();
                while(true) {
                    if(!enumerations.hasMoreElements()) {
                        ++i;
                        break;
                    }

                    classNameList.add(((String)enumerations.nextElement()));
                }
            }
        }
        catch(Exception v1) {
            goto label_24;
        }

        ++i;
        goto label_8;
    label_24:
        Collections.sort(classNameList);
        return classNameList;
    }

    public static String[] getClassNameListArray(ClassLoader classLoader) {
        ArrayList namelist = EnumerateClass.getClassNameList(classLoader);
        String[] retval = new String[namelist.size()];
        namelist.toArray(((Object[])retval));
        return retval;
    }

    public static Object getObjectField(Object object, String fieldName) {
        Class clazz = object.getClass();
        while(!clazz.getName().equals(Object.class.getName())) {
            try {
                Field field = clazz.getDeclaredField(fieldName);
                field.setAccessible(true);
                return field.get(object);
            }
            catch(NoSuchFieldException e) {
                e.printStackTrace();
                clazz = clazz.getSuperclass();
            }
            catch(IllegalAccessException e2) {
                e2.printStackTrace();
            }
        }

        return null;
    }

    public static void loadAllClass(ClassLoader classLoader) {
        int v6_1;
        Method[] methods;
        Class clazz;
        try {
            Iterator v1 = EnumerateClass.getClassNameList(classLoader).iterator();
            while(true) {
                if(!v1.hasNext()) {
                    return;
                }

                Object v2 = v1.next();
                clazz = classLoader.loadClass(((String)v2));
                methods = clazz.getDeclaredMethods();
                Log.d("FRiDA_UNPACK", "load class: " + clazz.getName());
                v6_1 = 0;
            label_19:
                while(v6_1 < methods.length) {
                    goto label_20;
                }
            }

        label_20:
            Method method = methods[v6_1];
            Object[] objs = new Object[method.getParameterTypes().length];
            Log.d("FRiDA_UNPACK", "try to load method: " + clazz.getName() + "-->" + method.getName());
            method.invoke(null, objs);
            Log.d("FRiDA_UNPACK", "success");
            ++v6_1;
            goto label_19;
        }
        catch(Throwable v0) {
        }
    }
}
```
