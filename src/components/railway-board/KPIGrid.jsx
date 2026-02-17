import React from 'react';
import { KPICard } from './SharedComponents';
import { KPI_METRICS } from '../../data/railwayBoardData';

const KPIGrid = ({ activeKpi, setActiveKpi }) => {
    return (
        <div className="kpi-grid">
            {KPI_METRICS.map(kpi => (
                <KPICard
                    key={kpi.id}
                    data={kpi}
                    isActive={activeKpi === kpi.id}
                    onClick={() => setActiveKpi(kpi.id)}
                />
            ))}
        </div>
    );
};

export default KPIGrid;
