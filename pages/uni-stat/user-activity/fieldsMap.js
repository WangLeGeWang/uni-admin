export default [{
	title: '日期',
	field: 'stat_date',
	tooltip: '',
	formatter: '',
}, {
	title: '日活',
	field: 'active_user_count',
	tooltip: '',
}, {
	title: '周活',
	field: 'week_active_user_count',
	tooltip: '',
}, {
	title: '日活/周活',
	field: 'active_user_count/week_active_user_count',
	computed: 'active_user_count/week_active_user_count',
	tooltip: '日活/周活',
	formatter: '%',
}, {
	title: '月活',
	field: 'month_active_user_count',
	tooltip: '',
}, {
	title: '日活/月活',
	field: 'active_user_count/month_active_user_count',
	computed: 'active_user_count/month_active_user_count',
	tooltip: '',
	formatter: '%',
}]
