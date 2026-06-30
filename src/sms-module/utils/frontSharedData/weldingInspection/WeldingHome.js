/* eslint-disable */
import { FileSearchOutlined, EyeOutlined, PieChartOutlined }from '@ant-design/icons';

const weldingHomeTabs = [
    {
      title: 'New Weld Inspection',
      icon: <EyeOutlined />,
      link: "/welding/newWeldInspection"
    },
    {
      title: 'Held or Rejected Panel',
      icon: <FileSearchOutlined />,
      link: "/welding/heldRejectedPanel"
    },
    {
      title: 'Weld Testing',
      icon: <PieChartOutlined />,
      link: "/welding/testSample"
    },
    {
        title: 'Shift Summary',
        icon: <PieChartOutlined />,
        link: "/welding/shiftSummary"
    },
]

export default weldingHomeTabs;