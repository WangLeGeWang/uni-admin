const _toString = Object.prototype.toString
const hasOwnProperty = Object.prototype.hasOwnProperty

/**
 * 检查对象是否包含某个属性
 * @param {Object} obj 对象
 * @param {String} key 属性键值
 */
function hasOwn(obj, key) {
	return hasOwnProperty.call(obj, key)
}

/**
 * 参数是否为JavaScript的简单对象
 * @param {Object} obj 
 * @returns {Boolean} true|false
 */
function isPlainObject(obj) {
	return _toString.call(obj) === '[object Object]'
}

/**
 * 是否为函数
 * @param {String} fn 函数名
 */
function isFn(fn) {
	return typeof fn === 'function'
}

/**
 * 深度克隆对象
 * @param {Object} obj
 */
function deepClone(obj) {
	return JSON.parse(JSON.stringify(obj))
}


/**
 * 解析客户端上报的参数
 * @param {String} primitiveParams 原始参数
 * @param {Object} context 附带的上下文
 */
function parseUrlParams(primitiveParams, context) {
	if (!primitiveParams) {
		return primitiveParams
	}
	
	let params = {}
	if(typeof primitiveParams === 'string') {
		params = primitiveParams.split('&').reduce((res, cur) => {
			const arr = cur.split('=')
			return Object.assign({
				[arr[0]]: arr[1]
			}, res)
		}, {})
	} else {
		//转换参数类型--兼容性
		for(let key in primitiveParams) {
			if(typeof primitiveParams[key] === 'number') {
				params[key] = primitiveParams[key] + ''
			} else {
				params[key] = primitiveParams[key]
			}
		}
	}
	
	//原以下数据要从客户端上报，现调整为如果以下参数客户端未上报，则通过请求附带的context参数中获取
	let convertParams = {}
	
	if (context.hasOwnProperty('appId')) {
		convertParams = {
			//appid
			ak: 'appId',
			//当前登录用户编号
			uid: 'uid',
			//设备编号
			did: 'deviceId',
			//系统
			p: 'os',
			//客户端ip
			ip: 'clientIP',
			//客户端的UA
			ua: 'userAgent',
			//当前服务空间编号
			spid: 'spaceId',
			//当前服务空间提供商
			sppd: 'provider',
			//应用版本号
			v: 'appVersion'
		}
	} else if (context.hasOwnProperty('APPID')) {
		convertParams = {
			//appid
			ak: 'APPID',
			//当前登录用户编号
			uid: 'uid',
			//设备编号
			did: 'DEVICEID',
			//系统
			p: 'OS',
			//客户端ip
			ip: 'CLIENTIP',
			//客户端的UA
			ua: 'CLIENTUA',
			//当前服务空间信息 {spaceId:'xxx',provider:'tencent'}
			spi: 'SPACEINFO',
			//云函数调用来源
			fs: 'SOURCE'
		}
	}
	context = context ? context : {}
	for (let key in convertParams) {
		if (!params[key] && context[convertParams[key]]) {
			params[key] = context[convertParams[key]]
		}
	}

	return params
}

/**
 * 解析url
 * @param {String} url
 */
function parseUrl(url) {
	if (typeof url !== "string" || !url) {
		return false
	}
	const urlInfo = url.split('?')
	
	baseurl = urlInfo[0]
	if (baseurl !== '/' && baseurl.indexOf('/') === 0) {
	  baseurl = baseurl.substr(1)
	}
	
	return {
		path: baseurl,
		query: urlInfo[1] ? decodeURI(urlInfo[1]) : ''
	}
}

//加载配置中心-uni-config-center
let createConfig
try {
	createConfig = require('uni-config-center')
} catch (e) {}

/**
 * 获取配置文件信息
 * @param {String} file 配置文件名称
 * @param {String} key 配置参数键值
 */
function getConfig(file, key) {
	if (!file) {
		return false
	}

	const uniConfig = createConfig && createConfig({
		pluginId: 'uni-stat'
	})

	if (!uniConfig || !uniConfig.hasFile(file + '.json')) {
		console.error('Not found the config file')
		return false
	}

	const config = uniConfig.requireFile(file)

	return key ? config[key] : config
}

/**
 * 休眠
 * @param {Object} ms 休眠时间（毫秒）
 */
function sleep(ms) {
	return new Promise(resolve => setTimeout(() => resolve(), ms))
}

module.exports = {
	hasOwn,
	isPlainObject,
	isFn,
	deepClone,
	parseUrlParams,
	parseUrl,
	getConfig,
	sleep
}
