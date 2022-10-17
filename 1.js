var componentOptions = {
  language: 'Vue',
  template: `
          <div class="data-import-content">
          <div v-if="!editable" class="data-import-content-mask"></div>
          <div class="data-import-content-top">
            <div class="step-item">
              <div class="step-num">
                1
              </div>
              <span>{{ $t('下载模板') }}</span>
            </div>
            <div class="step-item">
              <div class="step-num">
                2
              </div>
              <span>{{ $t('整理数据') }}</span>
            </div>
            <div class="step-item">
              <div class="step-num">
                3
              </div>
              <span>{{ $t('上传文件') }}</span>
            </div>
          </div>
          <div class="data-import-content-bottom">
            <div class="data-import-content-item download-item">
              <x-svg-icon
                style="margin-bottom: 16px"
                name="x-lib-excel"
                :width="48"
                :height="48"
                class=""
              ></x-svg-icon>
              <el-button
                v-if="editable"
                type="text"
                :loading="downloadBtnLoading"
                @click="downloadApi"
              >
                {{ $t('下载模板') }}
              </el-button>
              <span v-else>{{ $t('下载模板') }}</span>
            </div>
            <div class="data-import-content-item sort-item">
              <div class="dealDataMessage">
                <span class="top">{{ $t('将数据整理进模版文件中') }}</span>
                <span class="bottom">{{ $t('单次导入上限10000条') }}</span>
              </div>
            </div>
            <div class="data-import-content-item upload-item">
              <el-upload
                class="upload-demo"
                drag
                action="Fake Action"
                :accept="accept"
                :multiple="false"
                :show-file-list="false"
                :on-success="uploadSuccess"
                :on-progress="uploadProgress"
                :http-request="handleUpload"
                :disabled="!editable || loading"
                :before-upload="beforeUpload"
                @click.native="uploadItemClick"
              >
                <div class="upload-drop-icon">
                  <!-- <div v-if="configValue" class="imgPreview" :style="{'background-image' : 'url(' + configValue + ')'}"></div> -->
                  <!-- <img v-if="configValue" :src="configValue" class="imgPreview" alt="" /> -->
                  <x-svg-icon :width="48" :height="48" name="x-lib-upload-icon"></x-svg-icon>
                </div>
                <div class="el-upload__text">
                  {{ $t('将文件拖到此处或点击上传') }}
                </div>
              </el-upload>
              <div v-if="loading" class="item-icon loading-icon">
                <x-svg-icon class="loading-anim" name="x-lib-loading"></x-svg-icon>
              </div>
            </div>
          </div>
          <div v-if="editable && showImportProgress" class="data-import-progress">
            <div v-if="!isServeError" class="file-name">
              <x-ellipsis :label="fileName" :max-lines="1"></x-ellipsis>
              .
              <span>{{ fileType }}</span>
            </div>
            <el-progress
              v-if="!isServeError && refleshProgress"
              :show-text="false"
              :stroke-width="8"
              :percentage="percentage"
              :color="customColorMethod"
            ></el-progress>
            <div v-if="!isServeError" class="import-status">
              <span v-if="loading">{{
                $t('文件上传中，请耐心等待数据导入完成，切勿关闭弹窗或重复操作。')
              }}</span>
              <span :style="{ 'color' : isError ? 'red' : '#000' }">


              <span v-if="!loading"
              >{{ $t('导入数据') }}{{ inportNum }}{{ $t('条')
              }}<span v-if="isError">{{ $t('，可能存在异常数据') }}</span></span
              >
              
              
              </span>
             
              <el-button v-if="!loading && isError" :loading="downloadErrorBtnLoading" type="text" @click="errorDataHandle" style="line-height:14px">
                {{ $t('查看异常数据') }}
              </el-button>
            </div>
            <div v-if="isServeError" class="import-status">
              <span class="serve-error-span">{{
                serveErrorMsg || $t('网络错误，请稍后重新上传。')
              }}</span>
            </div>
          </div>
        </div>
        `,
  footerTemplate: `
          <div>
          <el-button @click="onCancel">取消</el-button>
          <el-button @click="onOk">确认</el-button>
          </div>
        `,
  data() {
    let selfDevBaseUrl = sessionStorage.getItem('selfDevBaseUrl')
    return {
      // --------------------------------配置部分-----------------------------------------------
      // 获取导入信息接口
      getTemplateUrl: selfDevBaseUrl + '/ids/service/core/idsPo/getImportView',
      // 导入配置
      importConfig: {
        templateCode: 'CGSKU0001', // 模板编码
        templateName: '', // 模板名称
        templateUrl: '', // 模板下载地址
        importUrl:
          selfDevBaseUrl +
          '/ids/service/core/csc/customerGoods/customerGoodsCodeImport', // 导入接口地址
        errorExportName: '商品主数据错误数据导出',
        errorExportUrl: '', // 错误数据导出地址
      },
      errorData: [], // 异常数据
      // ---------------------------------尽量不修改部分---------------------------------------------
      // 弹框配置
      modalOptions: {
        modalVisible: true,
        title: '数据导入',
        wrapperClass: '',
        width: 'middle', // 'small' 'middle' 'large' '800' ···
      },
      isImportComplete: true, // 是否导入完成
      editable: true,
      loading: false,
      downloadBtnLoading: false,
      downloadErrorBtnLoading: false,
      percentage: 0, // 数据导入进度
      fileName: '',
      fileType: '',
      inportNum: 0, // 导入成功的条数
      isError: false, // 是否有异常数据
      showImportProgress: false, // 是否展示底部导入信息
      isServeError: false, // 导入接口是否报错
      serveErrorMsg: '',
      refleshProgress: true, // 是否重新渲染进度条
      loadingProgressTimeout: 0, // 进度条timeout
      uploadProgress: (event, file, fileList) => {
        console.log(event, file, fileList)
        this.loading = true
      },
      uploadSuccess: (response, file, fileList) => {
        console.log(response)
        this.loading = false
      },
    }
  },
  created() {
    // 获取导入的相关配置
    const params = {
      tempCode: this.importConfig.templateCode,
    }
    this.$request({
      url: this.getTemplateUrl,
      method: 'POST',
      disableSuccessMsg: true,
      params: params,
    }).asyncThen((resp) => {
      console.log(this.$store.state)
      const token = btoa(
        JSON.stringify({
          xdaptenantid: this.$store.state.tenantModule.currentOrg.id,
        })
      )
      this.importConfig.templateUrl = `${resp.data.url}&token=${token}&download=download`
      this.importConfig.importUrl = resp.data.importUrl
      this.importConfig.templateName = resp.data.name
      this.importConfig.errorExportUrl = resp.data.errorExportUrl
      this.importConfig.errorExportName =
        resp.data.errorExportName + '.xlsx' || '导入失败数据.xlsx'
    })
  },
  mounted() {
    // 浏览器关闭和刷新事件
    this.$bomEventPlugin.addBomEventListener('beforeunload', (e) => {
      if (!this.isImportComplete) {
        const confirmMsg = this.$t('dataImport.closeImportModalMsg')
        e.returnValue = confirmMsg
        return confirmMsg
      }
    })
  },
  beforeDestroy() {
    this.$bomEventPlugin.removeBomEventListener('beforeunload')
  },
  computed: {
    accept() {
      return '.xlsx,.xls'
    },
  },
  methods: {
    // -----------------------------------需改动部分------------------------------------
    // 下载模板接口
    downloadApi() {
      if (this.importConfig.templateUrl) {
        const request = {
          url: this.importConfig.templateUrl,
          method: 'GET',
          disableSuccessMsg: true,
        }
        request.filename = this.importConfig.templateName
        this.downloadBtnLoading = true
        this.$download(request)
          .asyncThen(
            (resp) => {
              this.downloadBtnLoading = false
            },
            () => {
              this.downloadBtnLoading = false
            }
          )
          .asyncErrorCatch((err) => {
            console.error(err)
            this.downloadBtnLoading = false
          })
      } else {
        this.$message({
          message: '未查询到模板地址',
          type: 'error',
        })
      }
    },
    // 上传文件接口调用
    uploadFile(data) {
      let formData = new FormData()
      formData.append('file', data.file, data.file.name)
      formData.append('customerId', '1212')
      return new Promise((resolve, reject) => {
        // 替换成自己的接口
        const request = {
          url: this.importConfig.importUrl,
          method: 'POST',
          disableSuccessMsg: true,
        }
        request.params = formData
        this.$upload(request)
          .asyncThen(
            (resp) => {
              if (resp.data.errorFlag) {
                this.errorData = resp.data.table
              }
              resolve(resp)
            },
            (err) => {
              reject(err)
            }
          )
          .asyncErrorCatch((err) => {
            reject(err)
          })
      })
    },
    // 处理异常数据
    errorDataHandle() {
      // 异常数据展示逻辑，没有可以去掉
      if (this.errorData.length > 0) {
        const request = {
          url: this.importConfig.errorExportUrl,
          method: 'POST',
          disableSuccessMsg: true,
          params: this.errorData,
        }
        request.filename = this.importConfig.errorExportName
        this.downloadErrorBtnLoading = true
        this.$download(request)
          .asyncThen(
            (resp) => {
              this.downloadErrorBtnLoading = false
            },
            () => {
              this.downloadErrorBtnLoading = false
            }
          )
          .asyncErrorCatch((err) => {
            console.error(err)
            this.downloadErrorBtnLoading = false
          })
      }
    },
    // -----------------------------------可不改动部分------------------------------------
    setIsImportComplete(e, res, logMesCallback) {
      this.isImportComplete = e
      if (this.isImportComplete) {
        this.$emit('import-completed', res, logMesCallback)
      }
    },
    // 上传按钮点击事件触发
    uploadItemClick(e) {},
    /**
     * 上传之前校验文件格式
     */
    beforeUpload(file) {
      return new Promise((resolve, reject) => {
        if (['.xlsx', '.xls'].includes(this.getFileType(file))) {
          resolve()
        } else {
          this.$message({
            message: this.$t('文件格式不正确'),
            type: 'warning',
          })
          reject(new Error())
        }
      })
    },
    /**
     * 上传接口
     */
    handleUpload(data) {
      this.showImportProgress = true
      this.loading = true
      this.isServeError = false
      // 重新渲染进度条
      this.refleshProgress = false
      this.$nextTick(() => {
        this.refleshProgress = true
        this.percentage = 0
        this.calcLoadingProgress()
      })
      const index = data.file.name.lastIndexOf('.')
      this.fileName = data.file.name.substr(0, index)
      this.fileType = data.file.name.substr(index + 1)
      const resp = this.uploadFile(data)
      if (resp instanceof Promise) {
        resp
          .then(
            (res) => {
              this.isServeError = false
              this.percentage = 100
              setTimeout(() => {
                this.$emit(
                  'set-import-complete',
                  true,
                  res,
                  this.setIsImportComplete
                )
              }, 100)
              this.setIsImportComplete(res)
              this.isError = res.data.errorFlag
              this.inportNum = res.data.successNum
            },
            (error) => {
              this.isServeError = true
              this.percentage = 0
              setTimeout(() => {
                this.loading = false
                this.$emit('set-import-complete', true)
              }, 100)
              clearTimeout(this.loadingProgressTimeout) // 清空虚假进度条计算
              console.error(error)
              this.serveErrorMsg = error.message
            }
          )
          .catch((err) => {
            this.isServeError = true
            this.percentage = 0
            setTimeout(() => {
              this.loading = false
              this.$emit('set-import-complete', true)
            }, 100)
            clearTimeout(this.loadingProgressTimeout) // 清空虚假进度条计算
            console.error(err)
          })
      }
    },
    /**
     * 导入上传文件接口
     */
    setIsImportComplete(data) {
      this.isError = data.errorFlag
      if (data.errNum && typeof data.errNum === 'number') {
        this.inportNum = this.inportNum - data.errNum || 0
      }
      clearTimeout(this.loadingProgressTimeout) // 清空虚假进度条计算
      this.loading = false
    },
    /**
     * 进度条颜色
     */
    customColorMethod(percentage) {
      if (percentage >= 100) {
        return '#27B766'
      } else {
        return '#027AFF'
      }
    },

    // 计算加载进度条
    calcLoadingProgress() {
      if (this.percentage < 60) {
        this.percentage += 12
      } else if (this.percentage < 75) {
        this.percentage += 5
      } else if (this.percentage < 95) {
        this.percentage += Math.random()
      } else {
        clearTimeout(this.loadingProgressTimeout)
        return
      }
      this.loadingProgressTimeout = setTimeout(() => {
        this.calcLoadingProgress()
      }, 200 + Math.random() * 300)
    },
    getFileType(file) {
      const index = file.name.lastIndexOf('.')
      if (index !== -1) {
        return file.name.substring(index)
      } else {
        return null
      }
    },
    onOk() {
      this.modalOptions.modalVisible = false
    },
    // 关闭弹窗
    onCancel() {
      this.modalOptions.modalVisible = false
    },
  },
}
return componentOptions
