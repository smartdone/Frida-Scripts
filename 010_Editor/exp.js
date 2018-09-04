var editor = Process.findModuleByName("010 Editor");
if(editor != undefined) {
	var modulebase = editor.base;
	var offset = 0xD8180;
	var sub_1000D8180 = modulebase.add(offset);
	var buf = Memory.readByteArray(sub_1000D8180, 64);
	console.log(hexdump(buf, {
	  offset: 0,
	  length: 64,
	  header: true,
	  ansi: true
	}));
	Interceptor.attach(sub_1000D8180, {
		onEnter: function (args) {
			
		},
		onLeave: function (retval) {
			console.log("retval = " + retval.toInt32());
			retval.replace(219);
		}
	});
}
