<template>
	<scroll-view class="sidebar" scroll-y="true">
		<uni-data-menu ref="menu" :value="currentMenu" :staticMenu="staticMenu" collection="opendb-admin-menus" :page-size="500"
			:field="field" orderby="sort asc" active-text-color="#409eff" @select="select">
		</uni-data-menu>
	</scroll-view>
</template>

<script>
	import {
		mapState,
		mapActions
	} from 'vuex'
	import config from '@/admin.config.js'
	export default {
		data() {
			return {
				...config.sideBar,
				field: 'url as value, name as text, menu_id, parent_id, sort, icon, permission',
				currentMenu: '/'
			}
		},
		computed: {
			...mapState('app', ['inited', 'navMenu', 'active']),
			...mapState('user', ['userInfo']),
		},
		// #ifdef H5
		watch: {
			$route: {
				immediate: true,
				handler(newRoute, oldRoute) {
					const path = newRoute.fullPath
					if (path) {
						this.currentMenu = this.splitFullPath(path)
					}
				}
			},
			userInfo: {
				immediate: true,
				handler(newVal, oldVal) {
					if (newVal) {
						this.$nextTick(function(){
							this.$refs.menu.load()
						})
					}
				}
			}
		},
		// #endif
		methods: {
			...mapActions({
				setRoutes: 'app/setRoutes'
			}),
			select(e, routes) {
				let url = e.value
				if (!url) {
					url = this.active
				}
				this.clickMenuItem(url)
				this.setRoutes(routes)
			},
			clickMenuItem(url) {
				// #ifdef H5
				if (url.indexOf('http') === 0) {
					return window.open(url)
				}
				// #endif

				// url 开头可用有 / ，也可没有
				if (url[0] !== '/' && url.indexOf('http') !== 0) {
					url = '/' + url
				}
				// TODO 后续要调整
				uni.redirectTo({
					url: url,
					fail: () => {
						uni.showModal({
							title: '提示',
							content: '页面 ' + url + ' 跳转失败',
							showCancel: false
						})
					}
				})
			},
			splitFullPath(path) {
				if (!path) {
					path = '/'
				}
				return path.split('?')[0]
			},
		}
	}
</script>

<style lang="scss">
	.sidebar {
		position: fixed;
		// top: var(--top-window-height); // useless
		width: 240px;
		height: calc(100vh - (var(--top-window-height)));
		box-sizing: border-box;
		border-right: 1px solid darken($left-window-bg-color, 8%);
		background-color: $left-window-bg-color;
		padding-bottom: 10px;
	}

	.sidebar ::-webkit-scrollbar {
		display: none;
		// scrollbar-width: thin;
	}

	.title {
		margin-left: 5px;
	}
</style>
