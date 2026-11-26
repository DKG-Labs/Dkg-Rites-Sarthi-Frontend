/* eslint-disable */
import { FileSearchOutlined, EyeOutlined, PieChartOutlined } from '@ant-design/icons';

const testingHomeTabs = [
    {
      title: 'Pending Test Samples',
      icon: <EyeOutlined />,
      link: "/sms/testing/pendingTestSamples"
    },
    {
      title: 'Shift Testing Report',
      icon: <FileSearchOutlined />,
      link: "/sms/testing/testingReport"
    },
    {
        title: 'Heat Pending for Decision',
        icon: <PieChartOutlined />,
        link: "/sms/testing/heatPending"
    },
]

export default testingHomeTabs;