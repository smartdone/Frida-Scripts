/*
* @Author: ssd
* @Date:   2019-01-20 13:53:19
* @Last Modified by:   smartdone
* @Last Modified time: 2019-01-20 16:14:15
*/

// do_dlopen = Module.findExportByName('linker64', '__dl__Z9do_dlopenPKciPK17android_dlextinfoPKv');
// console.log('do_dlopen: ' + do_dlopen);
// console.log('Module.findBaseAddress' + Module.findBaseAddress('linker64'))
// __dl__ZL10call_arrayIPFviPPcS1_EEvPKcPT_mbS5_

var syms = Module.enumerateSymbolsSync('linker64');
var do_dlopen;
var call_array;
for (var i = syms.length - 1; i >= 0; i--) {
    if(syms[i].name == '__dl__Z9do_dlopenPKciPK17android_dlextinfoPKv'){
        do_dlopen = syms[i];
        // console.log(syms[i].name);
        // console.log(syms[i].address);
    } else if(syms[i].name == '__dl__ZL10call_arrayIPFviPPcS1_EEvPKcPT_mbS5_') {
        call_array = syms[i];
        // console.log(syms[i].name);
        // console.log(syms[i].address);
    }
}

var call_array_callback;

Interceptor.attach(do_dlopen.address, {
    onEnter: function (args){
        var name = Memory.readUtf8String(args[0]);
        console.log("load so: " + name);
        if(String(name).indexOf('libnative-lib.so') != -1) {
            call_array_callback = Interceptor.attach(call_array.address, {
                onEnter: function (args){
                    console.log("call array: " + Memory.readUtf8String(args[0]));
                    // console.log(args[1]);
                    count = args[2];
                    console.log('count: ' + args[2]);
                    for (var i = 0; i < count; i++) {
                        func_addr = args[1].add(i * 8);
                        console.log(i + " func: 0x" + Memory.readU64(func_addr).toString(16));
                        // Memory.protect(ptr(func_addr), 4096, 'rwx');
                        Interceptor.attach(ptr(func_addr), {
                            onEnter: function (args){
                                console.log('function called ' + i);
                            },
                            onLeave: function (retval){}
                        });
                    }
                },
                onLeave: function (retval){

                }
            });
        }
        
    },
    onLeave: function (retval){
        if(call_array_callback) {
            call_array_callback.detach();
            console.log('detach Interceptor');
        }
        console.log("libnative-lib " +  Module.findBaseAddress('libnative-lib.so'));
    }
});
