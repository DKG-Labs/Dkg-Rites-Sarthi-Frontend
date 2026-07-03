/* eslint-disable */
import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "../dashboard/Dashboard";
import PrivateRoutes from "./PrivateRoutes";
import RoleBasedRoute from "./RoleBasedRoute";
import LayoutWithDashboard from "./LayoutWithDashboard";
import Login from "../auth/Login";
import PageNotFound from "../pageNotFound/PageNotFound";
import UnderConstruction from "../pageNotFound/UnderConstruction";
import SmsDutyEnd from "../dashboard/duty/sms/endDuty/SmsDutyEnd";
import SmsBloomInspection from "../dashboard/duty/sms/bloomInspection/SmsBloomInspection";
import ShiftReports from "../dashboard/duty/sms/shiftReports/ShiftReports";
import SmsHeatList from "../dashboard/duty/sms/heatList/SmsHeatList";
import SmsCheckList from "../dashboard/duty/sms/checkList/SmsCheckList";
import SmsVerification from "../dashboard/duty/sms/verification/SmsVerification";
import SmsHeatSummary from "../dashboard/duty/sms/heatSummary/SmsHeatSummary";
import VIShiftDetailsForm from "../dashboard/duty/visualInspection/shiftDetails/ShiftDetailsForm";
import Home from "../dashboard/duty/visualInspection/home/Home";
import VIShiftSummary from "../dashboard/duty/visualInspection/shiftSummary/VIShiftSummary";
import VisualInspectionForm from "../dashboard/duty/visualInspection/inspection/VisualInspectionForm";
import StageShiftDetailsForm from "../dashboard/duty/stage/rollingStage/shiftDetails/ShiftDetailsForm";
import SriStartDutyForm from "../dashboard/duty/srInspection/shiftDetails/ShiftDetailsForm";
import StageHome from "../dashboard/duty/stage/rollingStage/home/Home";
import NDTStartDutyForm from "../dashboard/duty/ndt/shiftDetails/StartDutyForm";
import NDTHome from "../dashboard/duty/ndt/home/Home";
import NCalibrationForm from "../dashboard/duty/ndt/calibration/NCalibrationForm";
import NReport from "../dashboard/duty/ndt/report/NReport";
import SmsDutyStartForm from "../dashboard/duty/sms/startDuty/SmsDutyStartForm";
import CalibrationList from "../dashboard/duty/calibration/calibrationList/CalibrationList";
import NewCalibrationForm from "../dashboard/duty/calibration/newCalibration/NewCalibrationForm";
import BulkCalibrationForm from "../dashboard/duty/calibration/bulkCalibration/BulkCalibrationForm";
// import QctSampleList from "../dashboard/duty/qct/qctSampleList/QctSampleList";
import QctSampleDeclarationForm from "../dashboard/duty/qct/newSampleDeclaration/QctSampleDeclarationForm";
import SrInspectionHome from "../dashboard/duty/srInspection/srInspectionHome/SrInspectionHome";
import SrNewInspectionForm from "../dashboard/duty/srInspection/srNewInspection/SrNewInspectionForm";
import WsRemarks from "../dashboard/duty/srInspection/wsRemarks/WsRemarks";
import TestSampleList from "../dashboard/duty/stage/testSampleMarking/testSampleList/TestSampleList";
import NewTestSampleDeclaration from "../dashboard/duty/stage/testSampleMarking/newTestSample/NewTestSampleDeclaration";
import RollingControlForm from "../dashboard/duty/stage/rollingStage/rollingControl/RollingControlForm";
import HtSequence from "../dashboard/duty/stage/rollingStage/htSequence/HtSequence";
import WeldingStartDutyForm from "../dashboard/duty/welding/startDuty/WeldingStartDutyForm";
import WeldingHome from "../dashboard/duty/welding/home/WeldingHome";
import NewWeldInspection from "../dashboard/duty/welding/newWeld/NewWeldInspection";
import HeldRejectedPanel from "../dashboard/duty/welding/heldRejectedPanel/HeldRejectedPanel";
import WeldingSummary from "../dashboard/duty/welding/shiftSummary/WeldingSummary";
import WeldTestSample from "../dashboard/duty/welding/testSample/WeldTestSample";
import TLTTestDetails from "../dashboard/duty/welding/TLTTestDetails/TLTTestDetails";
import HardnessTestDetails from "../dashboard/duty/welding/HardnessTestDetails/HardnessTestDetails";
import MicroTestDetails from "../dashboard/duty/welding/MicroTestDetails/MicroTestDetails";
import MacroTestDetails from "../dashboard/duty/welding/MacroTestDetails/MacroTestDetails";
import TestingHome from "../dashboard/duty/testing/testHome/TestingHome";
import PendingTestSamples from "../dashboard/duty/testing/pendingTestSamples/PendingTestSamples";
import TestingReport from "../dashboard/duty/testing/shiftTestingReport/TestingReport";
import HeatPending from "../dashboard/duty/testing/pendingHeats/HeatPending";
import RailDetails from "../dashboard/duty/railDetails/RailDetails";
import SmsPrivateRoute from "./SmsPrivateRoute";
import HeatDtl from "../dashboard/duty/sms/heatDtl/HeatDtl";
import RollingPrivateRoute from "./RollingPrivateRoute";
import RollingControlSample from "../dashboard/duty/stage/rollingStage/rollingControl60E1/RollingControlSample";
import RollingVerification from "../dashboard/duty/stage/rollingVerification/RollingVerification";
import FinishingVerification from "../dashboard/duty/stage/finishingVerification/FinishingVerification";
import SmsRecord from "../dashboard/records/SmsRecord";
import SmsRecordMain from "../dashboard/records/SmsRecordMain";
import SmsHeatReport from "../dashboard/records/SmsHeatReport";
import NdtReport from "../dashboard/records/NdtReport";
import ShiftSummary from "../dashboard/duty/ndt/shiftSummary/ShiftSummary";
import NdtPrivateRoute from "./NdtPrivateRoute";
import VIPrivateRoute from "./VIPrivateRoute";
import WeldingPrivateRoute from "./WeldingPrivateRoute";
import WeldingReportMain from "../dashboard/records/WeldingReportMain";
import NewWeldingReport from "../dashboard/records/NewWeldingReport";
import WeldingSummaryReport from "../dashboard/records/WeldingSummaryReport";
import WeldingTestSampleReport from "../dashboard/records/WeldingTestSampleReport";
import ViReportMain from "../dashboard/records/ViReportMain";
import ViDefectAnalysis from "../dashboard/records/ViDefectAnalysis";
import ViAcptRejReport from "../dashboard/records/ViAcptRejReport";
import ViAcceptanceReport from "../dashboard/records/ViAcceptanceReport";

import SmsIsoMain from "../dashboard/isoReports/sms/SmsIsoMain";
import RollingIsoMain from "../dashboard/isoReports/rolling/RollingIsoMain";
import Fatigue from "../dashboard/duty/qct/test/Fatigue";
import Fracture from "../dashboard/duty/qct/test/Fracture";
import Fcgr from "../dashboard/duty/qct/test/Fcgr";
import Residual from "../dashboard/duty/qct/test/Residual";
import CenterLine from "../dashboard/duty/qct/test/CenterLine";
import ViIsoMain from "../dashboard/isoReports/vi/ViIsoMain";
import WeldingIsoMain from "../dashboard/isoReports/welding/WeldingIsoMain";
// import SriIsoMain from "../dashboard/isoReports/sri/SriIsoMain";
import QctRecordMain from "../dashboard/records/QctRecordMain";
import QctRecord1 from "../dashboard/records/QctRecord1";
import SriIsoMain from "../dashboard/isoReports/sri/SriIsoMain";
import TestingStartDutyForm from "../dashboard/duty/testing/startDuty/TestingStartDutyForm";
import TestingPrivateRoute from "./TestingPrivateRoute";
import ChemicalTest from "../dashboard/duty/testing/pendingTestSamples/ChemicalTest";
import N2Test from "../dashboard/duty/testing/pendingTestSamples/N2Test";
import FWTTest from "../dashboard/duty/testing/pendingTestSamples/FwtTest";
import IRTest from "../dashboard/duty/testing/pendingTestSamples/IRTest";
import O2Test from "../dashboard/duty/testing/pendingTestSamples/O2Test";
import TensileFootTest from "../dashboard/duty/testing/pendingTestSamples/TensileFootTest";
import MicroTest from "../dashboard/duty/testing/pendingTestSamples/MicroTest";
import MacroTest from "../dashboard/duty/testing/pendingTestSamples/MacroTest";
import DecarbTest from "../dashboard/duty/testing/pendingTestSamples/DecarbTest";
import TensileTest from "../dashboard/duty/testing/pendingTestSamples/TensileTest";
import HardnessTest from "../dashboard/duty/testing/pendingTestSamples/HardnessTest";
import MechanicalTest from "../dashboard/duty/testing/pendingTestSamples/MechanicalTest";
import SPTest from "../dashboard/duty/testing/pendingTestSamples/SPTest";
import RSHTest from "../dashboard/duty/testing/pendingTestSamples/RSHTest";
import PHTest from "../dashboard/duty/testing/pendingTestSamples/PHTest";
import ViSummary from "../dashboard/duty/visualInspection/viSummaru/ViSummary";
import BspDashboard from "../bsp/BspDashboard";
import BspRecordMain from "../bsp/BspRecordMain";
import BspFwtRecord from "../bsp/BspFwtRecord";
import BspMacroRecord from "../bsp/BspMacroRecord";
import BspChemRecord from "../bsp/BspChemRecord";
import BspTensileRecord from "../bsp/BspTensileRecord";
import AiSystem from "../dashboard/aiSystem/AiSystem";
import ChangePassword from "../../components/ChangePassword";

const RoutesComponent = () => {
  return (
    <>
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route element={<LayoutWithDashboard />}>
            {/* BSP Admin - Only for LOCAL_ADMIN and MAIN_ADMIN */}
            <Route element={<RoleBasedRoute requiredPermission="admin" />}>
              <Route path="bsp" element={<BspDashboard />} />
              <Route path="bsp/data" element={<BspRecordMain />} />
              <Route path="bsp/data/fwt" element={<BspFwtRecord />} />
              <Route path="bsp/data/macro" element={<BspMacroRecord />} />
              <Route path="bsp/data/chem" element={<BspChemRecord />} />
              <Route path="bsp/data/tensile" element={<BspTensileRecord />} />
            </Route>

            <Route index element={<Dashboard />} />

            {/* Records - Available for MANAGER, LOCAL_ADMIN, MAIN_ADMIN */}
            <Route element={<RoleBasedRoute requiredPermission="records" />}>
              <Route path="record/sms" element={<SmsRecordMain />} />
              <Route path="record/sms/summary" element={<SmsRecord />} />
              <Route path="record/sms/heat" element={<SmsHeatReport />} />
              <Route path="record/ndt" element={<NdtReport />} />
            </Route>

            {/* More Records - Available for MANAGER, LOCAL_ADMIN, MAIN_ADMIN */}
            <Route element={<RoleBasedRoute requiredPermission="records" />}>
              <Route path="record/welding" element={<WeldingReportMain />} />
              <Route path="record/welding/newWeld" element={<NewWeldingReport />} />
              <Route path="record/welding/summary" element={<WeldingSummaryReport />} />
              <Route path="record/welding/testSample" element={<WeldingTestSampleReport />} />

              <Route path="record/vi" element={<ViReportMain />} />
              <Route path="record/vi/acptRej" element={<ViAcptRejReport />} />
              <Route path="record/vi/acpt" element={<ViAcceptanceReport />} />
              <Route path="record/vi/defect" element={<ViDefectAnalysis />} />

              <Route path="record/qct" element={<QctRecordMain />} />
              <Route path="record/qct/record1" element={<QctRecord1 />} />
            </Route>

            {/* SMS Duty - Available for all roles */}
            <Route element={<RoleBasedRoute requiredPermission="duty-sms" />}>
              <Route path="sms">
                <Route index element={<SmsDutyStartForm />} />
                <Route path="dutyStart" element={<SmsDutyStartForm />} />
                <Route element={<SmsPrivateRoute />}>
                  <Route path="heatSummary" element={<SmsHeatSummary />} />
                  <Route path="heatDtl" element={<HeatDtl />} />
                  <Route path="dutyEnd" element={<SmsDutyEnd />} />
                  <Route
                    path="bloomInspection"
                    element={<SmsBloomInspection />}
                  />
                  <Route path="shiftReports">
                    <Route index element={<ShiftReports />} />
                    <Route path="heatList" element={<SmsHeatList />} />
                    <Route path="checkList" element={<SmsCheckList />} />
                    <Route path="verification" element={<SmsVerification />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            {/* Rolling/Stage Duty - Available for all roles */}
            <Route element={<RoleBasedRoute requiredPermission="duty-rolling" />}>
              <Route path="stage">
                <Route index element={<StageShiftDetailsForm />} />
                <Route path="startDuty" element={<StageShiftDetailsForm />} />
                <Route element={<RollingPrivateRoute />}>
                  <Route path="home" element={<StageHome />} />
                  <Route path="rollingControl" element={<RollingControlForm />} />
                  <Route
                    path="rollingControl/rollingControlSample"
                    element={<RollingControlSample />}
                  />
                  <Route
                    path="rollingVerification"
                    element={<RollingVerification />}
                  />
                  <Route
                    path="finishingVerification"
                    element={<FinishingVerification />}
                  />
                  <Route path="htSequence" element={<HtSequence />} />
                </Route>
                <Route
                  path="testSampleMarkingList"
                  element={<TestSampleList />}
                />
                <Route
                  path="newTestSampleDeclaration"
                  element={<NewTestSampleDeclaration />}
                />
              </Route>
            </Route>

            <Route element={<RoleBasedRoute requiredPermission="duty-ndt" />}>
              <Route path="ndt">
                <Route index element={<NDTStartDutyForm />} />
                <Route path="startDuty" element={<NDTStartDutyForm />} />
                <Route element={<NdtPrivateRoute />}>
                  <Route path="home" element={<NDTHome />} />
                  <Route path="calibration" element={<NCalibrationForm />} />
                  <Route path="report" element={<NReport />} />
                  <Route path="shiftSummary" element={<ShiftSummary />} />
                </Route>
              </Route>
            </Route>

            <Route element={<RoleBasedRoute requiredPermission="duty-testing" />}>
              <Route path="testing">
                <Route index element={<TestingStartDutyForm />} />
                <Route path="startDuty" element={<TestingStartDutyForm />} />
                <Route element={<TestingPrivateRoute />}>
                  <Route path="home" element={<TestingHome />} />
                  <Route path="pendingTestSamples" element={<PendingTestSamples />} />
                  <Route path="testingReport" element={<TestingReport />} />
                  <Route path="heatPending" element={<HeatPending />} />
                  <Route path="report" element={<NReport />} />

                  {/* Test specific routes */}
                  <Route path="chemical" element={<ChemicalTest />} />
                  <Route path="n2" element={<N2Test />} />
                  <Route path="fwt" element={<FWTTest />} />
                  <Route path="mechanical" element={<MechanicalTest />} />
                  <Route path="sp" element={<SPTest />} />
                  <Route path="ir" element={<IRTest />} />
                  <Route path="o2" element={<O2Test />} />
                  <Route path="tensilefoot" element={<TensileFootTest />} />
                  <Route path="micro" element={<MicroTest />} />
                  <Route path="macro" element={<MacroTest />} />
                  <Route path="decarb" element={<DecarbTest />} />
                  <Route path="rsh" element={<RSHTest />} />
                  <Route path="ph" element={<PHTest />} />
                  <Route path="tensile" element={<TensileTest />} />
                  <Route path="hardness" element={<HardnessTest />} />
                </Route>
              </Route>
            </Route>

            <Route element={<RoleBasedRoute requiredPermission="duty-vi" />}>
              <Route path="visual">
                <Route path="startDuty" element={<VIShiftDetailsForm />} />
                <Route index element={<VIShiftDetailsForm />} />
                <Route element={<VIPrivateRoute />}>
                  <Route path="home" element={<Home />} />
                  <Route path="inspection" element={<VisualInspectionForm />} />
                  <Route path="summary" element={<VIShiftSummary />} />
                  <Route path="viSummary" element={<ViSummary />} />
                </Route>
              </Route>
            </Route>

            <Route element={<RoleBasedRoute requiredPermission="duty-welding" />}>
              <Route path="welding">
                <Route index element={<WeldingStartDutyForm />} />
                <Route path="startDuty" element={<WeldingStartDutyForm />} />
                <Route element={<WeldingPrivateRoute />}>
                  <Route path="home" element={<WeldingHome />} />
                  <Route path="newWeldInspection" element={<NewWeldInspection />} />
                  <Route path="heldRejectedPanel" element={<HeldRejectedPanel />} />
                  <Route path="testSample" element={<WeldTestSample />} />
                  <Route path="tltTestDetails" element={<TLTTestDetails />} />
                  <Route path="hardnessTestDetails" element={<HardnessTestDetails />} />
                  <Route path="microTestDetails" element={<MicroTestDetails />} />
                  <Route path="macroTestDetails" element={<MacroTestDetails />} />
                  <Route path="shiftSummary" element={<WeldingSummary />} />
                </Route>
              </Route>
            </Route>

            <Route element={<RoleBasedRoute requiredPermission="duty-sr-inspection" />}>
              <Route path="srInspection">
                <Route index element={<SriStartDutyForm />} />
                <Route path="home" element={<SrInspectionHome />} />
                <Route
                  path="addNewInspection"
                element={<SrNewInspectionForm />}
              />
              <Route path="wsRemarks" element={<WsRemarks />} />
            </Route>
            </Route>


            <Route element={<RoleBasedRoute requiredPermission="duty-qct" />}>
              <Route path="qct">
                <Route index element={<QctSampleDeclarationForm />} />
                {/* <Route path="sampleList" element={<QctSampleList />} /> */}
                <Route path="fatigue/:qctId" element={<Fatigue />} />
                <Route path="fracture/:qctId" element={<Fracture />} />
                <Route path="fcgr/:qctId" element={<Fcgr />} />
                <Route path="residual/:qctId" element={<Residual />} />
                <Route path="centerLine/:qctId" element={<CenterLine />} />
                <Route path="newSampleDeclaration" element={<QctSampleDeclarationForm />} />
              </Route>
            </Route>

            <Route path="iso">
              <Route path="sms" element={<SmsIsoMain />} />
              <Route path="rolling" element={<RollingIsoMain />} />
              <Route path="vi" element={<ViIsoMain />} />
              <Route path="welding" element={<WeldingIsoMain />} />
              <Route path="sri" element={<SriIsoMain />} />

              {/* </Route> */}
            </Route>

            <Route element={<RoleBasedRoute requiredPermission="duty-calibration" />}>
              <Route path="calibration">
                <Route index element={<CalibrationList />} />
                <Route path="list" element={<CalibrationList />} />
                <Route path="newModifyCalibration" element={<NewCalibrationForm />} />
                <Route path="bulkCalibration" element={<BulkCalibrationForm />} />
              </Route>
            </Route>

            {/* AI System - Available for MANAGER, LOCAL_ADMIN, MAIN_ADMIN */}
            <Route element={<RoleBasedRoute requiredPermission="data-analysis" />}>
              <Route path="dashboard/aiSystem" element={<AiSystem />} />
            </Route>

            {/* <Route path="/railDetails">
              <Route index element={<SmsDutyStartForm />} />
              <Route path="railId" element={<SmsHeatSummary />} />
            </Route> */}
            <Route path="railDetails/:railId" element={<RailDetails />} />

            {/* Under Construction - shown when clicking disabled modules */}
            <Route path="underConstruction" element={<UnderConstruction />} />
          </Route>
        </Route>

        <Route path="login" element={<Login />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

export default RoutesComponent;
