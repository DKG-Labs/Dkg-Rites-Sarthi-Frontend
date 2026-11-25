import { useCallback, useEffect, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { apiCall } from './CommonFunctions';

/**
 * Heats of the IE's current SMS duty (date + shift + SMS shop), from /sms/getHeatSummary.
 * Used by the SMS Shift Reports (Heat List, Check List, Verification) instead of sample data.
 *
 * Returns { info, rows, loading, error, reload }.
 *   info: shift info strip of the duty (same shape as the other SMS duty screens)
 *   rows: SmsHeatReportDto list of this duty's heats, each with a `key`
 */
export default function useSmsShiftHeats() {
  const { token } = useSelector((state) => state.auth);
  const duty = useSelector((state) => ({
    startTime: state?.smsDuty?.startTime,
    date: state?.smsDuty?.date,          // dd/MM/yyyy
    shift: state?.smsDuty?.shift,
    sms: state?.smsDuty?.sms,
    railGrade: state?.smsDuty?.railGrade,
  }), shallowEqual);

  const info = {
    StartTime: duty.startTime,
    Date: duty.date,
    Shift: duty.shift,
    Sms: duty.sms,
    RailGrade: duty.railGrade,
  };

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!duty.date || !duty.sms) {
      setRows([]);
      setError('No SMS duty is running. Start a duty to see its shift reports.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await apiCall('POST', '/sms/getHeatSummary', token, {
        startDate: duty.date,
        endDate: duty.date,
      });
      const all = data?.responseData || [];
      const shift = String(duty.shift || '').trim().toUpperCase();
      const sms = String(duty.sms || '').replace(/\s+/g, '').toUpperCase();
      // the endpoint returns the whole day for every SMS shop: keep this duty's shop and shift
      const mine = all.filter((r) => {
        const sameSms = String(r.smsNumber || '').replace(/\s+/g, '').toUpperCase() === sms;
        const rowShift = String(r.dateAndShiftOfCasting || '').trim().split(/\s+/).pop().toUpperCase();
        return sameSms && (!shift || rowShift === shift);
      });
      setRows(mine.map((r, i) => ({ ...r, key: `${r.heatNo}-${i}`, serialNumber: i + 1 })));
    } catch (e) {
      setRows([]);
      setError(e?.message || 'Could not load the shift heats.');
    } finally {
      setLoading(false);
    }
  }, [token, duty.date, duty.shift, duty.sms]);

  useEffect(() => { reload(); }, [reload]);

  return { info, rows, loading, error, reload };
}

/** "Yes" / "No" / "-" for the Boolean (or "1"/"0"/"true") flags of the heat report. */
export const yesNo = (v) => {
  if (v === null || v === undefined || v === '') return '-';
  const s = String(v).toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' ? 'Yes' : s === 'false' || s === '0' || s === 'no' ? 'No' : String(v);
};

/** Number or "-" */
export const num = (v) => (v === null || v === undefined || v === '' ? '-' : v);
