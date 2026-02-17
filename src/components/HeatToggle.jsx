import './HeatToggle.css';

/**
 * Heat Toggle Component - Allows switching between heats in Raw Material submodules
 * Consolidates duplicate heat numbers to show only unique heats
 */
const HeatToggle = ({ heats = [], activeHeatIndex = 0, onHeatChange }) => {
  // Filter out empty heats (heats with no heatNo)
  const validHeats = heats.filter(heat => heat && (heat.heatNo || heat.heat_no));

  // If no valid heats, show a message instead of returning null
  if (!validHeats || validHeats.length === 0) {
    return (
      <div className="heat-toggle-container" style={{ background: '#fff3cd', borderColor: '#ffc107' }}>
        <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
          ⚠️ No heats available. Please ensure heat data is entered in the Raw Material Dashboard.
        </p>
      </div>
    );
  }

  // Consolidate duplicate heat numbers - create a map of unique heat numbers to their first occurrence index
  const uniqueHeatsMap = new Map();
  const uniqueHeatsArray = [];

  validHeats.forEach((heat, idx) => {
    const heatNo = heat.heatNo || heat.heat_no;
    if (!uniqueHeatsMap.has(heatNo)) {
      uniqueHeatsMap.set(heatNo, idx);
      uniqueHeatsArray.push({ heat, originalIndex: idx, heatNo });
    }
  });

  // Find which unique heat index corresponds to the active heat
  const activeHeatNo = validHeats[activeHeatIndex]?.heatNo || validHeats[activeHeatIndex]?.heat_no;
  const activeUniqueIndex = uniqueHeatsArray.findIndex(item => item.heatNo === activeHeatNo);

  // If only one unique heat, display as a simple label without toggle buttons
  if (uniqueHeatsArray.length === 1) {
    const singleHeat = uniqueHeatsArray[0];
    return (
      <div className="heat-toggle-container heat-single-display">
        <span className="heat-single-label">
          Heat {singleHeat.heatNo || `H${String(1).padStart(3, '0')}`}
        </span>
      </div>
    );
  }

  return (
    <div className="heat-toggle-container">
      {uniqueHeatsArray.map((item, uniqueIdx) => (
        <button
          key={item.heatNo}
          type="button"
          className={`heat-toggle-btn ${uniqueIdx === activeUniqueIndex ? 'active' : ''}`}
          onClick={() => onHeatChange(item.originalIndex)}
        >
          {`Heat ${item.heatNo || `H${String(uniqueIdx + 1).padStart(3, '0')}`}`}
        </button>
      ))}
    </div>
  );
};

export default HeatToggle;

