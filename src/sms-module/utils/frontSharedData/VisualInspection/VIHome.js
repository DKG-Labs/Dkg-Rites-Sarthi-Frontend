/* eslint-disable */
import { FileSearchOutlined, EyeOutlined }from '@ant-design/icons';

const visualHomeTabs = [
    {
      title: 'Visual Inspection',
      icon: <EyeOutlined />,
      link: "/sms/visual/inspection"
    },
    {
      title: 'Shift Inspection Summary',
      icon: <FileSearchOutlined />,
      link: "/sms/visual/summary"
    },
    {
      title: 'Visual Inspection Summary',
      icon: <FileSearchOutlined />,
      link: "/sms/visual/viSummary"
    },
    // {
    //   title: 'Test Sample Marking',
    //   icon: <PieChartOutlined />,
    //   link: "/sms/stage/testSampleMarkingList"
    // },
]

export default visualHomeTabs;