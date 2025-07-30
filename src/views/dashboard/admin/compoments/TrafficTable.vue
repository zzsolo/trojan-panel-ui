<template>
  <div v-loading="loading" element-loading-text="加载流量排行榜...">
    <el-table
      :data="list"
      style="width: 100%"
      :empty-text="
        loading
          ? '正在加载...'
          : list && list.length > 0
          ? '暂无数据'
          : '获取流量数据失败'
      "
    >
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
          <span>
            {{ scope.row.username }}
            <el-tag
              v-if="isUserAdmin(scope.row)"
              size="mini"
              type="warning"
              style="margin-left: 5px"
            >
              管理员
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('dashboard.trafficUsed')"
        min-width="200"
        align="center"
      >
        <template slot-scope="scope">
          {{ getFlow(scope.row.trafficUsed) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加刷新按钮 -->
    <div style="margin-top: 10px; text-align: right">
      <el-button
        size="mini"
        type="primary"
        icon="el-icon-refresh"
        :loading="loading"
        @click="fetchData"
      >
        刷新排行榜
      </el-button>
    </div>
  </div>
</template>

<script>
import { trafficRank } from '@/api/dashboard'
import { getFlow } from '@/utils/account'
import { mapGetters } from 'vuex'

export default {
  name: 'trafficTable',
  data() {
    return {
      list: [],
      loading: false
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

    // 判断用户是否为管理员
    isUserAdmin(user) {
      return (
        user.role === 'admin' ||
        user.role_id === 2 ||
        user.roles?.includes('admin') ||
        user.roles?.includes('sysadmin')
      )
    },

    async fetchData() {
      this.loading = true
      try {
        // 尝试多种方式获取包含管理员的流量排行榜
        await this.fetchTrafficWithAdmin()
      } catch (error) {
        console.error('获取流量排行榜失败:', error)
        this.list = []
      } finally {
        this.loading = false
      }
    },

    // 使用多种参数尝试获取包含管理员的流量数据
    async fetchTrafficWithAdmin() {
      const attempts = [
        { includeAdmin: true }, // 包含管理员
        { includeAllUsers: true }, // 包含所有用户
        { excludeAdmin: false }, // 不排除管理员
        { forceIncludeAdmin: true }, // 强制包含管理员
        {} // 默认参数
      ]

      for (const params of attempts) {
        try {
          const response = await trafficRank(params)
          const data = response.data || []

          if (data.length > 0) {
            // 检查数据是否包含管理员用户
            const hasAdmin = data.some((user) => this.isUserAdmin(user))

            if (hasAdmin) {
              this.list = data
              console.log('成功获取包含管理员的流量排行榜，使用参数:', params)
              return
            } else if (this.list.length === 0) {
              // 如果还没有数据，先保存当前数据
              this.list = data
            }
          }
        } catch (error) {
          console.warn(
            `使用参数 ${JSON.stringify(params)} 获取流量数据失败:`,
            error
          )
          continue
        }
      }

      // 如果所有尝试都失败，但有一些数据，使用已有的数据
      if (this.list.length > 0) {
        console.log('使用基本的流量数据（可能不包含管理员）')
      } else {
        console.warn('无法获取任何流量数据')
        this.list = []
      }
    }
  }
}
</script>

<style scoped>
.el-table {
  margin-top: 10px;
}

.el-tag {
  font-weight: bold;
}

/* 管理员标签的特殊样式 */
.el-tag--warning {
  background-color: #e6a23c;
  border-color: #e6a23c;
}

/* 刷新按钮样式 */
.el-button--mini {
  padding: 5px 10px;
  font-size: 12px;
}

/* 加载状态样式 */
.el-loading-mask {
  background-color: rgba(255, 255, 255, 0.8);
}
</style>
