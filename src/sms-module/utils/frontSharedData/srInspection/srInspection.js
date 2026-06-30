/* eslint-disable */
import { FileSearchOutlined, EyeOutlined }from '@ant-design/icons';

const SrInspectionHomeTabs = [
    {
        title: 'Add New Short Rail Inspection',
        icon: <EyeOutlined />,
        link: "/srInspection/addNewInspection"
      },
      {
        title: 'Other Work Station Remarks',
        icon: <FileSearchOutlined />,
        link: "/srInspection/wsRemarks"
      }
]

export default SrInspectionHomeTabs;