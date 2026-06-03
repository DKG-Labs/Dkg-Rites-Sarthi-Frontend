import React from 'react';

const TableView = ({ type, data, isShiftActive, onEdit, onView, onDelete, isLoading }) => {
  const getColumnCount = () => {
    switch (type) {
      case 'mould-verification': return 6;
      case 'raw-material': return 6;
      case 'mixing': return 6;
      case 'sheeting': return 5;
      case 'rheometer': return 6;
      case 'hydraulic-press': return 7;
      case 'visual-inspection': return 5;
      default: return 6;
    }
  };

  const colCount = getColumnCount();

  const renderHeaders = () => {
    switch (type) {
      case 'mould-verification':
        return (
          <>
            <th>Mould / Drawing No.</th>
            <th>Time Checked</th>
            <th>Dim. Accuracy</th>
            <th>Defects Check</th>
            <th>Status</th>
          </>
        );
      case 'raw-material':
        return (
          <>
            <th>Batch No.</th>
            <th>Total Weight</th>
            <th>% Rubber</th>
            <th>Verification</th>
            <th>Status</th>
          </>
        );
      case 'mixing':
        return (
          <>
            <th>Batch No.</th>
            <th>Time (min)</th>
            <th>Temp (°C)</th>
            <th>Water/Dust</th>
            <th>Status</th>
          </>
        );
      case 'sheeting':
        return (
          <>
            <th>Batch No.</th>
            <th>Sheeting</th>
            <th>Remarks</th>
            <th>Status</th>
          </>
        );
      case 'rheometer':
        return (
          <>
            <th>Batch No.</th>
            <th>Vulcan. Time</th>
            <th>Vulcan. Temp</th>
            <th>Ensured</th>
            <th>Status</th>
          </>
        );
      case 'hydraulic-press':
        return (
          <>
            <th>Batch No.</th>
            <th>Press ID</th>
            <th>Curing Time (min)</th>
            <th>Curing Temp (°C)</th>
            <th>Curing Pressure</th>
            <th>Status</th>
          </>
        );
      case 'visual-inspection':
        return (
          <>
            <th>Sample Qty</th>
            <th>Clear Cut Sides</th>
            <th>Smooth Surface</th>
            <th>Status</th>
          </>
        );
      default:
        return null;
    }
  };

  const renderRow = (entry, index) => {
    let specificCells;
    switch (type) {
      case 'mould-verification':
        specificCells = (
          <>
            <td>{entry.mouldNumber}</td>
            <td>{entry.timeOfCheck}</td>
            <td>{entry.dimensionalAccuracy}</td>
            <td>{entry.freedomFromDefects}</td>
          </>
        );
        break;
      case 'raw-material':
        specificCells = (
          <>
            <td>{entry.batchNo}</td>
            <td>{entry.totalWeight} kg</td>
            <td>{entry.rubberPercentage}%</td>
            <td>{entry.acceptedMaterials}</td>
          </>
        );
        break;
      case 'mixing':
        specificCells = (
          <>
            <td>{entry.batchNo}</td>
            <td>{entry.mixingTime}</td>
            <td>{entry.mixingTemp}</td>
            <td>W: {entry.waterCirculation} | D: {entry.dustCollector}</td>
          </>
        );
        break;
      case 'sheeting':
        specificCells = (
          <>
            <td>{entry.batchNo}</td>
            <td>{entry.sheeting}</td>
            <td>{entry.remarks || '-'}</td>
          </>
        );
        break;
      case 'rheometer':
        specificCells = (
          <>
            <td>{entry.batchNo}</td>
            <td>{entry.vulcanTime} min</td>
            <td>{entry.vulcanTemp} °C</td>
            <td>{entry.ensured}</td>
          </>
        );
        break;
      case 'hydraulic-press':
        specificCells = (
          <>
            <td>{entry.batchNo}</td>
            <td>{entry.pressId}</td>
            <td>{entry.curingTime}</td>
            <td>{entry.curingTemp}</td>
            <td>{entry.curingPressure}</td>
          </>
        );
        break;
      case 'visual-inspection':
        specificCells = (
          <>
            <td>{entry.sampleQuantity}</td>
            <td>{entry.clearCutSides}</td>
            <td>{entry.smoothSurface}</td>
          </>
        );
        break;
      default:
        specificCells = null;
    }

    return (
      <tr key={index}>
        {specificCells}
        <td>
          <span className={`status-badge ${entry.status === 'OK' ? 'status-ok' : 'status-not-ok'}`}>
            {entry.status}
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-start' }}>
            <button
              onClick={() => onView(entry, index)}
              className="btn-pill-small-view"
            >
              View
            </button>
            {isShiftActive && (
              <>
                <button
                  onClick={() => onEdit(entry, index)}
                  className="btn-pill-small"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(entry, index)}
                  className="btn-pill-small-delete"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {renderHeaders()}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: colCount }).map((_, colIdx) => (
                  <td key={colIdx}>
                    <div className="skeleton-bar" style={{ width: `${Math.floor(Math.random() * 40) + 45}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={colCount} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No entries found for this shift.
              </td>
            </tr>
          ) : (
            data.map((entry, index) => renderRow(entry, index))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;
