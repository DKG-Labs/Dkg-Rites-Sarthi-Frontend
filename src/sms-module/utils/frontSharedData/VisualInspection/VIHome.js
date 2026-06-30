/* eslint-disable */
import { FileSearchOutlined, EyeOutlined }from '@ant-design/icons';

const visualHomeTabs = [
    {
      title: 'Visual Inspection',
      icon: <EyeOutlined />,
      link: "/visual/inspection"
    },
    {
      title: 'Shift Inspection Summary',
      icon: <FileSearchOutlined />,
      link: "/visual/summary"
    },
    {
      title: 'Visual Inspection Summary',
      icon: <FileSearchOutlined />,
      link: "/visual/viSummary"
    },
    // {
    //   title: 'Test Sample Marking',
    //   icon: <PieChartOutlined />,
    //   link: "/stage/testSampleMarkingList"
    // },
]

export default visualHomeTabs;