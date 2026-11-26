import { getDetailedStatus } from './statusMapper';

describe('getDetailedStatus', () => {
  test('ERC statuses always display both Main Status and Sub Status', () => {
    expect(getDetailedStatus('Created', 'ER-03280001')).toEqual({
      mainStatus: 'Pending',
      subStatus: 'Call Raised',
      combinedText: 'Pending - Call Raised',
    });

    expect(getDetailedStatus('VERIFIED', 'ER-03280001')).toEqual({
      mainStatus: 'Pending',
      subStatus: 'Call Registered',
      combinedText: 'Pending - Call Registered',
    });

    expect(getDetailedStatus('ENTER_SHIFT_DETAILS_AND_START_INSPECTION', 'ER-04210001')).toEqual({
      mainStatus: 'Under Inspection',
      subStatus: 'In Progress',
      combinedText: 'Under Inspection - In Progress',
    });

    expect(getDetailedStatus('INITIATE_INSPECTION', 'ER-04210001')).toEqual({
      mainStatus: 'Under Inspection',
      subStatus: 'Call Initiated',
      combinedText: 'Under Inspection - Call Initiated',
    });

    expect(getDetailedStatus('VERIFY_PO_DETAILS', 'ER-04210001')).toEqual({
      mainStatus: 'Under Inspection',
      subStatus: 'PO Verification',
      combinedText: 'Under Inspection - PO Verification',
    });

    expect(getDetailedStatus('WITHHELD', 'ER-04210001')).toEqual({
      mainStatus: 'Under Inspection',
      subStatus: 'Withheld',
      combinedText: 'Under Inspection - Withheld',
    });

    expect(getDetailedStatus('CANCELLED', 'ER-04210001')).toEqual({
      mainStatus: 'Cancelled',
      subStatus: 'Call Cancelled',
      combinedText: 'Cancelled - Call Cancelled',
    });
  });

  test('Sleeper generic PENDING/COMPLETED statuses resolve sub-status from action and jobStatus', () => {
    expect(
      getDetailedStatus('PENDING', 'SF-26112102', {
        originalStatus: 'PENDING',
        action: 'VERIFY',
        jobStatus: 'RIO_VERIFIED',
      })
    ).toEqual({
      mainStatus: 'Pending',
      subStatus: 'Call Registered',
      combinedText: 'Pending - Call Registered',
    });

    expect(
      getDetailedStatus('PENDING', 'SF-26112101', {
        originalStatus: 'PENDING',
        action: 'MAIN_IE_SCHEDULE_CALL',
        jobStatus: 'SCHEDULED',
      })
    ).toEqual({
      mainStatus: 'Pending',
      subStatus: 'Call Scheduled',
      combinedText: 'Pending - Call Scheduled',
    });

    expect(
      getDetailedStatus('PENDING', 'SL-26112103', {
        originalStatus: 'PENDING',
        action: 'INITIATE_CALL',
        jobStatus: 'INITIATED',
      })
    ).toEqual({
      mainStatus: 'Under Inspection',
      subStatus: 'Call Initiated',
      combinedText: 'Under Inspection - Call Initiated',
    });

    expect(
      getDetailedStatus('PENDING', 'SF-26112104', {
        originalStatus: 'PENDING',
        action: 'PO_VERIFICATION',
        jobStatus: 'PO_VERIFICATION',
      })
    ).toEqual({
      mainStatus: 'Under Inspection',
      subStatus: 'PO Verification',
      combinedText: 'Under Inspection - PO Verification',
    });

    expect(
      getDetailedStatus('PENDING', 'SF-26112105', {
        originalStatus: 'PENDING',
        action: 'PAUSE',
        jobStatus: 'PAUSED',
      })
    ).toEqual({
      mainStatus: 'Under Inspection',
      subStatus: 'Paused for Next Schedule',
      combinedText: 'Under Inspection - Paused for Next Schedule',
    });

    expect(
      getDetailedStatus('PENDING', 'SF-26112106', {
        originalStatus: 'PENDING',
        action: 'IC_ISSUE',
        jobStatus: 'IC_ISSUE',
      })
    ).toEqual({
      mainStatus: 'Completed',
      subStatus: 'IC Issued',
      combinedText: 'Completed - IC Issued',
    });
  });

  test('Railpad Disposed and post-inspection statuses resolve accurately with sub-status', () => {
    expect(
      getDetailedStatus('COMPLETED', 'RP-26110001', {
        originalStatus: 'COMPLETED',
        action: 'FINISH',
        jobStatus: 'COMPLETED',
      })
    ).toEqual({
      mainStatus: 'Completed',
      subStatus: 'IC Issuance Pending',
      combinedText: 'Completed - IC Issuance Pending',
    });

    expect(
      getDetailedStatus('COMPLETED', 'RP-26110002', {
        originalStatus: 'COMPLETED',
        action: 'DSC_SIGN_IC',
        jobStatus: 'IC_SIGNED',
      })
    ).toEqual({
      mainStatus: 'Completed',
      subStatus: 'E-Signed',
      combinedText: 'Completed - E-Signed',
    });

    expect(
      getDetailedStatus('COMPLETED', 'RP-26110003', {
        originalStatus: 'COMPLETED',
        action: 'SEND_CALL_TO_IBS',
        jobStatus: 'COMPLETED',
      })
    ).toEqual({
      mainStatus: 'Closed',
      subStatus: 'Sent to IBS',
      combinedText: 'Closed - Sent to IBS',
    });
  });

  test('Preserves workflow jobStatus when Call Desk reassigns an IE and handles 1-arg callers', () => {
    expect(
      getDetailedStatus('PENDING', 'SF-26112107', {
        originalStatus: 'PENDING',
        action: 'REMAP_IE',
        jobStatus: 'SCHEDULED',
      })
    ).toEqual({
      mainStatus: 'Pending',
      subStatus: 'Call Scheduled',
      combinedText: 'Pending - Call Scheduled',
    });

    expect(getDetailedStatus('INSPECTION_COMPLETE_CONFIRM')).toEqual({
      mainStatus: 'Completed',
      subStatus: 'IC Issuance Pending',
      combinedText: 'Completed - IC Issuance Pending',
    });
  });
});
