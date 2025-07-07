import Vue from 'vue';
import Vuex from 'vuex';
import * as mutations from './mutations';
import * as actions from './actions';
import auth from './modules/auth';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    currentTime: Date.now(),
    adminType: '0',
    userName: ''
  },
  mutations,
  actions,
  modules: {
    auth
  },
  strict: process.env.NODE_ENV !== 'production'
});
