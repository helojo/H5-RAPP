/*
 * 二次封装了H5+的接口，尽可能让开发者专注于业务逻辑而不是功能调用，因为5+API的接口本身也是在完善当中，所以这里作用是尽可能处理官方问题。
 * 作者：陈思远
 * 时间:2017/8/12
 * 
 * 
 * */

(function() {
	//摄像头的全局参数，方便如扫描接口，拍摄接口等需要用到摄像头的接口调用
	var scan, filter, barcode_styles, camera, xhr; //分别是：条码扫描控件对象，条码识别对象的识别类型（包括二维码和各种类型条码），条码扫描控件对象的样式（无效），摄像头对象

	//H5-(rap)P,为了方便简写，使用rap 作为全局变量,本身我也挺喜欢说唱的
	rap = {
		//
		/**
		 * 摄像头初始化
		 */
		init: function() {
			scan = null; //条码识别对象
			filter = [plus.barcode.CODE128, plus.barcode.QR];
			//根据个人需求初始化相关类型，类型过多，控件识别时间会明细增加，识别率降低，建议只初始化自己需要的几种参数
			/*条码识别对象的识别类型,
			常量：
			QR: 条码类型常量，QR二维码，数值为0
			EAN13: 条码类型常量，EAN一维条形码码标准版，数值为1
			EAN8: 条码类型常量，ENA一维条形码简版，数值为2
			AZTEC: 条码类型常量，Aztec二维码，数值为3
			DATAMATRIX: 条码类型常量，Data Matrix二维码，数值为4
			UPCA: 条码类型常量，UPC码标准版，数值为5
			UPCE: 条码类型常量，UPC码缩短版，数值为6
			CODABAR: 条码类型常量，Codabar码，数值为7
			CODE39: 条码类型常量，Code39一维条形码，数值为8
			CODE93: 条码类型常量，Code93码，数值为9
			CODE128: 条码类型常量，Code128码，数值为10
			ITF: 条码类型常量，ITF码，数值为11
			MAXICODE: 条码类型常量，MaxiCode二维码，数值为12
			PDF417: 条码类型常量，PDF 417码，数值为13
			RSS14: 条码类型常量，RSS 14组合码，数值为14
			RSSEXPANDED: 条码类型常量，扩展式RSS组合码，数值为15*/
			barcode_styles = {
				"frameColor": 'blue',
				"scanbarColor": 'blue',
				"background": "blue"
			}; //扫描框的样式

		},
		/**
		 * @param {Object} id 窗口ID
		 */
		getWebview: function(id) {

			return plus.webview.getWebviewById(id);
		},
		openWebview: function(url, id,ani) {
			
			return plus.webview.open(url, id,{},ani);
		},
		/**
		 * 打开窗口，如果窗口已经存在，不再创建直接显示，如果不存在，创建并打开
		 * @param {Object} id
		 */
		open:function(id){
			
			//console.log(JSON.stringify());
			var arr=plus.webview.all();
			var hasWebview=false;
		$.each(arr, function(i) {
			if(arr[i].id==id)
			{
				//如果存在的话，则直接打开
				//console.log('已经存在的窗口');
				hasWebview=true;
				plus.webview.show(id);
				
			}
			
		});
			
		if(!hasWebview)
		{
			
			//plus.webview.open()
			this.openWebview(id,id);
		}
			
		},
		/**
		 * 监听菜单按钮，并打开某个窗口
		 * @param {Object} id 窗口标识ID
		 */
		menubuttonTap:function(id){
			plus.key.addEventListener('menubutton',function(){
				//console.log('按键了');
				rap.open(id);				
			});	
		},
		/**
		 * 获取当前窗口
		 */
		currenWebview: function() {
			return plus.webview.currentWebview();

		},
		/**
		 * @param {Object} key 存储的键
		 * @param {Object} val 对应的值
		 */
		setItem:function(key,val){
			
			plus.storage.setItem(key,val);
			
		},
		/**
		 * @param {Object} key 获取key对应的值
		 */
		getItem:function(key){
			
			return plus.storage.getItem(key);
		},
		removeItem:function(key)
		{
			plus.storage.removeItem(key);
			
		},
		/**
		 * 监听返回键，连续双击则退出程序
		 * @param {Object} pri 存储时间的变量，需要是全局的或持续存在内存当中的
		 * @param {Object} time 两次点击的时间间隔，时间为毫秒
		 */
		backButtonDouble:function(pri,time)
		{
			plus.key.addEventListener("backbutton",function(){
		if(pri == null) {
							mui.toast('再次点击退出程序');
							pri = new Date();
						} else {
							newDate = new Date();
							if(newDate - pri <= time) {
								plus.runtime.quit();
							} else {
								pri = null;
								mui.toast('再次点击退出程序');

							}

						}
	});
			
		},

		/**
		 * 连续扫描二维码、条码
		 * @param {Object} _callback 回调函数function(result) 
		 * @param {Object} consecutive 是否连续扫描 默认false
		 * @param {Object} time 连续扫描间隔 默认1300毫秒
		 */
		plus_barcode: function(_callback, consecutive, time, deviceStyle) {
			consecutive = arguments[1] ? consecutive : false; //是否连续扫描,默认只扫描一次
			time = arguments[2] ? time : 1300; //默认间隔1300毫秒
			deviceStyle = arguments[3] ? deviceStyle : {
				conserve: false,
				vibrate: false,
				sound: "default"
			};
			scan = new plus.barcode.Barcode('bcid', filter, barcode_styles);

			scan.start(deviceStyle);
			scan.onmarked = function(type, result) {
				//console.log(type);
				_callback(result);
				if(consecutive) {

					setTimeout(function() {
						scan.start();
					}, time);

				} else {
					rap.currenWebview().close();

				}

			};
		},

		//拍照并保存到系统相册
		plus_camera_save: function(_callback, _index) {
			//index:1 主摄像头，2前置摄像头
			var _index = arguments[1] ? _index : '1';
			camera = plus.camera.getCamera();
			var res_arr = camera.supportedImageResolutions;
			var res = res_arr[0];
			//plus.nativeUI.alert('拍照像素'+res);
			var fmt = camera.supportedImageFormats[0];

			camera.captureImage(function(path) {

				plus.gallery.save(path); //拍照成功后保存到系统相册

				return _callback(path); //压缩后的图像
			}, {
				filename: '_doc/',
				format: fmt,
				resolution: res,
				index: _index
			});

		},
		//显示图片 ,配合拍照使用
		plus_show_picture: function(_callback, path) {
			plus.io.resolveLocalFileSystemURL(path, function(entry) { //传入_doc这种路径，返回绝对路径

				var img_path = entry.toLocalURL(); //获得图片路径
				return _callback(img_path);
			})

		},

		//文件上传
		plus_upload_files: function(files_array, _callback, upload_path, key, yid) {
			//参数：文件数组，回调函数，files_array：文件路径数组
			var files = [];
			$.each(files_array, function(i) {
				console.log(files_array[i]);
				files.push({
					name: key + i,
					base64: files_array[i]
				});

			});

			//创建任务管理对象
			var task = plus.uploader.createUpload(upload_path, {
					method: 'POST'
				},
				function(t, status) {
					// 上传完成
					if(status == 200) {

						plus.nativeUI.toast('图片上传成功');
						plus.nativeUI.closeWaiting();
						plus.nativeUI.showWaiting('签收中...');
						var cur_user = JSON.parse(localStorage.getItem('user_login')).user;
						//console.log(cur_user);
						rap.jsonp(conf.Fcheck_waybill, 'update_statu', {
							cact: 'update',
							yd_no: vm.yd_no,
							user_account: cur_user,
							npic: files.length + ''

						});

					} else {
						//mui.alert( "上传失败");
						plus.nativeUI.closeWaiting();
						plus.nativeUI.alert('图片上传失败');
					}

				}

			);

			var file_number = task.addData('file_number', files_array.length + ''); //必须是字符串
			var yd_no = task.addData('key', key); //运单号作为后台获取file的key
			//console.log(typeof yid);
			var yid = task.addData('yd_id', yid + ''); //运单号作为后台获取file的yid 该字符需要字符串
			//console.log(yid);
			var Uid = task.addData('Uid', this.getUid()); //随机数，为了让添加的数据不重复，否则会添加数据失败
			var cur_user = JSON.parse(localStorage.getItem('user_login')).user;
			var creatname = task.addData('creatname', cur_user);
			console.log('addDATA参数：' + file_number + '&&' + Uid + '&&' + yd_no + '&&' + yid);

			if(file_number && Uid && yd_no && yid) {

				for(var i = 0; i < files_array.length; i++) { //添加上传文件,key是后台获取数据的关键词,这里统一为：uploadkey0   uploadkey1.....通过上面的addData filenumber区分
					/*task_areally = task.addFile(files[i].path, {
						key: files[i].name
					});*/ //原本是上传图片，但是无法压缩，现在改为上传base64数据
					//console.log('添加数据前' + files[i].base64);
					//console.log('添加数据前的KEY' + key + i);
					task.addData(key + i, files[i].base64);

				}
				//if(task_areally) { //如果添加成功，开始上传
				plus.nativeUI.showWaiting('图片上传中...');
				task.start();
				return _callback();
				//}

			} else {
				plus.nativeUI.alert('上传失败');

			}

		},
		plus_upload_exception_files: function(files_array, _callback, upload_path, key, yid) {
			//参数：文件数组，回调函数，files_array：文件路径数组
			var files = [];
			$.each(files_array, function(i) {
				console.log(files_array[i]);
				files.push({
					name: key + i,
					base64: files_array[i]
				});

			});

			//创建任务管理对象
			var task = plus.uploader.createUpload(upload_path, {
					method: 'POST'
				},
				function(t, status) {
					// 上传完成
					if(status == 200) {

						plus.nativeUI.toast('图片上传成功');
						plus.nativeUI.closeWaiting();
						plus.nativeUI.showWaiting('登记中...');
						var cur_user = JSON.parse(localStorage.getItem('user_login')).user;
						//console.log(cur_user);
						rap.jsonp(conf.Fexception_register, 'insert_exception', {
							cact: 'insert',
							yid: vm.yid,
							dp_qty: vm.exception_qty,
							ab_remark: vm.exception_desc,
							npic: files.length + ''
						});
						//异常登记接口

					} else {
						//mui.alert( "上传失败");
						plus.nativeUI.closeWaiting();
						plus.nativeUI.alert('图片上传失败');
					}

				}

			);

			var file_number = task.addData('file_number', files_array.length + ''); //必须是字符串
			var yd_no = task.addData('key', key); //运单号作为后台获取file的key
			//console.log(typeof yid);
			var yid = task.addData('yd_id', yid + ''); //运单号作为后台获取file的yid 该字符需要字符串
			//console.log(yid);
			var Uid = task.addData('Uid', this.getUid()); //随机数，为了让添加的数据不重复，否则会添加数据失败
			var cur_user = JSON.parse(localStorage.getItem('user_login')).user;
			var creatname = task.addData('creatname', cur_user);
			console.log('addDATA参数：' + file_number + '&&' + Uid + '&&' + yd_no + '&&' + yid);

			if(file_number && Uid && yd_no && yid) {

				for(var i = 0; i < files_array.length; i++) { //添加上传文件,key是后台获取数据的关键词,这里统一为：uploadkey0   uploadkey1.....通过上面的addData filenumber区分
					/*task_areally = task.addFile(files[i].path, {
						key: files[i].name
					});*/ //原本是上传图片，但是无法压缩，现在改为上传base64数据
					//console.log('添加数据前' + files[i].base64);
					//console.log('添加数据前的KEY' + key + i);
					task.addData(key + i, files[i].base64);

				}
				//if(task_areally) { //如果添加成功，开始上传
				plus.nativeUI.showWaiting('图片上传中...');
				task.start();
				return _callback();
				//}

			} else {
				plus.nativeUI.alert('上传失败');

			}

		},

		getUid: function() { //获取随机数
			return Math.floor(Math.random() * 100000000 + 10000000).toString();
		},

		/**
		 * 监听函数
		 * @param {Object} eventType 自定义事件类型
		 * @param {Function} callback webviewid和JSON数据
		 */
		receive: function(eventType, callback) {
			eval(eventType + '=' + callback + ';');

		},

		/**
		 * 向目标窗口传递数据
		 * @param {Object} sendWebview 发送窗口
		 * @param {Object} receiveWebview 接收窗口
		 * @param {Object} eventType 自定义事件类型
		 * @param {Object} data 发送的JSON数据
		 */
		fire: function(sendWebview, receiveWebview, eventType, data) {
			var data = JSON.stringify(data || {});
			receiveWebview.evalJS(eventType + '("' + sendWebview.id + '",' + data + ')');
		},
		/**
		 * @param {Object} url 请求路径
		 * @param {Object} callbackFunc 回调函数名
		 * @param {Object} data JSON数据
		 * @param {Object} type 
		 */
		jsonp: function(url, callbackFunc, data) //跨域请求
		{

			var data = arguments[2] ? arguments[2] : ''; //默认参数为空
			//var type = arguments[3] ? arguments[3] : 'get'; //默认类型为GET

			if(url != '' && callbackFunc != '') {
				$.ajax({
					type: 'get',
					dataType: 'jsonp',
					url: url,
					jsonp: "callback",
					jsonpCallback: callbackFunc,
					data: data,
					async: true,
					success: function(data) {
						console.log('跨域请求成功');
						//mui.alert('跨域请求成功');

					},
					error: function() {

						console.log('跨域请求失败');

					}
				});

			} else
				alert('URL，回调函数不能为空');

		},
		update_ksd: function(url, app_name) {
			console.log(url);
			var dtask = plus.downloader.createDownload(url, {}, function(d, status) {
				// 下载完成
				if(status == 200) {
					plus.nativeUI.toast("下载成功，准备安装" + d.filename);
					//安装程序,因为无法主动删除安装包，所以先判断程序是否存在
					//var install_name='_downloads/ksd.apk';//如果程序存在，下载后的安装名后面会加上(i)的字样,默认为这个

					plus.runtime.install('_downloads/' + app_name + '.apk', {}, function() {
						plus.nativeUI.toast('安装成功');
					}, function() {
						plus.nativeUI.toast('安装失败');
					});

					plus.nativeUI.closeWaiting();
				} else {
					alert("下载失败 " + status);

				}
			});
			//dtask.addEventListener( "statechanged", onStateChanged, false );
			dtask.start();
		},
		/**
		 * @param {Object} type 请求类型，只支持 GET和POST,默认GET方法
		 * @param {Object} url  请求地址 
		 * @param {Object} data  请求数据，格式为 "A=XX&B=xx"
		 * @param {Object} callback 回调函数,参数res ，请求返回的JSON数据
		 */
		request: function(url, data, callback, type) {
			xhr = new plus.net.XMLHttpRequest();
			type = arguments[3] ? arguments[3] : 'GET';
			data = arguments[1] ? arguments[1] : '';
			xhr.onreadystatechange = function() {
				switch(xhr.readyState) {
					case 4:
						if(xhr.status == 200) {
							callback(JSON.parse(xhr.responseText));

						} else {
							alert("xhr请求失败：" + xhr.readyState);
						}
						break;

				}
			}
			switch(type.toUpperCase()) {
				case 'GET':
					xhr.open(type, url + '?' + data);
					xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
					xhr.send();
					break;

				case 'POST':
					xhr.open(type, url);
					xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
					xhr.send(data);
					break;
			}

		}

		// window.rap结束		
	}

})()
