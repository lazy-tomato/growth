let customNodeData = [
  {
    afterFormData: {
      '95e64762a667281a824fa06e': [
        {
          id: '366890542337888256',
          name: '山东世鸿科技发展有限公司',
        },
      ],
      bd1f4818bc34d29ca4af8671: [
        {
          _id: 'sellinf_create',
          label: '新建',
          status: 'ENABLE',
        },
      ],
      d8af4086aae32396e85e3a7d: 'BU202210110094',
      b8254a0296efcb3804bd1920: '2022-10-12',
      ca1a4a5d8efbab37ad9b28de: [
        {
          id: '367673949099659264',
          name: '孙文讯测试业务分类113234',
        },
      ],
      VIRTUAL_DOC_ID: '368040344735977472',
      c575446a81510a4b72cd5ed7: [
        {
          id: '101308716336807149568',
          leafNodeFlag: false,
          structureCode:
            '101308716316854845440·101308716319237210112·101308716334361870336·101308716335188148224·101308716336807149568',
          structureName: '十月稻田·营销中心·其他业务部·新零售部·前置仓',
          name: '前置仓',
          parentId: '101308716335188148224',
          departmentCode: '552060010',
        },
      ],
      '09ee4aa5959e0f7390559ff7': '孙文讯测试业务分类113234',
      e9fc48ffaac0d127cf44d5ca: 'complete',
      e3fa41f3882071011b69edf6: [
        {
          id: '367673949099659264',
          name: '孙文讯测试业务分类113234',
        },
      ],
      '1c564e08acca737928d7d6ce': 'XSQD0029',
      '0a03417cafe8288b130d2ea4': ['N'],
      '05e646a48b553244de497a3a': 'N',
      '3b9643ad9248917cf6a967f7': [
        {
          _id: 'daily',
          label: '日常',
          status: 'ENABLE',
        },
      ],
      afa541b49fc109096a0a09a3: {
        province: {
          code: '',
          name: '',
        },
        city: {
          code: '',
          name: '',
        },
        area: {},
        address: {
          name: '',
        },
      },
      '26b9477b84062a3bd1dd1895': '',
      e4e34e029dc2fa79a436fca4: 'KHBM202210090174',
      e4fe419bb4b1064f58546542: [
        {
          id: '308914204474085376',
          name: '沈阳信昌粮食贸易有限公司',
        },
      ],
      '9aef48ca8a1777474b64aac3': [
        {
          _id: 'business_classification',
          label: '业务分类',
          status: 'ENABLE',
        },
      ],
      '747c41928be21c03e87dfa4f': '叮咚小满',
    },
    afterTableData: {
      cf974dceb5dc8e6dddce0702: [
        {
          '55464b059953513c0c691bcb': '110108347441',
          b6e64dbf8aa608648286ed82: '十月稻田五常大米5kg',
          '8cea401aa838e804a5dd67ec': '6953721707441',
          TABLE_LOGO:
            'cf974dceb5dc8e6dddce0702-PART-1ebbac90-5cc0-4ba0-8642-2afcb11e2b84',
          '671a459292efefc232a91c0e': '5',
          f18a48a982dfcf6248ed29c4: '袋',
          VIRTUAL_DOC_ID: '368040344735977472',
          '9258411fbf72702450bc220b': 10,
          '40344a7b93c4dc421fd0f664': '2022-10-12',
          '0a03417cafe8288b130d2ea4': [
            {
              _id: 'Y',
              checked: false,
              label: '是',
              status: 'ENABLE',
            },
          ],
          '05e646a48b553244de497a3a': 'N',
          _XID: 'row_178',
          afa541b49fc109096a0a09a3: {
            province: {
              code: '',
              name: '',
            },
            city: {
              code: '',
              name: '',
            },
            area: {},
            address: {
              name: '',
            },
          },
        },
      ],
    },
    currentTableDataFlag: false,
  },
]

let customNodeData = lowCodeContext.businessEventEngine.customNodeData
let obj = {
  isEmpty: 'N',
  channelCode: '',
  customerCode: '',
  goodsInfoList: [],
}
obj.channelCode = customNodeData[0].afterFormData['1c564e08acca737928d7d6ce']
obj.customerCode = customNodeData[0].afterFormData['e4e34e029dc2fa79a436fca4']
// 日常
if (customNodeData[0].afterTableData['cf974dceb5dc8e6dddce0702']) {
  customNodeData[0].afterTableData['cf974dceb5dc8e6dddce0702'].forEach(
    (item) => {
      obj.goodsInfoList.push({
        goodsCode: item['55464b059953513c0c691bcb'],
        goodsPrice: item['9258411fbf72702450bc220b'],
      })
    }
  )
}

if (obj.goodsInfoList.length === 0) {
  obj.isEmpty = 'Y'
}

console.log('客户价格维护处理完的数据', JSON.stringify(obj))

return obj
