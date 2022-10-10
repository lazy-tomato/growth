var componentOptions = {
  language: 'Vue',
  template: `
    <div>Content here...</div>
  `,
  footerTemplate: `
    <div>Footer here...</div>
  `,
  data() {
    let selfDevBaseUrl = sessionStorage.getItem('selfDevBaseUrl')
    return {
      getTemplateUrl:
        selfDevBaseUrl + '/ids/service/core/priceManage/saveCompanyInPm',
      modalOptions: {
        modalVisible: true,
        title: '标题',
        wrapperClass: '',
        width: 'middle', // 'small' 'middle' 'large' '800' ···
      },
    }
  },
  created() {
    this.modalOptions.modalVisible = false

    let customNodeData =
      lowCodeContext.businessEventEngine.inputDatas[0].afterFormData
    console.log(customNodeData, 'customNodeData07221339')

    let obj = {
      documentId: '',
      companyCodeList: '',
    }

    if (customNodeData && customNodeData['documentId']) {
      obj.documentId = customNodeData.documentId
    }

    if (customNodeData && customNodeData['documentId']) {
      obj.companyCodeList = customNodeData['e4fe419bb4b1064f58546542']
        .map((item) => {
          return item._id
        })
        .join()
    }

    console.log('保存公司接口', obj, lowCodeContext)
    this.$request({
      url: this.getTemplateUrl,
      method: 'POST',
      disableSuccessMsg: true,
      params: obj,
    })
      .asyncThen((resp) => {
        console.log('保存公司接口成功')
        lowCodeContext.businessEventEngine.confirmEventEmit({})
      })
      .catch((err) => {
        console.log(err, '保存公司接口失败')
        lowCodeContext.businessEventEngine.confirmEventEmit({})
      })
  },
  methods: {},
}
return componentOptions
