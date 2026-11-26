/* eslint-disable */
import { FileSearchOutlined, EyeOutlined, PieChartOutlined }from '@ant-design/icons';

const weldingHomeTabs = [
    {
      title: 'New Weld Inspection',
      icon: <EyeOutlined />,
      link: "/sms/welding/newWeldInspection"
    },
    {
      title: 'Held or Rejected Panel',
      icon: <FileSearchOutlined />,
      link: "/sms/welding/heldRejectedPanel"
    },
    {
      title: 'Weld Testing',
      icon: <PieChartOutlined />,
      link: "/sms/welding/testSample"
    },
    {
        title: 'Shift Summary',
        icon: <PieChartOutlined />,
        link: "/sms/welding/shiftSummary"
    },
]

export default weldingHomeTabs;