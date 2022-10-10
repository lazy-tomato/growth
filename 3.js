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
        selfDevBaseUrl + '/ids/service/core/priceManage/writeInLogAboutPrice',
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
    this.play()
  },
  methods: {
    play() {
      let customNodeData = lowCodeContext.businessEventEngine.inputDatas

      let oldFormData = JSON.parse(sessionStorage.getItem('priceOldData') || '')
      let obj = {
        formId: '62c53a870ad9b6206be675b9',
        newCompany: '',
        oldCompany: '',
        priceManageDetailListBefore: '',
        priceManageDetailListAfter: '',
      }

      let companyUuid = 'e4fe419bb4b1064f58546542'

      // 1.处理公司字段
      let newCompany = customNodeData[0].afterFormData[companyUuid]
        .map((i) => Number(i._id || i.id))
        .sort()

      let oldCompany = oldFormData[companyUuid]
        .map((i) => {
          return Number(i._id || i.id)
        })
        .sort()

      // console.log(newCompany, oldCompany)

      obj.newCompany = JSON.stringify(newCompany)
      obj.oldCompany = JSON.stringify(oldCompany)

      // 2.处理子表字段

      let config = {
        '6e3244348e54f16d5b9e7f82': 'priceLineNumber',
        '55464b059953513c0c691bcb': 'goodsCode',
        b6e64dbf8aa608648286ed82: 'goodsName',
        '671a459292efefc232a91c0e': 'goodsSpecify',
        '8cea401aa838e804a5dd67ec': 'goods69code',
        dba14c248abf77adf310a335: 'goodsSign',
        '6c364f0fb007baf7e6fedab7': 'goodsUnit',
        afa541b49fc109096a0a09a3: 'areaJson',
        '9258411fbf72702450bc220b': 'supplyPrice',
        '4e69488eb4244974327c50e2': 'pricePoint',
        '40344a7b93c4dc421fd0f664': 'effectiveDate',
        a1a24418b0e8eaad0953fc89: 'expiryDate',
        '0a03417cafe8288b130d2ea4': 'needApproval',
        '3cda40adb23d780babc4597d': 'priceRemark',
        d7ed48eeb47e69f92557ecda: 'isModify',
      }

      // uuid => modelField
      function getUuidToModelField(obj, config) {
        for (const key in obj) {
          if (Object.hasOwnProperty.call(obj, key)) {
            const element = obj[key]
            let modelField = config[key]

            if (modelField) {
              obj[modelField] = element
            }
          }
        }

        return obj
      }

      let sonTableUuid = 'cf974dceb5dc8e6dddce0702'

      let priceManageDetailListBefore = customNodeData[0].afterTableData[
        sonTableUuid
      ].map((i) => getUuidToModelField(i, config))
      let priceManageDetailListAfter = oldFormData[sonTableUuid].map((i) =>
        getUuidToModelField(i, config)
      )

      obj.priceManageDetailListBefore = JSON.stringify(
        priceManageDetailListBefore
      )
      obj.priceManageDetailListAfter = JSON.stringify(
        priceManageDetailListAfter
      )

      console.log(obj, lowCodeContext, '1211')

      this.$request({
        url: this.getTemplateUrl,
        method: 'POST',
        disableSuccessMsg: true,
        params: obj,
      })
        .asyncThen((resp) => {
          console.log('写入日志成功')
          lowCodeContext.businessEventEngine.confirmEventEmit({})
        })
        .catch((err) => {
          console.log(err, '写入日志失败')
          lowCodeContext.businessEventEngine.cancelEventEmit()
        })
    },
  },
}
return componentOptions
