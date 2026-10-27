import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

// In-memory cache to avoid repeated network requests
const cache = new Map();
const inFlightPromises = new Map();

/**
 * Clean and normalize a call number
 */
export const normalizeCallNo = (call) => {
  if (!call) return '';
  let raw = (
    typeof call === 'string'
      ? call
      : call.call_no ||
        call.callNo ||
        call.icNumber ||
        call.ic_number ||
        call.icNo ||
        call.requestId ||
        call.callNumber ||
        ''
  ).toString().trim();

  // If formatted like N/ER-05240001/ or N/EF-03090001/RAJK, extract the core call number
  if (raw.includes('/')) {
    const parts = raw.split('/').map(p => p.trim()).filter(Boolean);
    const matched = parts.find(p => /^(ER|EF|EP|RM|PROC|FINAL|CALL)-/i.test(p));
    if (matched) return matched;
    if (parts.length >= 2 && parts[1]) return parts[1];
  }
  return raw;
};

/**
 * Determine call type: 'RM' (Raw Material), 'PROCESS', or 'FINAL'
 */
export const determineCallType = (call) => {
  if (!call) return 'RM';

  const productType = (call.product_type || call.productType || '').toLowerCase();
  const stage = (call.stage || '').toLowerCase();
  const callNo = normalizeCallNo(call).toUpperCase();

  // Explicit Final checks
  if (
    stage.includes('final') ||
    productType.includes('final') ||
    callNo.startsWith('EF-') ||
    callNo.startsWith('FINAL-') ||
    callNo.startsWith('CALL-FINAL') ||
    callNo.startsWith('FP-')
  ) {
    return 'FINAL';
  }

  // Explicit Process checks
  if (
    stage.includes('process') ||
    productType.includes('process') ||
    callNo.startsWith('EP-') ||
    callNo.startsWith('PROC-') ||
    callNo.startsWith('CALL-PROC')
  ) {
    return 'PROCESS';
  }

  // Explicit Raw Material checks
  if (
    stage.includes('rm') ||
    stage.includes('raw') ||
    productType.includes('raw') ||
    productType.includes('rm') ||
    callNo.startsWith('ER-') ||
    callNo.startsWith('RM-') ||
    callNo.startsWith('CALL-RM')
  ) {
    return 'RM';
  }

  // Default fallback based on prefix or stage
  if (callNo.startsWith('EF')) return 'FINAL';
  if (callNo.startsWith('EP')) return 'PROCESS';
  return 'RM';
};

/**
 * Extract Heat or Lot data already present on the call object (fast-path sync)
 */
export const extractSynchronousData = (call) => {
  if (!call) return null;
  const type = determineCallType(call);

  if (type === 'RM') {
    // Check if heat numbers already exist in properties
    const heatList = [];

    if (Array.isArray(call.rmHeatQuantities) && call.rmHeatQuantities.length > 0) {
      call.rmHeatQuantities.forEach((item) => {
        const hNo = item.heatNumber || item.heatNo;
        if (hNo) {
          heatList.push({
            number: hNo.toString().trim(),
            tcNo: item.tcNumber || item.tcNo || '-',
            offeredQty: item.offeredQty ?? '-',
            acceptedQty: item.qtyAccepted ?? item.acceptedQty ?? '-',
            rejectedQty: item.qtyRejected ?? item.rejectedQty ?? '-'
          });
        }
      });
    } else if (Array.isArray(call.heatDetails) && call.heatDetails.length > 0) {
      call.heatDetails.forEach((item) => {
        const hNo = item.heatNo || item.heatNumber;
        if (hNo) {
          heatList.push({
            number: hNo.toString().trim(),
            tcNo: item.tcNo || item.tcNumber || '-',
            offeredQty: item.offeredQty ?? '-',
            acceptedQty: item.acceptedQty ?? '-',
            rejectedQty: item.rejectedQty ?? '-'
          });
        }
      });
    } else if (call.heat_numbers || call.heatNumbers || call.rmHeatNumbers) {
      const raw = (call.heat_numbers || call.heatNumbers || call.rmHeatNumbers).toString();
      raw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean).forEach((num) => {
        heatList.push({
          number: num,
          tcNo: '-',
          offeredQty: '-',
          acceptedQty: '-',
          rejectedQty: '-'
        });
      });
    } else if (call.heat_no || call.heatNo) {
      const hNo = (call.heat_no || call.heatNo).toString().trim();
      if (hNo) {
        heatList.push({
          number: hNo,
          tcNo: call.tc_no || call.tcNo || '-',
          offeredQty: call.call_qty || call.offeredQty || '-',
          acceptedQty: '-',
          rejectedQty: '-'
        });
      }
    }

    if (heatList.length > 0) {
      return {
        type: 'RM',
        label: 'Heat No.',
        primary: heatList[0].number,
        count: heatList.length,
        items: heatList,
        rawString: heatList.map(h => h.number).join(', ')
      };
    }
  } else {
    // Process or Final: Check Lot data
    const lotList = [];

    const candidateLots =
      call.finalLotDetails ||
      call.processInspectionDetails ||
      call.lotDetails ||
      call.lots ||
      [];

    if (Array.isArray(candidateLots) && candidateLots.length > 0) {
      candidateLots.forEach((item) => {
        const lNo = item.lotNumber || item.lotNo;
        if (lNo) {
          lotList.push({
            number: lNo.toString().trim(),
            lotNo: lNo.toString().trim(),
            heatNo: item.heatNumber || item.heatNo || '-',
            offeredQty: item.offeredQty ?? item.declaredLotSize ?? '-',
            acceptedQty: item.qtyAccepted ?? '-',
            rejectedQty: item.qtyRejected ?? '-'
          });
        }
      });
    } else if (call.lot_numbers || call.lotNumbers) {
      const raw = (call.lot_numbers || call.lotNumbers).toString();
      raw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean).forEach((num) => {
        lotList.push({
          number: num,
          lotNo: num,
          heatNo: '-',
          offeredQty: '-',
          acceptedQty: '-',
          rejectedQty: '-'
        });
      });
    } else if (call.lot_no || call.lotNo) {
      const lNo = (call.lot_no || call.lotNo).toString().trim();
      if (lNo) {
        lotList.push({
          number: lNo,
          lotNo: lNo,
          heatNo: call.heat_no || call.heatNo || '-',
          offeredQty: call.call_qty || call.offeredQty || '-',
          acceptedQty: '-',
          rejectedQty: '-'
        });
      }
    }

    if (lotList.length > 0) {
      return {
        type,
        label: 'Lot No.',
        primary: lotList[0].number,
        count: lotList.length,
        items: lotList,
        rawString: lotList.map(l => l.number).join(', ')
      };
    }
  }

  return null;
};

/**
 * Fetch Heat or Lot details asynchronously with caching and in-flight deduplication
 */
export const fetchHeatOrLotDetails = async (call) => {
  if (!call) return null;

  const callNo = normalizeCallNo(call);
  if (!callNo) return null;

  const cacheKey = `${callNo}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Check synchronous data first
  const syncData = extractSynchronousData(call);
  if (syncData && syncData.items && syncData.items.length > 0) {
    cache.set(cacheKey, syncData);
    return syncData;
  }

  if (inFlightPromises.has(cacheKey)) {
    return inFlightPromises.get(cacheKey);
  }

  const fetchPromise = (async () => {
    const type = determineCallType(call);
    const headers = getAuthHeaders();

    try {
      if (type === 'RM') {
        // 1. Try RM inspection heat-details
        try {
          const res1 = await axios.get(`${API_BASE_URL}/api/rm-inspection/heat-details/${encodeURIComponent(callNo)}`, {
            headers,
            timeout: 8000
          });
          const list = res1.data?.responseData;
          if (Array.isArray(list) && list.length > 0) {
            const items = list.map(item => ({
              number: (item.heatNo || item.heatNumber || '').toString().trim(),
              tcNo: item.tcNo || item.tcNumber || '-',
              offeredQty: item.offeredQty ?? '-',
              acceptedQty: item.acceptedQty ?? '-',
              rejectedQty: item.rejectedQty ?? '-'
            })).filter(i => Boolean(i.number));

            if (items.length > 0) {
              const result = {
                type: 'RM',
                label: 'Heat No.',
                primary: items[0].number,
                count: items.length,
                items,
                rawString: items.map(i => i.number).join(', ')
              };
              cache.set(cacheKey, result);
              return result;
            }
          }
        } catch (e1) {
          // Fallback to IC number details
        }

        // 2. Try raw-material calls ic-number endpoint
        try {
          const res2 = await axios.get(`${API_BASE_URL}/api/raw-material/calls/ic-number/${encodeURIComponent(callNo)}`, {
            headers,
            timeout: 8000
          });
          const data = res2.data?.responseData;
          if (data) {
            const items = [];
            if (Array.isArray(data.rmHeatQuantities) && data.rmHeatQuantities.length > 0) {
              data.rmHeatQuantities.forEach(h => {
                const num = (h.heatNumber || h.heatNo || '').toString().trim();
                if (num) {
                  items.push({
                    number: num,
                    tcNo: h.tcNumber || h.tcNo || '-',
                    offeredQty: h.offeredQty ?? '-',
                    acceptedQty: h.qtyAccepted ?? h.acceptedQty ?? '-',
                    rejectedQty: h.qtyRejected ?? h.rejectedQty ?? '-'
                  });
                }
              });
            } else if (data.rmInspectionDetails?.heatNumbers) {
              const raw = data.rmInspectionDetails.heatNumbers.toString();
              raw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean).forEach(num => {
                items.push({
                  number: num,
                  tcNo: '-',
                  offeredQty: '-',
                  acceptedQty: '-',
                  rejectedQty: '-'
                });
              });
            }

            if (items.length > 0) {
              const result = {
                type: 'RM',
                label: 'Heat No.',
                primary: items[0].number,
                count: items.length,
                items,
                rawString: items.map(i => i.number).join(', ')
              };
              cache.set(cacheKey, result);
              return result;
            }
          }
        } catch (e2) {
          // ignore
        }
      } else if (type === 'PROCESS') {
        // Process Material inspection call details
        try {
          const res = await axios.get(`${API_BASE_URL}/api/process-material/inspection-call-details/${encodeURIComponent(callNo)}`, {
            headers,
            timeout: 8000
          });
          const data = res.data?.responseData;
          const processDetails = data?.processInspectionDetails || [];
          if (Array.isArray(processDetails) && processDetails.length > 0) {
            const items = processDetails.map(p => ({
              number: (p.lotNumber || p.lotNo || '').toString().trim(),
              lotNo: (p.lotNumber || p.lotNo || '').toString().trim(),
              heatNo: p.heatNumber || p.heatNo || '-',
              offeredQty: p.offeredQty ?? p.declaredLotSize ?? '-',
              acceptedQty: p.qtyAccepted ?? '-',
              rejectedQty: p.qtyRejected ?? '-'
            })).filter(i => Boolean(i.number));

            if (items.length > 0) {
              const result = {
                type: 'PROCESS',
                label: 'Lot No.',
                primary: items[0].number,
                count: items.length,
                items,
                rawString: items.map(i => i.number).join(', ')
              };
              cache.set(cacheKey, result);
              return result;
            }
          }
        } catch (e) {
          // ignore
        }
      } else if (type === 'FINAL') {
        // Final Material inspection call details
        try {
          const res = await axios.get(`${API_BASE_URL}/api/final-material/inspection/${encodeURIComponent(callNo)}`, {
            headers,
            timeout: 8000
          });
          const data = res.data?.responseData;
          const lotDetails = data?.finalLotDetails || [];
          if (Array.isArray(lotDetails) && lotDetails.length > 0) {
            const items = lotDetails.map(l => ({
              number: (l.lotNumber || l.lotNo || '').toString().trim(),
              lotNo: (l.lotNumber || l.lotNo || '').toString().trim(),
              heatNo: l.heatNumber || l.heatNo || '-',
              offeredQty: l.offeredQty ?? '-',
              acceptedQty: l.qtyAccepted ?? '-',
              rejectedQty: l.qtyRejected ?? '-'
            })).filter(i => Boolean(i.number));

            if (items.length > 0) {
              const result = {
                type: 'FINAL',
                label: 'Lot No.',
                primary: items[0].number,
                count: items.length,
                items,
                rawString: items.map(i => i.number).join(', ')
              };
              cache.set(cacheKey, result);
              return result;
            }
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.warn(`Could not load heat/lot details for call ${callNo}:`, err);
    } finally {
      inFlightPromises.delete(cacheKey);
    }

    // Default empty result if nothing could be fetched
    const fallback = {
      type,
      label: type === 'RM' ? 'Heat No.' : 'Lot No.',
      primary: '-',
      count: 0,
      items: [],
      rawString: '-'
    };
    cache.set(cacheKey, fallback);
    return fallback;
  })();

  inFlightPromises.set(cacheKey, fetchPromise);
  return fetchPromise;
};
