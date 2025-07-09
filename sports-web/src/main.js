import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import Logger from '@/plugins/logger';
import App from './App.vue';
import router from './router';
import store from './store';
import { permissionDirective, roleDirective } from '@/utils/permission';

// 引入ECharts
import echarts from 'echarts';
Vue.prototype.$echarts = echarts;

// 引入HTTP客户端
import { demo as httpClient } from '@/api/adapter';
Vue.prototype.$http = httpClient;

// 引入API方法
import * as api from '@/api/demo';
Vue.prototype.$api = api;

Vue.use(ElementUI);
Vue.use(Logger, { debug: false });

// 注册权限指令
Vue.directive('permission', permissionDirective);
Vue.directive('role', roleDirective);

Vue.config.productionTip = false;

Vue.$log.info('vue-eslint launch...');
new Vue({
  router,
  store,
  render(h) { return h(App); },
  async mounted() {
    this.$log.info('vue-eslint ready...');
    setInterval(() => {
      this.$store.commit('SYNC_CURRENT_TIME');
    }, 1000);
  }
}).$mount('#app');
