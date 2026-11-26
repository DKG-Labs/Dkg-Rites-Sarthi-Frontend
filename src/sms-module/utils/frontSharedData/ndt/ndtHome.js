/* eslint-disable */
import { FileSearchOutlined, EyeOutlined }from '@ant-design/icons';

const ndtHomeTabs = [
    {
      title: 'NDT Calibration',
      icon: <EyeOutlined />,
      link: "/sms/ndt/calibration"
    },
    {
      title: 'Shift Summary',
      icon: <FileSearchOutlined />,
      link: "/sms/ndt/shiftSummary"
    },
    // {
    //   title: 'NDT Report',
    //   icon: <PieChartOutlined />,
    //   link: "/sms/ndt/report"
    // },
    // {
    //     title: 'Test Sample Marking',
    //     icon: <ExperimentOutlined />,
    //     link: "/sms/stage/testSampleMarkingList"
    // },
]

export default ndtHomeTabs;