<template>
	<view class="fix-top-window">
		<view class="uni-header">
			<uni-stat-breadcrumb class="uni-stat-breadcrumb-on-phone" />
			<view class="uni-group hide-on-phone">
				<!-- <view class="uni-title">错误分析</view> -->
				<view class="uni-sub-title">开发者可以在这里快速查询应用最近出现的具体错误内容，了解错误概况信息，以便快速修复问题</view>
			</view>
		</view>
		<view class="uni-container">
			<view class="uni-stat--x flex">
				<uni-data-select collection="opendb-app-list" field="appid as value, name as text" orderby="text asc"
					:defItem="1" label="应用选择" v-model="query.appid" :clear="false" />
				<uni-data-select collection="uni-stat-app-versions" :where="versionQuery"
					field="_id as value, version as text" orderby="text asc" label="版本选择" v-model="query.version_id" />
				<view class="flex">
					<uni-stat-tabs label="日期选择" :current="currentDateTab" :yesterday="false" mode="date"
						@change="changeTimeRange" />
					<uni-datetime-picker type="daterange" :end="new Date().getTime()" v-model="query.start_time"
						returnType="timestamp" :clearIcon="false" class="uni-stat-datetime-picker"
						:class="{'uni-stat__actived': currentDateTab < 0 && !!query.start_time.length}"
						@change="useDatetimePicker" />
				</view>
			</view>
			<view class="uni-stat--x">
				<uni-stat-tabs label="平台选择" type="boldLine" mode="platform" v-model="query.platform_id"
					@change="changePlatform" />
			</view>
			<view class="uni-stat--x" style="padding: 15px 0;">
				<uni-stat-panel :items="panelData" class="uni-stat-panel" />
				<uni-stat-tabs type="box" v-model="chartTab" :tabs="chartTabs" class="mb-l" />
				<view class="uni-charts-box">
					<qiun-data-charts type="area" :chartData="chartData" :eopts="{notMerge:true}" echartsH5
						echartsApp />
				</view>
			</view>

			<view class="uni-stat--x p-m">
				<uni-table :loading="loading" border stripe :emptyText="$t('common.empty')" style="overflow-y: scroll;">
					<uni-tr>
						<template v-for="(mapper, index) in fieldsMap">
							<uni-th v-if="mapper.title" :key="index" align="center">
								<!-- #ifdef MP -->
								{{mapper.title}}
								<!-- #endif -->
								<!-- #ifndef MP -->
								<uni-tooltip>
									{{mapper.title}}
									<uni-icons v-if="mapper.tooltip" type="help" color="#666" />
									<template v-if="mapper.tooltip" v-slot:content>
										<view class="uni-stat-tooltip-s">
											{{mapper.tooltip}}
										</view>
									</template>
								</uni-tooltip>
								<!-- #endif -->
							</uni-th>
						</template>
					</uni-tr>
					<uni-tr v-for="(item ,i) in tableData" :key="i">
						<template v-for="(mapper, index) in fieldsMap">
							<uni-td v-if="mapper.field === 'msg'" :key="mapper.title" align="left">
								<!-- #ifdef MP -->
								{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
								<!-- #endif -->
								<!-- #ifndef MP -->
								<uni-tooltip>
									{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
									<uni-icons v-if="item.msgTooltip" type="help" color="#666" />
									<template v-if="item.msgTooltip" v-slot:content>
										<view class="uni-stat-tooltip-l">
											{{item.msgTooltip}}
										</view>
									</template>
								</uni-tooltip>
								<!-- #endif -->
							</uni-td>
							<uni-td v-else-if="mapper.field === 'count'" :key="mapper.title" align="center">
								<text class="link-btn" @click="navTo('detail', item.hash)">
									{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
								</text>
							</uni-td>
							<uni-td v-else :key="mapper.title" align="center">
								{{item[mapper.field] !== undefined ? item[mapper.field] : '-'}}
							</uni-td>
						</template>
					</uni-tr>
				</uni-table>
				<view class="uni-pagination-box">
					<picker class="select-picker" mode="selector" :value="options.pageSizeIndex"
						:range="options.pageSizeRange" @change="changePageSize">
						<button type="default" size="mini" :plain="true">
							<text>{{pageSize}} 条/页</text>
							<uni-icons class="select-picker-icon" type="arrowdown" size="12" color="#999"></uni-icons>
						</button>
					</picker>
					<uni-pagination show-icon :page-size="pageSize" :current="options.pageCurrent"
						:total="options.total" @change="changePageCurrent" />
				</view>
			</view>
		</view>

		<uni-popup ref="popupTable" type="center" :maskClick="true">
			<view class="modal">
				<view class="modal-header">
					错误设备信息
				</view>
				<scroll-view scroll-y="true">
					<view class="modal-content">
						<view class="uni-form-item-tips">
							注：仅展示最近10条
						</view>
						<uni-stat-table :data="popupTableData" :filedsMap="popupFieldsMap" :loading="popupLoading" />
					</view>
				</scroll-view>
			</view>
		</uni-popup>

		<!-- #ifndef H5 -->
		<fix-window />
		<!-- #endif -->
	</view>
</template>

<script>
	import {
		mapfields,
		stringifyQuery,
		getTimeOfSomeDayAgo,
		division,
		format,
		formatDate,
		parseDateTime,
		debounce
	} from '@/js_sdk/uni-stat/util.js'
	import {
		fieldsMap,
		popupFieldsMap
	} from './fieldsMap.js'

	const panelOption = [{
		title: '错误总数',
		value: 0,
		tooltip: '指应用在某个时间段内出现错误的总数'
	}, {
		title: '错误率',
		value: 0,
		tooltip: '时间范围内的总错误数/应用启动次数，如果小于0.01%，默认显示为0'
	}]

	export default {
		data() {
			return {
				fieldsMap,
				popupFieldsMap,
				query: {
					type: "js",
					dimension: "day",
					appid: "",
					platform_id: '',
					version_id: '',
					start_time: [],
				},
				options: {
					pageCurrent: 1, // 当前页
					total: 0, // 数据总量
					pageSizeIndex: 0, // 与 pageSizeRange 一起计算得出 pageSize
					pageSizeRange: [10, 20, 50, 100],
				},
				loading: false,
				popupLoading: false,
				currentDateTab: 0,
				// currentChartTab: ,
				tableData: [],
				popupTableData: [],
				panelData: JSON.parse(JSON.stringify(panelOption)),
				chartData: {},
				chartTab: 'errorCount',
				chartTabs: [{
					_id: 'errorCount',
					name: '错误次数'
				}, {
					_id: 'errorRate',
					name: '错误率'
				}],
			}
		},
		computed: {
			pageSize() {
				const {
					pageSizeRange,
					pageSizeIndex
				} = this.options
				return pageSizeRange[pageSizeIndex]
			},
			queryStr() {
        console.log('...........stringifyQuery(this.query)', stringifyQuery(this.query));
				return stringifyQuery(this.query)
			},
			versionQuery() {
				const {
					appid,
					platform_id
				} = this.query
				const query = stringifyQuery({
					appid,
					platform_id
				})
				return query
			}
		},
		created() {
			this.debounceGet = debounce(() => this.getAllData(this.queryStr))
		},
		watch: {
			query: {
				deep: true,
				handler(val) {
					this.options.pageCurrent = 1 // 重置分页
					this.debounceGet()
				}
			},
			chartTab(val) {
				this.getChartData(this.queryStr)
			}
		},
		methods: {
			useDatetimePicker() {
				this.currentDateTab = -1
			},
			changePlatform() {
				this.query.version_id = 0
			},
			changeTimeRange(id, index) {
				this.currentDateTab = index
				const start = getTimeOfSomeDayAgo(id),
					end = getTimeOfSomeDayAgo(0) - 1
				this.query.start_time = [start, end]
			},
			changePageCurrent(e) {
				this.options.pageCurrent = e.current
				this.getTableData(this.queryStr)
			},

			changePageSize(e) {
				const {
					value
				} = e.detail
				this.options.pageCurrent = 1 // 重置分页
				this.options.pageSizeIndex = value
				this.getTableData(this.queryStr)
			},

			getAllData(query) {
				this.getChartData(query)
				this.getTableData(query)
			},

			getChartData(query, field = 'day_count') {
				this.chartData = {}
				const {
					pageCurrent
				} = this.options
				const db = uniCloud.database()
				db.collection('uni-stat-error-result')
					.where(query)
					.groupBy('start_time')
					.groupField('sum(count) as total_day_count')
					.orderBy('start_time', 'asc')
					.get({
						getCount: true
					})
					.then(res => {
						const {
							count,
							data
						} = res.result
						const options = {
							categories: [],
							series: [{
								name: '暂无数据',
								data: []
							}]
						}
						if (this.chartTab === 'errorCount') {
							const countLine = options.series[0] = {
								name: '错误次数',
								data: []
							}
							const xAxis = options.categories
							for (const item of data) {
								let date = item.start_time
								const x = formatDate(date, 'day')
								const countY = item[`total_${field}`]
								xAxis.push(x)
								countLine.data.push(countY)
							}
							this.chartData = options
						} else {
							let dayAppLaunchs = []
							this.getDayLaunch(query).then(res => {
								dayAppLaunchs = res.result.data
							}).finally(() => {
								const rateLine = options.series[0] = {
									name: '错误率',
									data: [],
									lineStyle: {
										color: '#EE6666',
										width: 1,
									},
									itemStyle: {
										borderWidth: 1,
										borderColor: '#EE6666',
										color: '#EE6666'
									},
									areaStyle: {
										color: {
											colorStops: [{
												offset: 0,
												color: '#EE6666', // 0% 处的颜色
											}, {
												offset: 1,
												color: '#FFFFFF' // 100% 处的颜色
											}]
										}
									}
								}
								const xAxis = options.categories
								for (const item of data) {
									let date = item.start_time
									const x = formatDate(date, 'day')
									const countY = item[`total_${field}`]
									xAxis.push(x)
									if (dayAppLaunchs.length) {
										dayAppLaunchs.forEach(day => {
											if (day.start_time === item.start_time) {
												let rateY = countY / day.day_app_launch_count
												rateY = rateY.toFixed(2)
												const index = xAxis.indexOf(x)
												rateLine.data[index] = rateY
											}
										})
									}
								}
								this.chartData = options
							})
						}

					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {})
			},

			getTotalCount(query) {
				const db = uniCloud.database()
				return db.collection('uni-stat-error-result')
					.where(query)
					.groupBy('appid')
					.groupField('sum(count) as total_count')
					.get()
			},

			getTotalLaunch(query) {
				const db = uniCloud.database()
				return db.collection('uni-stat-result')
					.where(query)
					.groupBy('appid')
					.groupField('sum(app_launch_count) as total_app_launch_count')
					.get()
			},

			getDayLaunch(query) {
				const db = uniCloud.database()
				return db.collection('uni-stat-result')
					.where(query)
					.groupBy('start_time')
					.groupField('sum(app_launch_count) as day_app_launch_count')
					.orderBy('start_time', 'asc')
					.get()
			},

			getTableData(query = stringifyQuery(this.query)) {
				const {
					pageCurrent
				} = this.options
				this.loading = true
				const db = uniCloud.database()
				const filterAppid = stringifyQuery({
					appid: this.query.appid
				})
				const mainTableTemp = db.collection('uni-stat-error-result').where(query).getTemp()
				const versions = db.collection('uni-stat-app-versions')
					.where(filterAppid)
					.orderBy('start_time ', 'desc ')
					.getTemp()

				const platforms = db.collection('uni-stat-app-platforms')
					.getTemp()

				db.collection(mainTableTemp, versions, platforms)
					.orderBy('count', 'desc')
					.skip((pageCurrent - 1) * this.pageSize)
					.limit(this.pageSize)
					.get({
						getCount: true
					})
					.then(res => {
						const {
							count,
							data
						} = res.result
						const tempData = []
						this.panelData = JSON.parse(JSON.stringify(panelOption))
						for (const item of data) {
							item.last_time = parseDateTime(item.last_time, 'dateTime')
							item.msgTooltip = item.msg
							item.msg = item.msg.substring(0, 100) + '...'
							const v = item.version_id[0]
							const p = item.platform_id[0]
							item.version = v && v.version
							item.platform = p && p.name
							tempData.push(item)
						}
						this.getTotalCount(query).then(res => {
							const total = res.result.data[0]
							const total_count = total && total.total_count
							if (total_count) {
								tempData.forEach(item => item.total_count = Number(total_count))
								this.panelData[0].value = total_count
							}
							let launch_count = ''
							this.getTotalLaunch(query).then(res => {
								const total = res.result.data[0]
								launch_count = total && total.total_app_launch_count
								if (total_count && launch_count) {
									let errorRate = total_count / launch_count
									errorRate = (errorRate * 100).toFixed(2) + '%'
									this.panelData[1].value = errorRate
								}
							})

						}).finally(() => {
							this.tableData = []
							this.options.total = count
							tempData.forEach(item => mapfields(fieldsMap, item, item))
							this.tableData = tempData
						})

					}).catch((err) => {
						console.error(err)
						// err.message 错误信息
						// err.code 错误码
					}).finally(() => {
						this.loading = false
					})
			},

			getPopupTableData(hash) {
				this.popupTableData = []
				this.popupLoading = true
				const db = uniCloud.database()
				db.collection('uni-stat-error-logs')
					.where(`error_hash == "${hash}"`)
					.orderBy('create_time', 'desc')
					.limit(10)
					.get()
					.then(res => {
						const data = res.result.data
						for (const item of data) {
							item.create_time = parseDateTime(item.create_time, 'dateTime')
						}
						this.popupTableData = data
					})
					.finally(() => {
						this.popupLoading = false
					})
			},

			navTo(url, id) {
				if (url.indexOf('http') > -1) {
					window.open(url)
				} else {
					if (id) {
						url = `${url}?hash=${id}`
					}
					uni.navigateTo({
						url
					})
				}
			},
			createStr(maps, fn, prefix = 'total_') {
				const strArr = []
				maps.forEach(mapper => {
					if (field.hasOwnProperty('value')) {
						const fieldName = mapper.field
						strArr.push(`${fn}(${fieldName}) as ${prefix + fieldName}`)
					}
				})
				return strArr.join()
			}
		}

	}
</script>

<style>
	.uni-stat-panel {
		box-shadow: unset;
		border-bottom: 1px solid #eee;
		padding: 0;
		margin: 0 15px;
	}

	.uni-stat-tooltip-s {
		width: 160px;
		white-space: normal;
	}
</style>
