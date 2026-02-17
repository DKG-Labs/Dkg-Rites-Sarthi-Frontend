import { useState, useEffect } from 'react';
import { MOCK_PO_DATA } from '../data/mockData';
import { formatDate, getProductTypeDisplayName } from '../utils/helpers';
import {
  saveSectionA,
  approveSectionA,
  rejectSectionA,
  getSectionAByCallNo,
  saveSectionB,
  approveSectionB,
  rejectSectionB,
  saveSectionCBatch,
  approveAllSectionC,
  rejectAllSectionC
} from '../services/inspectionSectionService';
import { performTransitionAction } from '../services/workflowService';
import { getStoredUser } from '../services/authService';
import { fetchPoDataForSections } from '../services/poDataService';
import { fetchProcessInitiationData } from '../services/processInitiationDataService';
import { getFinalInspectionByCallNo } from '../services/finalInspectionService';
import '../styles/inspectionInitiationPage.css';



const InspectionInitiationFormContent = ({ call, formData, onFormDataChange, showSectionA = true, showSectionB = true }) => {
  // State for fetched/mock data
  const [fetchedPoData, setFetchedPoData] = useState(null);
  const [fetchedSubPoData, setFetchedSubPoData] = useState(null);
  const [subPoList, setSubPoList] = useState([]); // Multiple sub POs from database
  const [finalDetailsState, setFinalDetailsState] = useState(null);
  const [finalMappings, setFinalMappings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromDatabase, setIsFromDatabase] = useState(false);
  const [currentCallId, setCurrentCallId] = useState(call.id); // Track which call we have data for

  // Reset data states when call changes (switching tabs in multi-tab mode)
  useEffect(() => {
    if (call.id !== currentCallId) {
      setFetchedPoData(null);
      setFetchedSubPoData(null);
      setSubPoList([]);
      setIsLoading(true);
      setIsFromDatabase(false);
      setCurrentCallId(call.id);
    }
  }, [call.id, currentCallId]);

  // Use fetched data if available, otherwise fallback to mock data
  const mockPoData = MOCK_PO_DATA[call.po_no] || {};
  const poData = fetchedPoData || mockPoData;

  // Sub PO data fallback - use fetched data, then mock data fields, then hardcoded defaults
  const subPoData = fetchedSubPoData || {
    raw_material_name: mockPoData.raw_material_name || mockPoData.product_name || 'Steel Bars Grade 45C8',
    sub_po_no: mockPoData.sub_po_no || 'SUB-PO-2025-001',
    sub_po_date: mockPoData.sub_po_date || '2025-10-18',
    contractor: mockPoData.contractor || 'Premium Materials Inc',
    manufacturer: mockPoData.manufacturer || 'Steel Works Ltd',
    place_of_inspection: mockPoData.place_of_inspection || call.place_of_inspection || 'Vendor Site',
    bpo: mockPoData.bpo || 'BPO-002',
    consignee: mockPoData.consignee || 'Central Warehouse'
  };

  const [sectionAExpanded, setSectionAExpanded] = useState(true);
  const [sectionBExpanded, setSectionBExpanded] = useState(false);
  const [sectionCExpanded, setSectionCExpanded] = useState(false);

  /* State for API operations */
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Check if this is a Process inspection
  const isProcessInspection = call.product_type?.includes('Process');

  // Fetch data from API if api_id exists, otherwise use mock data
  // Runs when call changes (switching tabs)
  useEffect(() => {
    // Skip if data already loaded for current call
    if (fetchedPoData && currentCallId === call.id) return;

    const loadData = async () => {
      setIsLoading(true);

      // Check if this is Process material or Final Product - fetch from database
      // Use product_type from API (values: "Raw Material", "Process", "Final")
      const productType = call.product_type || '';
      const isProcess = productType === 'Process' || productType.includes('Process');
      const isFinalProduct = productType === 'Final' || productType.includes('Final');

      console.log('🔍 Call object inspection:');
      console.log('  - call.product_type:', call.product_type);
      console.log('  - Derived productType:', productType);
      console.log('  - isProcess:', isProcess);
      console.log('  - isFinalProduct:', isFinalProduct);

      // PROCESS MATERIAL: Fetch from database using call number
      if (isProcess && call.call_no) {
        try {
          console.log('🏭 Process Material: Fetching from database for call:', call.call_no);
          const processData = await fetchProcessInitiationData(call.call_no);

          if (processData) {
            console.log('✅ Process data fetched from database:', processData);
            setIsFromDatabase(true);

            // Transform database response to match expected format
            const transformedPoData = {
              po_no: processData.poNo,
              po_date: processData.poDate,
              po_amend_no: processData.amendmentNo || 'N/A',
              po_amend_dates: processData.amendmentDate || 'N/A',
              product_name: processData.poDescription || call.product_name,
              vendor_name: processData.vendorName || processData.companyName,
              vendor_code: processData.vendorCode,
              consignee: processData.consignee,
              po_qty: processData.poQty,
              unit: processData.poUnit || 'Nos',
              orig_dp: processData.deliveryDate,
              purchasing_authority: processData.purchasingAuthority,
              bpo: processData.billPayingOfficer,

              // Section B: Inspection Call Details
              call_no: processData.callNo,
              call_date: processData.callDate,
              desired_inspection_date: processData.desiredInspectionDate,
              type_of_call: processData.typeOfCall,
              type_of_erc: processData.typeOfErc, // Type of ERC from inspection_calls.erc_type
              place_of_inspection: processData.placeOfInspection,
              company_name: processData.companyName,
              unit_name: processData.unitName,
              unit_address: processData.unitAddress,
              rm_ic_number: processData.rmIcNumber, // RM IC number from process_inspection_details
              heat_number: processData.heatNumber, // Heat number from process_inspection_details
              total_offered_qty: processData.offeredQty, // CALL QTY from process_inspection_details.offered_qty

              // Section C: RM IC Heat Information
              rm_ic_heat_info: processData.rmIcHeatInfoList || [],

              // Multiple Lots Support
              lotDetailsList: processData.lotDetailsList || [],
              rlyCd: processData.rlyCd,
              poSerialNo: processData.poSerialNo,
              rly_po_no: processData.rlyPoNo,
              rly_po_no_serial: processData.rlyPoNoSerial,
              vendorDetails: processData.vendorDetails,
              totalOfferedQtyMt: processData.totalOfferedQtyMt,
              vendorName: processData.vendorName || processData.companyName,
              vendor_address: processData.vendorDetails || processData.unitAddress,
              po_sr_qty: processData.poSrQty
            };

            setFetchedPoData(transformedPoData);

            // Debug logging for Process data
            console.log('🔍 Process Inspection Data Summary:');
            console.log('  - RM IC Number:', processData.rmIcNumber);
            console.log('  - Heat Number:', processData.heatNumber);
            console.log('  - Offered Qty (CALL QTY):', processData.offeredQty);
            console.log('  - Heat Info Count:', processData.rmIcHeatInfoList?.length || 0);
            console.log('  - Lot Details Count:', processData.lotDetailsList?.length || 0);
            console.log('  - Lot Details:', processData.lotDetailsList);

            // Transform inventory data to subPoList for Section C
            if (processData.rmIcHeatInfoList && processData.rmIcHeatInfoList.length > 0) {
              const transformedSubPoList = processData.rmIcHeatInfoList.map(heat => ({
                raw_material_name: heat.rawMaterialName || 'N/A',
                grade_spec: heat.gradeSpec || 'N/A',
                heat_no: heat.heatNumber || 'N/A',
                manufacturer: heat.manufacturer || 'N/A',
                manufacturer_steel_bars: heat.manufacturer || 'N/A',
                tc_no: heat.tcNumber || 'N/A',
                tc_date: heat.tcDate || 'N/A',
                sub_po_no: heat.subPoNumber || 'N/A',
                sub_po_date: heat.subPoDate || 'N/A',
                invoice_no: heat.invoiceNumber || 'N/A',
                invoice_date: heat.invoiceDate || 'N/A',
                sub_po_qty: heat.subPoQty || heat.tcQuantity || 'N/A',
                qty: heat.qtyAccepted || 0,
                unit: heat.unit || 'MT',
                place_of_inspection: processData.placeOfInspection || call.place_of_inspection
              }));
              setSubPoList(transformedSubPoList);
              console.log(`✅ Loaded ${transformedSubPoList.length} heat details from inventory for Section C`);
            }

            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('❌ Error fetching Process data from database:', error);
          // Fall through to mock data
        }
      }

      // FINAL PRODUCT: Fetch composite data from final-material endpoint if available
      if (isFinalProduct && call.call_no) {
        try {
          console.log('🏭 Final Product: Fetching final initiation data for call:', call.call_no);
          const finalData = await getFinalInspectionByCallNo(call.call_no);

          if (finalData) {
            setIsFromDatabase(true);

            const ic = finalData.inspectionCall || finalData.inspection_call || {};
            const fd = finalData.finalInspectionDetails || finalData.final_inspection_details || null;
            const lots = finalData.finalLotDetails || finalData.final_lot_details || finalData.finalLotDetails || [];
            const mappings = finalData.finalProcessMappings || finalData.final_process_mappings || [];
            const poDataFromDb = finalData.poData || null; // NEW: PO data from database

            // If PO data is available from database, use it (similar to Raw Material)
            let transformedPoData;
            if (poDataFromDb) {
              console.log('✅ Using PO data from database for Final Product:', poDataFromDb);
              transformedPoData = {
                po_no: poDataFromDb.poNo,
                rlyCd: poDataFromDb.rlyCd,
                poSerialNo: poDataFromDb.poSerialNo,
                vendorDetails: poDataFromDb.vendorDetails,
                totalOfferedQtyMt: poDataFromDb.totalOfferedQtyMt,
                vendorName: poDataFromDb.vendorName,
                rly_po_no: poDataFromDb.rlyPoNo,
                po_serial_no: poDataFromDb.poSerialNo,
                rly_po_no_serial: poDataFromDb.rlyPoNoSerial,
                po_date: poDataFromDb.poDate,
                po_amend_no: poDataFromDb.maNo || 'N/A',
                po_amend_dates: poDataFromDb.maDate || 'N/A',
                product_name: poDataFromDb.itemDesc || call.product_name,
                pl_no: poDataFromDb.plNo || 'N/A',
                vendor_name: poDataFromDb.vendorName,
                vendor_code: poDataFromDb.vendorCode,
                vendor_address: poDataFromDb.vendorDetails,
                place_of_inspection: poDataFromDb.placeOfInspection || poDataFromDb.inspPlace || ic.placeOfInspection || call.place_of_inspection,
                manufacturer: poDataFromDb.vendorName,
                consignee_rly: poDataFromDb.rlyCd,
                consignee: poDataFromDb.consignee,
                po_qty: poDataFromDb.poQty,
                unit: poDataFromDb.unit || 'Nos',
                orig_dp: poDataFromDb.deliveryDate,
                ext_dp: poDataFromDb.extendedDeliveryDate || 'N/A',
                purchasing_authority: poDataFromDb.purchasingAuthority,
                bpo: poDataFromDb.billPayingOfficer,
                cond_title: poDataFromDb.condTitle,
                cond_text: poDataFromDb.condText,
                po_cond_sr_no: poDataFromDb.poCondSrNo,
                erc_type: poDataFromDb.ercType || ic.ercType,
                total_offered_qty_mt: poDataFromDb.totalOfferedQtyMt,

                // Section B fields from inspection call
                call_no: ic.icNumber || ic.ic_number || call.call_no,
                call_date: ic.createdAt || ic.callDate || call.call_date,
                desired_inspection_date: ic.desiredInspectionDate || call.desired_inspection_date,
                type_of_call: ic.typeOfCall || call.type_of_call,
                type_of_erc: ic.ercType || call.erc_type,
                company_name: ic.companyName || call.company_name,
                unit_name: ic.unitName || call.unit_name,
                unit_address: ic.unitAddress || call.unit_address,
                rm_ic_number: fd?.rmIcNumber || null,
                process_ic_number: fd?.processIcNumber || null,
                total_lots: fd?.totalLots || null,
                total_offered_qty: fd?.totalOfferedQty || null
              };
            } else {
              // Fallback to inspection call data if no PO data
              console.log('⚠️ No PO data from database, using inspection call data');
              transformedPoData = {
                po_no: ic.poNo || ic.po_no || call.po_no,
                rly_po_no: ic.poNo || call.po_no,
                rlyCd: ic.rlyCd || call.rly_cd,
                poSerialNo: ic.poSerialNo || call.po_serial_no,
                vendorDetails: ic.vendorDetails || ic.vendor_details || call.vendor_details,
                vendorName: ic.companyName || fd?.companyName || call.vendor_name,
                po_date: ic.poDate || ic.po_date || call.po_date,
                po_amend_no: ic.poAmendNo || ic.maNo || 'N/A',
                product_name: fd?.companyName || call.product_name || ic.companyName,
                vendor_name: ic.companyName || fd?.companyName || call.vendor_name,
                vendor_code: ic.vendorId || call.vendor_id,
                consignee: ic.unitName || fd?.unitName || call.consignee,
                po_qty: fd?.totalOfferedQty || ic.poQty || call.po_qty,
                unit: fd?.unitName || 'Nos',
                place_of_inspection: ic.unitAddress || fd?.unitAddress || call.place_of_inspection,

                // Section B fields
                call_no: ic.icNumber || ic.ic_number || call.call_no,
                call_date: ic.createdAt || ic.callDate || call.call_date,
                desired_inspection_date: ic.desiredInspectionDate || call.desired_inspection_date,
                type_of_call: ic.typeOfCall || call.type_of_call,
                type_of_erc: ic.ercType || call.erc_type,
                company_name: ic.companyName || call.company_name,
                unit_name: ic.unitName || call.unit_name,
                unit_address: ic.unitAddress || call.unit_address,
                rm_ic_number: fd?.rmIcNumber || null,
                process_ic_number: fd?.processIcNumber || null,
                total_lots: fd?.totalLots || null,
                total_offered_qty: fd?.totalOfferedQty || null
              };
            }

            setFetchedPoData(transformedPoData);

            // store finalDetails and mappings for later rendering of RM/Process IC numbers
            setFinalDetailsState(fd);
            setFinalMappings(Array.isArray(mappings) ? mappings : []);

            // Debug logging
            // console.log('🔍 Final Product Data Summary:');
            // console.log('  - RM IC Number:', fd?.rmIcNumber);
            // console.log('  - Process IC Number:', fd?.processIcNumber);
            // console.log('  - Total Lots:', fd?.totalLots);
            // console.log('  - Total Offered Qty:', fd?.totalOfferedQty);

            // If a saved Section A exists for this call, prefer those values (same behaviour as Raw Material)
            try {
              const savedSectionA = await getSectionAByCallNo(call.call_no);
              if (savedSectionA) {
                const sa = savedSectionA;
                const merged = {
                  ...transformedPoData,
                  po_no: sa.poNo || transformedPoData.po_no,
                  po_date: sa.poDate || transformedPoData.po_date,
                  po_amend_no: sa.maNo || transformedPoData.po_amend_no,
                  po_amend_dates: sa.maDate || transformedPoData.po_amend_dates,
                  vendor_name: sa.vendorName || transformedPoData.vendor_name,
                  place_of_inspection: sa.placeOfInspection || transformedPoData.place_of_inspection,
                  po_qty: sa.poQty || transformedPoData.po_qty,
                  purchasing_authority: sa.purchasingAuthority || transformedPoData.purchasing_authority,
                  bpo: sa.billPayingOfficer || transformedPoData.bpo
                };
                setFetchedPoData(merged);
              }
            } catch (e) {
              // No saved Section A found or API error - continue with transformed final data
              // console.debug('No saved Section A for final call or fetch failed:', e?.message || e);
            }

            if (lots && Array.isArray(lots) && lots.length > 0) {
              const transformedSubPoList = lots.map(lot => ({
                raw_material_name: lot.rawMaterialName || lot.manufacturer || 'N/A',
                grade_spec: lot.grade || 'N/A',
                heat_no: lot.heatNumber || lot.heat_number || lot.heatNumber,
                manufacturer: lot.manufacturer || 'N/A',
                tc_no: lot.tcNumber || lot.tc_no || 'N/A',
                tc_date: lot.tcDate || lot.tc_date || 'N/A',
                sub_po_no: lot.subPoNumber || lot.sub_po_no || 'N/A',
                sub_po_date: lot.subPoDate || lot.sub_po_date || 'N/A',
                invoice_no: lot.invoiceNo || lot.invoice_no || 'N/A',
                invoice_date: lot.invoiceDate || lot.invoice_date || 'N/A',
                qty: lot.offeredQty || lot.offered_qty || 0,
                unit: 'Nos',
                place_of_inspection: transformedPoData.place_of_inspection
              }));
              setSubPoList(transformedSubPoList);
              // console.log(`✅ Loaded ${transformedSubPoList.length} final lot details for Section B/C`);
            }

            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('❌ Error fetching Final initiation data from API:', error);
          // Fall through to mock fallback
        }
      }

      // PRIORITY 1: Try to fetch PO data from database tables (po_header, po_item, po_ma_header, po_ma_detail)
      // This runs FIRST for Raw Material calls with a PO number
      if (call.po_no) {
        try {
          console.log('🔍 Fetching PO data from database for PO:', call.po_no, 'Request ID:', call.call_no);
          const poDataFromDb = await fetchPoDataForSections(call.po_no, call.call_no);

          if (poDataFromDb) {
            console.log('✅ PO data fetched from database:', poDataFromDb);
            setIsFromDatabase(true);

            // Transform database response to match expected format
            const transformedPoData = {
              po_no: poDataFromDb.poNo,
              rly_po_no: poDataFromDb.rlyPoNo, // NEW: RLY/PO_NO format
              po_serial_no: poDataFromDb.poSerialNo, // NEW: PO Serial Number
              rly_po_no_serial: poDataFromDb.rlyPoNoSerial, // NEW: RLY/PO_NO/PO_SR format
              po_date: poDataFromDb.poDate,
              po_amend_no: poDataFromDb.maNo || 'N/A',
              po_amend_dates: poDataFromDb.maDate || 'N/A',
              product_name: poDataFromDb.itemDesc || call.product_name,
              pl_no: poDataFromDb.plNo || 'N/A',
              vendor_name: poDataFromDb.vendorName,
              vendor_code: poDataFromDb.vendorCode,
              vendor_address: poDataFromDb.vendorDetails,
              place_of_inspection: poDataFromDb.placeOfInspection || poDataFromDb.inspPlace || call.place_of_inspection,
              manufacturer: poDataFromDb.vendorName,
              consignee_rly: poDataFromDb.rlyCd,
              consignee: poDataFromDb.consignee,
              po_qty: poDataFromDb.poQty,
              unit: poDataFromDb.unit || 'Nos',
              orig_dp: poDataFromDb.deliveryDate,
              ext_dp: poDataFromDb.extendedDeliveryDate || 'N/A',
              purchasing_authority: poDataFromDb.purchasingAuthority,
              bpo: poDataFromDb.billPayingOfficer,
              cond_title: poDataFromDb.condTitle,
              cond_text: poDataFromDb.condText,
              po_cond_sr_no: poDataFromDb.poCondSrNo,
              erc_type: poDataFromDb.ercType, // NEW: Type of ERC from inspection_calls
              total_offered_qty_mt: poDataFromDb.totalOfferedQtyMt, // NEW: Call Qty from rm_inspection_details
              rlyCd: poDataFromDb.rlyCd,
              poSerialNo: poDataFromDb.poSerialNo,
              vendorDetails: poDataFromDb.vendorDetails,
              totalOfferedQtyMt: poDataFromDb.totalOfferedQtyMt,
              vendorName: poDataFromDb.vendorName,
              po_sr_qty: poDataFromDb.poSrQty
            };

            setFetchedPoData(transformedPoData);

            // Transform RM Heat Details to subPoList for Section C
            if (poDataFromDb.rmHeatDetails && poDataFromDb.rmHeatDetails.length > 0) {
              const transformedSubPoList = poDataFromDb.rmHeatDetails.map(heat => ({
                raw_material_name: heat.rawMaterialName,
                grade_spec: heat.grade,
                heat_no: heat.heatNumber,
                manufacturer: heat.manufacturer,
                manufacturer_steel_bars: heat.manufacturer,
                tc_no: heat.tcNumber,
                tc_date: heat.tcDate,
                sub_po_no: heat.subPoNumber,
                sub_po_date: heat.subPoDate,
                sub_po_qty: heat.subPoQty,
                invoice_no: heat.invoiceNumber,
                invoice_date: heat.invoiceDate,
                qty: heat.offeredQty,
                unit: 'MT',
                place_of_inspection: transformedPoData.place_of_inspection
              }));
              setSubPoList(transformedSubPoList);
              console.log(`✅ Loaded ${transformedSubPoList.length} RM heat details for Section C`);
            }

            setIsLoading(false);
            console.log('✅ Section A, B, C data loaded from database');
            return; // Exit early - we have the data we need
          }
        } catch (error) {
          console.error('❌ Error fetching PO data from database:', error);
          // Continue to fallback
        }
      }

      // PRIORITY 2: Fallback to mock data
      const mockPo = MOCK_PO_DATA[call.po_no] || {};

      if (Object.keys(mockPo).length > 0) {
        setFetchedPoData(mockPo);

        if (mockPo.sub_po_no) {
          const mockSubPoData = {
            raw_material_name: mockPo.product_name,
            sub_po_no: mockPo.sub_po_no,
            sub_po_date: mockPo.sub_po_date,
            contractor: mockPo.contractor,
            manufacturer: mockPo.manufacturer,
            place_of_inspection: mockPo.place_of_inspection,
            bpo: mockPo.bpo,
            consignee: mockPo.consignee || ''
          };
          setFetchedSubPoData(mockSubPoData);
        }
      }

      setIsLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.id, call.po_no, call.api_id, isProcessInspection, currentCallId]);

  // Auto-select current inspection call into first line and auto-fill dependent fields
  // Runs only once on mount - uses data from call object (from API)
  useEffect(() => {
    try {
      if (!formData.productionLines || formData.productionLines.length === 0) return;
      const first = formData.productionLines[0] || {};
      const defaultCallNo = call?.call_no;
      if (!defaultCallNo) return;
      if (!first.icNumber) {
        // Use data from the call object directly (comes from API)
        const updated = [...formData.productionLines];
        updated[0] = {
          ...first,
          icNumber: defaultCallNo,
          poNumber: call.po_no || '',
          rawMaterialICs: call.rm_heat_tc_mapping ? call.rm_heat_tc_mapping.map(m => m.icNumber || m.subPoNumber) : [],
          productType: call.product_type || ''
        };
        onFormDataChange({ productionLines: updated });
      }
    } catch (e) {
      // no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.call_no]);


  /* Convert date from dd/MM/yyyy to yyyy-MM-dd format for backend */
  const convertDateToISO = (dateStr) => {
    if (!dateStr) return null;

    // If already in ISO format (yyyy-MM-dd), return as is
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr.split(' ')[0].split('T')[0];
    }

    // Convert from dd/MM/yyyy to yyyy-MM-dd
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }

    return null;
  };

  /* Build Section A payload for API */
  const buildSectionAPayload = () => {
    const currentUser = getStoredUser();
    const userId = currentUser?.userId || currentUser?.username || 'system';

    return {
      inspectionCallNo: call.call_no,
      poNo: poData.rly_po_no || poData.po_no || call.po_no,
      poDate: convertDateToISO(poData.po_date || call.po_date),
      poQty: poData.po_qty || call.po_qty,
      placeOfInspection: poData.place_of_inspection || call.place_of_inspection,
      vendorName: poData.vendor_name || call.vendor_name,
      maNo: poData.po_amend_no || null,
      maDate: poData.po_amend_dates || null,
      purchasingAuthority: poData.purchasing_authority || 'Manager, Procurement',
      billPayingOfficer: poData.bpo || 'BPO-001',
      status: 'approved',
      createdBy: userId
    };
  };

  /* Build Section B payload for API */
  const buildSectionBPayload = () => {
    // Extract date only (YYYY-MM-DD) - backend expects LocalDate, not datetime
    const extractDateOnly = (dateStr) => {
      if (!dateStr) return null;
      // Handle datetime format "2025-12-25 09:11:48" -> "2025-12-25"
      return dateStr.split(' ')[0].split('T')[0];
    };

    const currentUser = getStoredUser();
    const userId = currentUser?.userId || currentUser?.username || 'system';

    // Determine stage of inspection from product_type
    const stageOfInspection = (call.product_type === 'Process' || call.product_type?.includes('Process')) ? 'Process Material' :
      (call.product_type === 'Final' || call.product_type?.includes('Final')) ? 'Final' :
        'Raw Material';

    return {
      inspectionCallNo: call.call_no,
      inspectionCallDate: extractDateOnly(call.call_date || call.requested_date),
      inspectionDesiredDate: extractDateOnly(call.desired_inspection_date || call.requested_date),
      rlyPoNoSr: poData.rly_po_no_serial || `${call.po_no || ''} / ${call.po_sr || ''}`,
      itemDesc: poData.product_name || call.product_name,
      productType: call.product_type,
      typeOfErc: poData.erc_type || call.erc_type || null, // Type of ERC: MK-III, MK-V, etc.
      poQty: poData.po_qty || call.po_qty,
      unit: poData.unit || 'Nos',
      consigneeRly: poData.consignee_rly || '',
      consignee: poData.consignee || call.consignee,
      origDp: convertDateToISO(poData.orig_dp || call.delivery_period),
      extDp: convertDateToISO(poData.ext_dp || ''),
      origDpStart: convertDateToISO(poData.orig_dp_start || poData.po_date),
      stageOfInspection: stageOfInspection,
      callQty: poData.total_offered_qty || call.call_qty,
      placeOfInspection: call.place_of_inspection,
      rmIcNumber: call.rm_ic_number || poData.rm_ic_number || '',
      processIcNumber: call.process_ic_number || poData.process_ic_number || '',
      remarks: call.remarks || poData.remarks || '',
      status: 'approved',
      createdBy: userId
    };
  };

  /* Build Section C payload for API (batch) */
  const buildSectionCPayload = () => {
    const dataList = subPoList.length > 0 ? subPoList : [subPoData];
    console.log('🔍 [buildSectionCPayload] Using data source:', subPoList.length > 0 ? 'subPoList' : 'subPoData');
    console.log('🔍 [buildSectionCPayload] Data count:', dataList.length);
    console.log('🔍 [buildSectionCPayload] Raw data:', dataList);

    const currentUser = getStoredUser();
    const userId = currentUser?.userId || currentUser?.username || 'system';

    const payload = dataList.map(item => ({
      inspectionCallNo: call.call_no,
      rawMaterialName: item.raw_material_name || item.product_name || '',
      gradeSpec: item.grade_spec || item.grade || '',
      heatNo: item.heat_no || '',
      manufacturerSteelBars: item.manufacturer || item.manufacturer_steel_bars || '',
      tcNo: item.tc_no || '',
      tcDate: convertDateToISO(item.tc_date) || null,
      subPoNo: item.sub_po_no || '',
      subPoDate: convertDateToISO(item.sub_po_date) || null,
      invoiceNo: item.invoice_no || '',
      invoiceDate: convertDateToISO(item.invoice_date) || null,
      subPoQty: item.sub_po_qty || item.qty || null,
      unit: item.unit || 'MT',
      placeOfInspection: item.place_of_inspection || call.place_of_inspection,
      status: 'approved',
      createdBy: userId
    }));

    console.log('🔍 [buildSectionCPayload] Final payload:', payload);
    return payload;
  };

  /* Handle Section A OK/Not OK - Azure API Integration */
  const handleSectionAApprove = async () => {
    console.log('🟢 [Section A] OK Button Clicked');
    setIsSaving(true);
    setSaveError(null);
    try {
      // Check if this is Process or Final Product - skip API calls
      const productType = call.product_type || '';
      const isProcessOrFinal =
        productType === 'PROCESS_MATERIAL' ||
        productType === 'FINAL_PRODUCT' ||
        productType.includes('Process') ||
        productType.includes('Final');

      console.log('📋 [Section A] Product Type:', productType);
      console.log('📋 [Section A] Is Process/Final?', isProcessOrFinal);

      // Call workflow API for both Raw Material and Process/Final Product
      console.log('🔧 Calling Section A workflow API...');
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || 0;

      // Call Azure API for PO verification - OK action
      const actionData = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: call.call_no,
        action: 'VERIFY_PO_DETAILS',
        remarks: 'PO details verified - Section A OK',
        actionBy: userId,
        pincode: '560001'
      };

      console.log('📤 [Section A] Calling performTransitionAction...');
      await performTransitionAction(actionData);
      console.log('✅ [Section A] performTransitionAction completed');

      // Persist Section A to backend and mark approved
      try {
        const payload = buildSectionAPayload();
        console.log('📤 [Section A] Calling saveSectionA with payload:', payload);
        await saveSectionA(payload);
        console.log('✅ [Section A] saveSectionA completed');

        console.log('📤 [Section A] Calling approveSectionA...');
        await approveSectionA(call.call_no);
        console.log('✅ [Section A] approveSectionA completed');
      } catch (e) {
        console.error('❌ [Section A] save/approve failed:', e);
      }

      console.log('🔔 [Section A] About to call onFormDataChange with sectionAVerified: true');
      console.log('🔔 [Section A] onFormDataChange function:', onFormDataChange);
      onFormDataChange({ sectionAVerified: true, sectionAStatus: 'approved' });
      console.log('🔔 [Section A] onFormDataChange called successfully');
      if (showSectionB) {
        setSectionBExpanded(true);
      }
    } catch (error) {
      console.error('❌ [Section A] Error saving Section A:', error);
      setSaveError(error.message || 'Failed to save Section A. Please try again.');
    } finally {
      setIsSaving(false);
      console.log('🏁 [Section A] handleSectionAApprove completed');
    }
  };

  const handleSectionAReject = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // Call workflow API for both Raw Material and Process/Final Product
      console.log('🔧 Calling Section A workflow API for rejection...');
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || 0;

      // Call Azure API for correction request - Not OK action
      const actionData = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: call.call_no,
        action: 'REQUEST_CORRECTION_TO_CM',
        remarks: 'PO details need correction - Section A Not OK',
        actionBy: userId,
        pincode: '560001'
      };

      await performTransitionAction(actionData);

      // Persist Section A rejection to backend
      try {
        const payload = { ...buildSectionAPayload(), status: 'rejected' };
        await saveSectionA(payload);
        await rejectSectionA(call.call_no, 'Rejected by IE');
      } catch (e) {
        console.warn('Section A reject save failed:', e);
      }

      onFormDataChange({ sectionAVerified: false, sectionAStatus: 'rejected' });
      setSectionBExpanded(false);
    } catch (error) {
      console.error('Error rejecting Section A:', error);
      setSaveError(error.message || 'Failed to reject Section A. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /* Handle Section B OK/Not OK - Azure API Integration */
  const handleSectionBApprove = async () => {
    console.log('🟢 [Section B] OK Button Clicked');
    setIsSaving(true);
    setSaveError(null);
    try {
      // Call workflow API for both Raw Material and Process/Final Product
      console.log('� Calling Section B workflow API...');
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || 0;

      // Call Azure API for call details verification - OK action
      const actionData = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: call.call_no,
        action: 'VERIFY_PO_DETAILS',
        remarks: 'Inspection call details verified - Section B OK',
        actionBy: userId,
        pincode: '560001'
      };

      console.log('📤 [Section B] Calling performTransitionAction...');
      await performTransitionAction(actionData);
      console.log('✅ [Section B] performTransitionAction completed');

      // Persist Section B to backend and mark approved
      try {
        const payload = buildSectionBPayload();
        console.log('📤 [Section B] Calling saveSectionB with payload:', payload);
        await saveSectionB(payload);
        console.log('✅ [Section B] saveSectionB completed');

        console.log('📤 [Section B] Calling approveSectionB...');
        await approveSectionB(call.call_no);
        console.log('✅ [Section B] approveSectionB completed');
      } catch (e) {
        console.error('❌ [Section B] save/approve failed:', e);
      }

      console.log('🔔 [Section B] About to call onFormDataChange with sectionBVerified: true');
      console.log('🔔 [Section B] onFormDataChange function:', onFormDataChange);
      onFormDataChange({ sectionBVerified: true, sectionBStatus: 'approved' });
      console.log('🔔 [Section B] onFormDataChange called successfully');

      // Auto-expand Section C when Section B is approved (for Raw Material only)
      const productType = call?.product_type || '';
      const isSectionCRequired = productType === 'Raw Material' || productType.includes('Raw');
      if (isSectionCRequired) {
        setSectionCExpanded(true);
      }
    } catch (error) {
      console.error('Error saving Section B:', error);
      setSaveError(error.message || 'Failed to save Section B. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionBReject = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // Call workflow API for both Raw Material and Process/Final Product
      console.log('🔧 Calling Section B workflow API for rejection...');
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || 0;

      // Call Azure API for correction request - Not OK action
      const actionData = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: call.call_no,
        action: 'REQUEST_CORRECTION_TO_CM',
        remarks: 'Inspection call details need correction - Section B Not OK',
        actionBy: userId,
        pincode: '560001'
      };

      await performTransitionAction(actionData);

      // Persist Section B rejection to backend
      try {
        const payload = { ...buildSectionBPayload(), status: 'rejected' };
        await saveSectionB(payload);
        await rejectSectionB(call.call_no, 'Rejected by IE');
      } catch (e) {
        console.warn('Section B reject save failed:', e);
      }

      onFormDataChange({ sectionBVerified: false, sectionBStatus: 'rejected' });
      // COMMENTED OUT: Section C not needed for Process Inspection
      // setSectionCExpanded(false);
    } catch (error) {
      console.error('Error rejecting Section B:', error);
      setSaveError(error.message || 'Failed to reject Section B. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /* Handle Section C OK/Not OK - Azure API Integration */
  const handleSectionCApprove = async () => {
    console.log('🟢 [Section C] OK Button Clicked');
    setIsSaving(true);
    setSaveError(null);
    try {
      // Call workflow API for both Raw Material and Process Material
      console.log('🔧 Calling Section C workflow API...');
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || 0;

      // Call Azure API for Sub PO verification - OK action
      const actionData = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: call.call_no,
        action: 'VERIFY_PO_DETAILS',
        remarks: 'Sub PO details verified - Section C OK',
        actionBy: userId,
        pincode: '560001'
      };

      console.log('📤 [Section C] Calling performTransitionAction...');
      await performTransitionAction(actionData);
      console.log('✅ [Section C] performTransitionAction completed');

      // Persist Section C batch and mark approved
      try {
        const payload = buildSectionCPayload();
        console.log('📤 [Section C] Calling saveSectionCBatch with payload:', payload);
        await saveSectionCBatch(payload);
        console.log('✅ [Section C] saveSectionCBatch completed');

        console.log('📤 [Section C] Calling approveAllSectionC...');
        await approveAllSectionC(call.call_no);
        console.log('✅ [Section C] approveAllSectionC completed');
      } catch (e) {
        console.error('❌ [Section C] save/approve failed:', e);
      }

      onFormDataChange({ sectionCVerified: true, sectionCStatus: 'approved' });
    } catch (error) {
      console.error('Error saving Section C:', error);
      setSaveError(error.message || 'Failed to save Section C. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionCReject = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // Call workflow API for both Raw Material and Process Material
      console.log('🔧 Calling Section C workflow API for rejection...');
      const currentUser = getStoredUser();
      const userId = currentUser?.userId || 0;

      // Call Azure API for correction request - Not OK action
      const actionData = {
        workflowTransitionId: call.workflowTransitionId || call.id,
        requestId: call.call_no,
        action: 'REQUEST_CORRECTION_TO_CM',
        remarks: 'Sub PO details need correction - Section C Not OK',
        actionBy: userId,
        pincode: '560001'
      };

      await performTransitionAction(actionData);

      // Persist Section C rejection batch to backend
      try {
        const payload = buildSectionCPayload().map(item => ({ ...item, status: 'rejected' }));
        await saveSectionCBatch(payload);
        await rejectAllSectionC(call.call_no, 'Rejected by IE');
      } catch (e) {
        console.warn('Section C reject save failed:', e);
      }

      onFormDataChange({ sectionCVerified: false, sectionCStatus: 'rejected' });
    } catch (error) {
      console.error('Error rejecting Section C:', error);
      setSaveError(error.message || 'Failed to reject Section C. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading indicator while fetching data
  if (isLoading) {
    return (
      <div className="form-container inspection-form-container">
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-32)' }}>
          <p>Loading inspection data...</p>
        </div>
      </div>
    );
  }

  // Get PO number suffix for section titles
  const poSuffix = call.po_no ? ` - ${call.po_no}` : '';

  return (
    <div className="form-container inspection-form-container">
      {/* Error message display */}
      {saveError && (
        <div className="card" style={{ backgroundColor: 'var(--color-error-bg, #fee2e2)', borderColor: 'var(--color-error)', marginBottom: 'var(--space-16)' }}>
          <p style={{ color: 'var(--color-error)', margin: 0 }}>{saveError}</p>
        </div>
      )}

      {/* SECTION A: Main PO Information */}
      {showSectionA && (
        <div className={`card ${formData.showValidationErrors && !formData.sectionAVerified ? 'card--incomplete' : ''}`}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">SECTION A: Main PO Information{poSuffix} {isFromDatabase ? <span style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-sm)' }}></span> : fetchedPoData ? '(Auto-Fetched)' : ''}</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSectionAExpanded(!sectionAExpanded)}
              style={{ padding: 'var(--space-8) var(--space-16)', fontSize: 'var(--font-size-xl)' }}
            >
              {sectionAExpanded ? '-' : '+'}
            </button>
          </div>
          {sectionAExpanded && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">RLY + PO_NO</label>
                <input type="text" className="form-input" value={poData.rly_po_no || poData.po_no || call.po_no} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">PO DATE</label>
                <input type="text" className="form-input" value={poData.po_date || formatDate(call.po_date)} disabled />
                <small style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)' }}>✓ PO Date ≤ Today</small>
              </div>
              <div className="form-group">
                <label className="form-label">PO_QTY</label>
                <input type="text" className="form-input" value={poData.po_qty || call.po_qty} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">INSP_PLACE</label>
                <textarea className="form-textarea" value={poData.place_of_inspection || call.place_of_inspection || 'N/A'} readOnly disabled />
              </div>
              <div className="form-group">
                <label className="form-label">VENDOR_NAME</label>
                <input type="text" className="form-input" value={poData.vendor_name || call.vendor_name} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">MA_NO</label>
                <input type="text" className="form-input" value={poData.po_amend_no || 'N/A'} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">MA_DATE</label>
                <input type="text" className="form-input" value={poData.po_amend_dates || 'N/A'} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">PURCHASING AUTHORITY</label>
                <input type="text" className="form-input" value={poData.purchasing_authority || 'Manager, Procurement'} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">BILL PAYING OFFICER</label>
                <input type="text" className="form-input" value={poData.bpo || 'BPO-001'} disabled />
              </div>
              {/* <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">PO_COND SR. NO.</label>
            <div className="form-grid" style={{ marginTop: 'var(--space-8)' }}>
              <div className="form-group">
                <label className="form-label">COND_TITLE</label>
                <input type="text" className="form-input" value={poData.cond_title || 'N/A'} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">COND_TEXT</label>
                <input type="text" className="form-input" value={poData.cond_text || 'N/A'} disabled />
              </div>
            </div>
          </div> */}

              {/* Section A OK/Not OK Buttons */}
              <div className="section-action-buttons" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-16)', marginTop: 'var(--space-16)', paddingTop: 'var(--space-16)', borderTop: '1px solid var(--color-gray-300)' }}>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleSectionAReject}
                  disabled={isSaving || formData.sectionAStatus === 'rejected'}
                >
                  {isSaving ? 'Saving...' : formData.sectionAStatus === 'rejected' ? 'Not OK' : 'Not OK'}
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSectionAApprove}
                  disabled={isSaving || formData.sectionAStatus === 'approved'}
                >
                  {isSaving ? 'Saving...' : formData.sectionAStatus === 'approved' ? 'OK' : 'OK'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION B: Inspection Call Details - Only shown when Section A is approved */}
      {showSectionB && formData.sectionAStatus === 'approved' && (
        <div className={`card ${formData.showValidationErrors && !formData.sectionBVerified ? 'card--incomplete' : ''}`}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">SECTION B: Inspection Call Details{poSuffix}</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSectionBExpanded(!sectionBExpanded)}
              style={{ padding: 'var(--space-8) var(--space-16)', fontSize: 'var(--font-size-xxl)' }}
            >
              {sectionBExpanded ? '-' : '+'}
            </button>
          </div>
          {sectionBExpanded && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">INSPECTION CALL NO.</label>
                <input type="text" className="form-input" value={call.call_no} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">INSPECTION CALL DATE</label>
                <input type="text" className="form-input" value={formatDate(call.call_date || call.requested_date)} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">INSPECTION DESIRED DATE</label>
                <input type="text" className="form-input" value={formatDate(call.desired_inspection_date || call.requested_date)} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">RLY + PO_NO + PO_SR</label>
                <input
                  type="text"
                  className="form-input"
                  value={(() => {
                    if (poData.rly_po_no_serial) return poData.rly_po_no_serial;
                    if (poData.rlyCd && poData.poSerialNo) {
                      return `${poData.rlyCd}/${poData.poSerialNo}`;
                    }
                    return `${poData.po_no || call.po_no} / ${poData.pl_no || '1'}`;
                  })()}
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label">ITEM DESC</label>
                <textarea className="form-textarea" value={poData.product_name || 'ERC Components'} readOnly disabled />
              </div>
              <div className="form-group">
                <label className="form-label">PRODUCT TYPE</label>
                <input type="text" className="form-input" value={getProductTypeDisplayName(call.product_type)} disabled />
              </div>
              {/* Type of ERC - fetched from inspection_calls.erc_type via API */}
              <div className="form-group">
                <label className="form-label">TYPE OF ERC</label>
                <input type="text" className="form-input" value={poData.type_of_erc || poData.erc_type || call.erc_type || 'N/A'} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">PO_SR_QTY + UNIT</label>
                <input type="text" className="form-input" value={`${poData.po_sr_qty || poData.po_qty} ${poData.unit || 'Nos'}`} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">CONSIGNEE_RLY + CONSIGNEE</label>
                <input type="text" className="form-input" value={poData.consignee || call.consignee || 'N/A'} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">ORIG_DP</label>
                <input type="text" className="form-input" value={poData.orig_dp || call.delivery_period || 'N/A'} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">EXT_DP</label>
                <input type="text" className="form-input" value={poData.ext_dp || 'N/A'} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">ORIG_DP_START</label>
                <input type="text" className="form-input" value={poData.orig_dp_start || poData.po_date || formatDate(call.po_date)} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">STAGE OF INSPECTION</label>
                <input type="text" className="form-input" value={
                  (call.product_type === 'Process' || call.product_type?.includes('Process')) ? 'Process Material' :
                    (call.product_type === 'Final' || call.product_type?.includes('Final')) ? 'Final' :
                      'Raw Material'
                } disabled />
              </div>
              <div className="form-group">
                <label className="form-label">CALL QTY (MT)</label>
                <input type="text" className="form-input" value={
                  poData.totalOfferedQtyMt ||
                  poData.total_offered_qty ||
                  poData.total_offered_qty_mt ||
                  call.call_qty ||
                  'N/A'
                } disabled />
              </div>
              <div className="form-group">
                <label className="form-label">PLACE OF INSPECTION</label>
                <textarea className="form-textarea" value={
                  poData.place_of_inspection || call.place_of_inspection || 'N/A'
                } title={poData.vendorDetails || poData.unit_address || ''} readOnly disabled />
              </div>

              {/* RM IC NUMBERS & HEAT NUMBERS TABLE - Only for Process Material Inspection with multiple lots */}
              {(call.product_type === 'Process' || call.product_type?.includes('Process')) &&
                poData.lotDetailsList && poData.lotDetailsList.length > 0 && (
                  <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-16)' }}>
                    <label className="form-label">RM IC NUMBERS & HEAT NUMBERS</label>
                    <div style={{ overflowX: 'auto', border: '1px solid var(--color-gray-300)', borderRadius: '6px' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: 'var(--font-size-sm)'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-gray-100)', borderBottom: '2px solid var(--color-gray-300)' }}>
                            <th style={{ padding: 'var(--space-12)', textAlign: 'left', fontWeight: '600', color: 'var(--color-gray-700)' }}>RM IC Number</th>
                            <th style={{ padding: 'var(--space-12)', textAlign: 'left', fontWeight: '600', color: 'var(--color-gray-700)' }}>Heat Number</th>
                            <th style={{ padding: 'var(--space-12)', textAlign: 'left', fontWeight: '600', color: 'var(--color-gray-700)' }}>Call Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {poData.lotDetailsList.map((lot, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--color-gray-200)', backgroundColor: idx % 2 === 0 ? '#fff' : 'var(--color-gray-50)' }}>
                              <td style={{ padding: 'var(--space-12)', color: 'var(--color-gray-700)', fontWeight: '500' }}>{lot.rmIcNumber || 'N/A'}</td>
                              <td style={{ padding: 'var(--space-12)', color: 'var(--color-gray-700)', fontWeight: '500' }}>{lot.heatNumber || 'N/A'}</td>
                              <td style={{ padding: 'var(--space-12)', color: 'var(--color-gray-700)', fontWeight: '500' }}>{lot.offeredQty || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              {/* PROCESS IC NUMBER - Only for Final Inspection */}
              {(call.product_type === 'Final' || call.product_type?.includes('Final')) && (
                <div className="form-group">
                  <label className="form-label">PROCESS IC NUMBERS</label>
                  <input
                    type="text"
                    className="form-input"
                    value={(() => {
                      const set = new Set();
                      if (call.process_ic_number) set.add(call.process_ic_number);
                      if (poData.process_ic_number) set.add(poData.process_ic_number);
                      if (fetchedPoData && fetchedPoData.process_ic_number) set.add(fetchedPoData.process_ic_number);
                      if (finalDetailsState && finalDetailsState.processIcNumber) set.add(finalDetailsState.processIcNumber);
                      // include process ic numbers from finalMappings and from subPoList (if present)
                      if (finalMappings && finalMappings.length) {
                        finalMappings.forEach(m => {
                          if (m.processIcNumber) set.add(m.processIcNumber);
                          if (m.process_ic_number) set.add(m.process_ic_number);
                        });
                      }
                      if (subPoList && subPoList.length) {
                        subPoList.forEach(s => {
                          if (s.process_ic_number) set.add(s.process_ic_number);
                          if (s.processIcNumber) set.add(s.processIcNumber);
                        });
                      }
                      const arr = Array.from(set).filter(Boolean);
                      return arr.length ? arr.join(', ') : 'N/A';
                    })()}
                    disabled
                  />
                </div>
              )}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">REMARKS</label>
                <textarea className="form-textarea" rows="2" value={call.remarks || poData.remarks || ''} disabled />
              </div>

              {/* Section B OK/Not OK Buttons */}
              <div className="section-action-buttons" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-16)', marginTop: 'var(--space-16)', paddingTop: 'var(--space-16)', borderTop: '1px solid var(--color-gray-300)' }}>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleSectionBReject}
                  disabled={isSaving || formData.sectionBStatus === 'rejected'}
                >
                  {isSaving ? 'Saving...' : formData.sectionBStatus === 'rejected' ? 'Not OK' : 'Not OK'}
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSectionBApprove}
                  disabled={isSaving || formData.sectionBStatus === 'approved'}
                >
                  {isSaving ? 'Saving...' : formData.sectionBStatus === 'approved' ? 'OK' : 'OK'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION C: Sub PO Details - Only shown for Raw Material, hidden for Process and Final Product */}
      {(call?.product_type || '') === 'Raw Material' && formData.sectionBStatus === 'approved' && (
        <div className={`card ${formData.showValidationErrors && !formData.sectionCVerified ? 'card--incomplete' : ''}`}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">
              SECTION C: Details of Sub PO in case inspection call is requested for Raw Material / process{poSuffix}
              {subPoList.length > 1 && <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', marginLeft: 'var(--space-8)' }}>({subPoList.length} Heats)</span>}
            </h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSectionCExpanded(!sectionCExpanded)}
              style={{ padding: 'var(--space-8) var(--space-16)', fontSize: 'var(--font-size-xl)' }}
            >
              {sectionCExpanded ? '-' : '+'}
            </button>
          </div>
          {sectionCExpanded && (
            <div>
              {/* Display multiple sub POs if available from database */}
              {subPoList.length > 0 ? (
                subPoList.map((subPo, index) => (
                  <div key={index} style={{
                    marginBottom: index < subPoList.length - 1 ? 'var(--space-24)' : '0',
                    paddingBottom: index < subPoList.length - 1 ? 'var(--space-24)' : '0',
                    borderBottom: index < subPoList.length - 1 ? '2px solid var(--color-gray-300)' : 'none'
                  }}>
                    {subPoList.length > 1 && (
                      <h4 style={{
                        color: 'var(--color-primary)',
                        marginBottom: 'var(--space-16)',
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 'var(--font-weight-semibold)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 'var(--space-8)'
                      }}>
                        <span>Heat {index + 1}: {subPo.heat_no || ''}</span>
                        <span style={{ color: 'var(--color-gray-600)', fontWeight: 'var(--font-weight-normal)' }}>
                          Sub PO: {subPo.sub_po_no}
                        </span>
                      </h4>
                    )}
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">RAW MATERIAL NAME</label>
                        <input type="text" className="form-input" value={subPo.raw_material_name || poData.product_name || poData.po_description || 'Raw Material'} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">GRADE / SPEC</label>
                        <input type="text" className="form-input" value={subPo.grade_spec || poData.grade || 'N/A'} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">HEAT NO./ NO.S</label>
                        <input type="text" className="form-input" value={subPo.heat_no || 'N/A'} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">MANUFACTURER OF STEEL BARS</label>
                        <input type="text" className="form-input" value={subPo.manufacturer || poData.manufacturer || 'N/A'} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">TC NO</label>
                        <input type="text" className="form-input" value={subPo.tc_no || 'N/A'} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">TC DATE</label>
                        <input type="text" className="form-input" value={subPo.tc_date || 'N/A'} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">SUB PO NO.</label>
                        <input type="text" className="form-input" value={subPo.sub_po_no || 'N/A'} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">SUB PO DATE</label>
                        <input type="text" className="form-input" value={subPo.sub_po_date || 'N/A'} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">SUB PO QTY (MT)</label>
                        <input type="text" className="form-input" value={subPo.sub_po_qty || 'N/A'} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">INVOICE NO.</label>
                        <input type="text" className="form-input" value={subPo.invoice_no || 'N/A'} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">INVOICE DATE</label>
                        <input type="text" className="form-input" value={subPo.invoice_date || 'N/A'} disabled />
                      </div>
                      <div className="form-group">
                        <label className="form-label">OFFERED QTY (MT)</label>
                        <input type="text" className="form-input" value={subPo.qty || 'N/A'} disabled />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback to single sub PO display (mock data or single sub PO) */
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">RAW MATERIAL NAME</label>
                    <input type="text" className="form-input" value={subPoData.raw_material_name || 'N/A'} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GRADE / SPEC</label>
                    <input type="text" className="form-input" value={subPoData.grade || subPoData.spec || 'N/A'} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">HEAT NO./ NO.S</label>
                    <input type="text" className="form-input" value={subPoData.heat_no || subPoData.heat_numbers || 'N/A'} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">MANUFACTURER OF STEEL BARS</label>
                    <input type="text" className="form-input" value={subPoData.manufacturer || 'N/A'} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">TC NO</label>
                    <input type="text" className="form-input" value={subPoData.tc_no || 'N/A'} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">TC DATE</label>
                    <input type="text" className="form-input" value={subPoData.tc_date || 'N/A'} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SUB PO NO.</label>
                    <input type="text" className="form-input" value={subPoData.sub_po_no || 'N/A'} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SUB PO DATE</label>
                    <input type="text" className="form-input" value={subPoData.sub_po_date || 'N/A'} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">INVOICE NO.</label>
                    <input type="text" className="form-input" value={subPoData.invoice_no || 'N/A'} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">INVOICE DATE</label>
                    <input type="text" className="form-input" value={subPoData.invoice_date || 'N/A'} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SUB PO QTY (MT)</label>
                    <input type="text" className="form-input" value={subPoData.sub_po_qty || 'N/A'} disabled />
                  </div>
                </div>
              )}

              {/* Place of Inspection - Common for all heats */}
              <div className="form-grid" style={{ marginTop: 'var(--space-16)', paddingTop: 'var(--space-16)', borderTop: '1px solid var(--color-gray-300)' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">PLACE OF INSPECTION</label>
                  <input type="text" className="form-input" value={
                    poData.place_of_inspection || call.place_of_inspection || 'N/A'
                  } title={poData.vendorDetails || poData.unit_address || ''} disabled />
                </div>
              </div>

              {/* Section C OK/Not OK Buttons */}
              <div className="section-action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-16)', marginTop: 'var(--space-16)', paddingTop: 'var(--space-16)', borderTop: '1px solid var(--color-gray-300)' }}>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleSectionCReject}
                  disabled={isSaving || formData.sectionCStatus === 'rejected'}
                >
                  {isSaving ? 'Saving...' : formData.sectionCStatus === 'rejected' ? 'Not OK' : 'Not OK'}
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSectionCApprove}
                  disabled={isSaving || formData.sectionCStatus === 'approved'}
                >
                  {isSaving ? 'Saving...' : formData.sectionCStatus === 'approved' ? 'OK' : 'OK'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InspectionInitiationFormContent;
