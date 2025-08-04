<template>
  <el-table :data="list" style="width: 100%">
    <el-table-column
      :label="$t('dashboard.ranking')"
      width="100"
      align="center"
      type="index"
    />
    <el-table-column
      :label="$t('dashboard.username')"
      width="200"
      align="center"
    >
      <template slot-scope="scope">
        {{ scope.row.username }}
      </template>
    </el-table-column>
    <el-table-column
      :label="$t('dashboard.trafficUsed')"
      min-width="200"
      align="center"
    >
      <template slot-scope="scope">
        {{ getFlow(scope.row.trafficUsed) }}</template
      >
    </el-table-column>
  </el-table>
</template>

<script>
import { trafficRank } from '@/api/dashboard'
import { getFlow } from '@/utils/account'
import { mapGetters } from 'vuex'

export default {
  name: 'trafficTable',
  data() {
    return {
      list: null
    }
  },
  computed: {
    ...mapGetters(['roles'])
  },
  created() {
    this.fetchData()
  },
  methods: {
    getFlow,
    fetchData() {
      // 调试信息：记录当前用户角色
      console.log('🔍 [DEBUG] 当前用户角色:', this.roles)
      
      // 如果是管理员或超级管理员，包含所有用户；否则只显示普通用户
      const includeAllRoles = this.roles.includes('sysadmin') || this.roles.includes('admin')
      
      // 调试信息：记录API调用参数
      console.log('🔍 [DEBUG] API调用参数 includeAllRoles:', includeAllRoles)
      
      trafficRank({ includeAllRoles }).then((response) => {
        // 调试信息：记录API返回的数据
        console.log('🔍 [DEBUG] API返回数据:', response.data)
        this.list = response.data
      }).catch((error) => {
        console.error('🔍 [DEBUG] API调用失败:', error)
      })
    }
  }
}
</script>
