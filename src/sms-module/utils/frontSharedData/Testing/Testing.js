/* eslint-disable */
import { FileSearchOutlined, EyeOutlined, PieChartOutlined } from '@ant-design/icons';

const testingHomeTabs = [
    {
      title: 'Pending Test Samples',
      icon: <EyeOutlined />,
      link: "/testing/pendingTestSamples"
    },
    {
      title: 'Shift Testing Report',
      icon: <FileSearchOutlined />,
      link: "/testing/testingReport"
    },
    {
        title: 'Heat Pending for Decision',
        icon: <PieChartOutlined />,
        link: "/testing/heatPending"
    },
]

export default testingHomeTabs;