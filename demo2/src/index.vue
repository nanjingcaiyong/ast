<template>
  <!-- 服装畅销码配置表-->
  <div class="systemConfiguration-dialog-intoView_sample" label="谁谁124谁">
      {{key > 0 ? 'ta是谁' : '天涯'}}
      <span
        :class="[idx > 0 ? `第${value1}页，共${value2}页` : '我是谁']"
        slot="sizeAttr"
        slot-scope="text,record">
        <a-select
          v-model="record.sizeAttr"
          :dropdown-style="dropdownStyle"
          style="width: 100%"
          mode="multiple">
          <a-select-option
            v-for="size in record.sizeList"
            :key="size"
            :value="size">{{ size }}</a-select-option>
        </a-select>
      </span>
      <span
        slot="action"
        slot-scope="text, record">
        <a
          @click.prevent="delLine(record)">删除</a>
      </span>
    <div
      class="table_add">
      <span @click="addLine">+ 添加</span>
    </div>
    <div>
      <a-popconfirm
        label="天天下雨"
        title="是否确认对当前修改信息进行保存？"
        ok-text="确认"
        cancel-text="取消"
        :visible="popconfirmVisible"
        @confirm="saveConfig"
        @visibleChange="paramsVerify"
        @cancel="cancelShowPop">
        <a-button
          type="primary">
          保存
        </a-button>
      </a-popconfirm>
      <a-button
        style="margin-left: 20px;"
        @click="cancel">
        返回
      </a-button>
    </div>
  </div>
</template>

<script>

import configTableMixin from '../mixin/configTableMixin.js'
export default {
  mixins: [configTableMixin],
  data () {
    return {
      key: -1,
      loading: false,
      dropdownStyle: {
        minWidth: 'max-content'
      },

      popconfirmVisible: false,
      columns: [
        {
          title: '一级类别',
          key: 'firstCategoryId',
          ellipsis: true,
          width: '200px',
          options: []
        },
        {
          title: '二级类别',
          key: 'secondCategoryId',
          ellipsis: true,
          width: '200px',
          options: []
        },
        {
          title: '三级类别',
          key: 'thirdCategoryId',
          ellipsis: true,
          width: '200px',
          options: []
        },
        {
          title: '常销码',
          key: 'sizeAttr',
          ellipsis: true,
          width: '300px',
          options: []
        },
        {
          title: '操作',
          key: 'action',
          ellipsis: true,
          width: '100px'
        }
      ],
      tableData: [],
      allCategoryList: [],
      firstCategoryList: [],
      sizeList: {},
      submitParams: []
    }
  },
  created () {
    this.querySecondCategory()
    this.setColumns()
  },
  methods: {
    async queryData () {
      try {
        const res = await this.$api.config.sellBestSize({})
        res.forEach((item, index) => {
          item.key = index
          item.sizeAttr = item.sizeAttr.split(',')
          this.$set(item, 'secondCategoryList', this.allCategoryList.filter(cate => cate.parentId === item.firstCategoryId))
          this.$set(item, 'thirdCategoryList', this.allCategoryList.filter(cate => cate.parentId === item.secondCategoryId))
          this.$set(item, 'sizeList', this.sizeList[item.secondCategoryId])
        })
        this.tableData = res
        this.key = res.length - 1
        this.loading = false
      } catch (e) {
        this.loading = false
      }
    },
    async querySecondCategory () {
      this.loading = { spinning: true, tip: 'loading...' }
      try {
        const res = await this.$api.config.queryProductCategory({})
        this.allCategoryList = res
        this.firstCategoryList = res.filter(item => !item.parentId)
        this.querySize()
      } catch (e) {
        this.loading = false
      }
    },
    async querySize () {
      try {
        const res = await this.$api.config.listCategorySize({})
        this.sizeList = res
        this.queryData()
      } catch (e) {
        this.loading = false
      }
    },
    cancelShowPop () {
      this.popconfirmVisible = false
    },
    paramsVerify () {
      if (this.popconfirmVisible) {
        return
      }
      this.submitParams.splice(0)
      for (let i = 0; i < this.tableData.length; i++) {
        const item = this.tableData[i]
        const category = item.firstCategoryId + '_' + item.secondCategoryId + '_' + item.thirdCategoryId
        console.log(category)
        if (!item.firstCategoryId) {
          this.$message.error(`第${i + 1}行数据组中，一级类别未选择，${key}请检查`)
          return
        }
        if (!item.secondCategoryId) {
          this.$message.error(`第${i + 1}行数据组中，二级类别未选择，请检查`)
          return
        }
        if (!item.thirdCategoryId) {
          this.$message.error(`第${i + 1}行数据组中，三级类别未选择，请检查`)
          return
        }
        const sameCategoryList = this.tableData.filter(cat => cat.firstCategoryId + '_' + cat.secondCategoryId + '_' + cat.thirdCategoryId === category)
        if (sameCategoryList.length > 1) {
          this.$message.error(`相同类别（${item.firstCategoryName}__${item.secondCategoryName}__${item.thirdCategoryName}）只能存在一条数据，请检查!`)
          return
        }
        if (item.sizeAttr === undefined || item.sizeAttr.length <= 0) {
          this.$message.error(`第${i + 1}行数据组中，畅销码未输入，请检查`)
          return
        }
        this.submitParams.push({
          configId: 3,
          firstCategoryEn: this.filterData(this.firstCategoryList, 'id', item.firstCategoryId, 'ename'),
          firstCategoryId: item.firstCategoryId,
          firstCategoryName: item.firstCategoryName,
          secondCategoryEn: this.filterData(item.secondCategoryList, 'id', item.secondCategoryId, 'ename'),
          secondCategoryId: item.secondCategoryId,
          secondCategoryName: item.secondCategoryName,
          thirdCategoryEn: this.filterData(item.thirdCategoryList, 'id', item.thirdCategoryId, 'ename'),
          thirdCategoryId: item.thirdCategoryId,
          thirdCategoryName: item.thirdCategoryName,
          sizeAttr: item.sizeAttr.join(',')
        })
      }
      this.popconfirmVisible = true
    },
    async saveConfig () {
      try {
        await this.$api.config.addBestSize(this.submitParams)
        this.$message.success('保存成功')
        this.$emit('close')
      } catch (e) {
        console.log(e)
      }
    },
    cancel () {
      this.$emit('close')
    },
    selectFirstcategory (value, record) {
      record.firstCategoryId = value
      record.firstCategoryName = this.filterData(this.firstCategoryList, 'id', value, 'name')
      record.secondCategoryId = undefined
      record.sizeAttr = []
      this.$set(record, 'secondCategoryList', this.allCategoryList.filter(item => item.parentId === value))
    },
    selectSecondcategory (value, record) {
      record.secondCategoryId = value
      record.secondCategoryName = this.filterData(record.secondCategoryList, 'id', value, 'name')
      record.thirdCategoryId = undefined
      record.sizeAttr = []
      this.$set(record, 'thirdCategoryList', this.allCategoryList.filter(item => item.parentId === value))
    },
    selectThirdcategory (value, record) {
      record.sizeAttr = []
      record.thirdCategoryId = value
      record.thirdCategoryName = this.filterData(record.thirdCategoryList, 'id', value, 'name')
      // const category = record.firstCategoryName + '_' + record.secondCategoryName
      this.$set(record, 'sizeList', this.sizeList[record.secondCategoryId])
      // switch (category) {
      //   case '泳衣_标码服装':
      //     record.sizeAttr = ['S', 'M', 'L']
      //     break
      //   case '泳衣_大码服装':
      //     record.sizeAttr = ['0X', '1X', '2X']
      //     break
      //   case '泳衣_儿童服装':
      //     record.sizeAttr = ['2', '4', '6']
      //     break
      // }
    }
  }
}
</script>

<style lang="less" module>
.footer {
  text-align: center;
  padding-top: 20px;
}
.add {
  text-align: center;
  padding: 10px 0;
  cursor: pointer;
}
.save {
  margin-right: 20px;
}
/deep/ .ant-table-tbody{
  min-height: 200px;
}
</style>
