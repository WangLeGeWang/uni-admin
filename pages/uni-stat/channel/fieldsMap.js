export default [{
	title: '渠道值',
	field: 'channel_code',
	tooltip: '',
	formatter: '',
}, {
	title: '渠道名称',
	field: 'channel_name',
	tooltip: '',
	formatter: '',
}, {
	title: '新增设备',
	field: 'new_device_count',
	tooltip: '首次访问应用的设备数（以设备为判断标准，去重）',
	value: 0
}, {
	title: '活跃设备',
	field: 'active_device_count',
	tooltip: '访问过应用内任意页面的总设备数（去重）',
	value: 0
}, {
	title: '访问次数',
	field: 'page_visit_count',
	tooltip: '访问过应用内任意页面总次数，多个页面之间跳转、同一页面的重复访问计为多次访问',
	value: 0
}, {
	title: '启动次数',
	field: 'app_launch_count',
	tooltip: '设备从打开应用到主动关闭应用或超时退出计为一次启动',
	value: 0
}, {
	title: '次均停留时长',
	field: 'avg_device_session_time',
	formatter: ':',
	tooltip: '平均每次打开应用停留在应用内的总时长，即应用停留总时长/启动次数',
	value: 0
}, {
	title: '设备平均停留时长 ',
	field: 'avg_device_time',
	formatter: ':',
	tooltip: '平均每个设备停留在应用内的总时长，即应用停留总时长/活跃设备',
	value: 0
}, {
	title: '跳出率',
	field: 'bounceRate',
	computed: 'bounce_times/app_launch_count',
	formatter: '%',
	tooltip: '只浏览一个页面便离开应用的次数占总启动次数的百分比',
	value: 0,
	contrast: 0,
	fix: 2
}, {
	title: '总设备数',
	field: 'total_devices',
	tooltip: '从添加统计到当前选择时间的总设备数（去重）',
	value: 0,
}]
