/* eslint-disable */
import { HistoryOutlined, DashboardOutlined, ForkOutlined, ControlOutlined } from '@ant-design/icons';

const getStageHomeTabs = (railGrade) => {
    const stageHomeTabs = [
        {
            title: 'Rail Rolling Control',
            icon: <ControlOutlined />,
            link: "/stage/rollingControl"
        },
        {
            title: 'Rolling Verification',
            icon: <DashboardOutlined />,
            link: "/stage/rollingVerification"
        },
        {
            title: 'Rail Finishing Verification',
            icon: <HistoryOutlined />,
            link: "/stage/finishingVerification"
        },
        {
            title: 'HT Sequence',
            icon: <ForkOutlined />,
            link: "/stage/htSequence"
        }
    ];

    return stageHomeTabs.filter(tab => !(railGrade === "R260" || railGrade === "880" || railGrade === "880NC") || tab.title !== 'HT Sequence');
}

export default getStageHomeTabs;