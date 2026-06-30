/* eslint-disable */
import React, { useRef, useState } from "react";
import SearchFilter from "../sms/SearchFilter";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "../sms/Subheading";
import { Button } from "antd";
import { useReactToPrint } from "react-to-print";
import { useSelector } from "react-redux";
import { apiCall } from "../../../../utils/CommonFunctions";

const SriFinalInsp = () => {
	const repRef = useRef();
	const [formData, setFormData] = useState({});

	const handlePrint = useReactToPrint({
		content: () => repRef.current,
		documentTitle: "sri_final_insp", // Set custom filename
	});

	const { token } = useSelector((state) => state.auth);

	const formattedRejAnls = (rejAnlsDtls) => {
		const res = {
			defect26m: {},
			defect13m: {},
		};

		rejAnlsDtls.forEach((item) => {
			if (item.defect26m) {
				res.defect26m[item.defect26m] = item.defect26mCount || 0;
			}
			if (item.defect13m) {
				res.defect13m[item.defect13m] = item.defect13mCount || 0;
			}
		});

		return res;
	};

	// Helper function to calculate summed CL-A values (CL-A + CL-A+0.1)
	const getSummedCLA = (masterData, length) => {
		const baseValue = masterData?.[`acceptance${length}CLA`] || 0;
		const plusValue = masterData?.[`acceptance${length}CLA_01`] || 0;
		const total = baseValue + plusValue;
		return total > 0 ? total : "";
	};

	const onFinish = async (formData) => {
		try {
			const { data } = await apiCall(
				"POST",
				"/iso/getSriFinishingInspDtls",
				token,
				formData
			);

			const rejectionAnalysisDtls =
				data?.responseData?.rejectionAnalysisDtls || [];

			const formattedRejDtls = formattedRejAnls(rejectionAnalysisDtls);

			// Process data based on rail section (52kg vs 60kg)
			const masterData = data?.responseData?.masterDtls || {};

			// Determine if this is 60kg rail (60E1, 60E1A1) or 52kg rail (IRS52, etc.)
			const is60kgRail = formData.railSection === "60E1" || formData.railSection === "60E1A1";
			const is52kgRail = !is60kgRail; // All other sections are treated as 52kg

			const cls60 = is60kgRail
				? {
					...masterData,
					...formattedRejDtls,
					// Keep original field names that the display components expect
					// The display components expect primeQuality26mCLA, not primeQuality26m
				}
				: {};

			const cls52 = is52kgRail
				? {
					...masterData,
					...formattedRejDtls,
					// Keep original field names that the display components expect
					// The display components expect primeQuality26mCLA, not primeQuality26m
				}
				: {};

			const finalFormData = {
				cls52,
				cls60,
				date: formData.date,
				shift: formData.shift,
				railGrade: formData.railGrade,
				railSection: formData.railSection,
			};

			setFormData(finalFormData);
		} catch (error) {
			console.error("Error fetching SRI Final Inspection data:", error);
		}
	};

	return (
		<>
			<SearchFilter
				showDate
				showShift
				showRailGrade
				showRailSection
				onFinish={onFinish}
			/>
			<div className="a4-container" ref={repRef}>
				<IsoHeader
					engTitle="FORMAT FOR FINAL INSPECTION REPORT <br /> Clause No. 8.5 of ISO:9001:2015"
					hinTitle="अंतिम निरीक्षण रिपोर्ट के लिए प्रारूप"
					col3AdtnlLine="APPROVED DIVISONAL HEAD"
				/>
				<Subheading
					formatNo="F/CR-BSP-7.5-16-01"
					page="1 OF 1"
					pageRev="NIL"
					textVis
					textVal="अंतिम निरीक्षण रिपोर्ट / FINAL INSPECTION REPORT"
					dsVis
					dsVal={formData.date + " - " + formData.shift}
					grdVis
					grdVal={formData.railGrade}
					secVis
					secVal={formData.railSection}
				/>

				<div className="overflow-x-auto iso-table">
					<table className="iso-table w-full">
						<thead>
							<tr>
								<th className="cell-style" colSpan={7}></th>
								<th colSpan={7} className="cell-style">
									Lengthwise acceptance
								</th>
							</tr>

							<tr>
								<th className="cell-style" colSpan={3} rowSpan={2}>
									Description
								</th>
								<th className="cell-style" colSpan={2}>
									52kg
								</th>
								<th className="cell-style" colSpan={2}>
									60kg
								</th>

								<th className="cell-style" rowSpan={2}>
									Length
								</th>
								<th className="cell-style" colSpan={3}>
									52kg
								</th>
								<th className="cell-style" colSpan={3}>
									60kg
								</th>
							</tr>

							<tr>
								<th className="cell-style">13M</th>
								<th className="cell-style">26M</th>
								<th className="cell-style">13M</th>
								<th className="cell-style">26M</th>

								<th className="cell-style">CL-A</th>
								<th className="cell-style">CL-B</th>
								<th className="cell-style">IU</th>

								<th className="cell-style">CL-A</th>
								<th className="cell-style">CL-B</th>
								<th className="cell-style">IU</th>
							</tr>
						</thead>

						<tbody>
							<tr>
								<td className="cell-style" rowSpan={3}>
									Accepted
								</td>
								<td className="cell-style" rowSpan={2}>
									Prime Quality
								</td>
								<td className="cell-style">Class A</td>
								<td className="cell-style">{formData.cls52?.primeQuality13mCLA || ""}</td>
								<td className="cell-style">{formData.cls52?.primeQuality26mCLA || ""}</td>
								<td className="cell-style">{formData.cls60?.primeQuality13mCLA || ""}</td>
								<td className="cell-style">{formData.cls60?.primeQuality26mCLA || ""}</td>

								<td className="cell-style" rowSpan={2}>
									26M
								</td>

								<td className="cell-style" rowSpan={2}>
									{getSummedCLA(formData.cls52, "26m")}
								</td>
								<td className="cell-style" rowSpan={2}>
									{formData.cls52?.acceptance26mCLB || ""}
								</td>
								<td className="cell-style" rowSpan={2}>
									{formData.cls52?.acceptance26mIU || ""}
								</td>

								<td className="cell-style" rowSpan={2}>
									{getSummedCLA(formData.cls60, "26m")}
								</td>
								<td className="cell-style" rowSpan={2}>
									{formData.cls60?.acceptance26mCLB || ""}
								</td>
								<td className="cell-style" rowSpan={2}>
									{formData.cls60?.acceptance26mIU || ""}
								</td>
							</tr>

							<tr>
								<td className="cell-style">Class B</td>
								<td className="cell-style">{formData.cls52?.primeQuality13mCLB || ""}</td>
								<td className="cell-style">{formData.cls52?.primeQuality26mCLB || ""}</td>
								<td className="cell-style">{formData.cls60?.primeQuality13mCLB || ""}</td>
								<td className="cell-style">{formData.cls60?.primeQuality26mCLB || ""}</td>
							</tr>

							<tr>
								<td className="cell-style" colSpan={2}>
									IU RAILS
								</td>
								<td className="cell-style">{formData.cls52?.primeQuality13mIU || ""}</td>
								<td className="cell-style">{formData.cls52?.primeQuality26mIU || ""}</td>
								<td className="cell-style">{formData.cls60?.primeQuality13mIU || ""}</td>
								<td className="cell-style">{formData.cls60?.primeQuality26mIU || ""}</td>

								<td className="cell-style">25M</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls52, "25m")}
								</td>
								<td className="cell-style">
									{" "}
									{formData.cls52?.acceptance25mCLB}{" "}
								</td>
								<td className="cell-style">
									{formData.cls52?.acceptance25mIU}
								</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls60, "25m")}
								</td>
								<td className="cell-style">
									{" "}
									{formData.cls60?.acceptance25mCLB}{" "}
								</td>
								<td className="cell-style">
									{formData.cls60?.acceptance25mIU}
								</td>
							</tr>

							<tr>
								<td className="cell-style" colSpan={3}>
									Rejection
								</td>
								<td className="cell-style">{formData?.cls52?.rejRefRejection13m || ""}</td>
								<td className="cell-style">{formData?.cls52?.rejRefRejection26m || ""}</td>
								<td className="cell-style">{formData?.cls60?.rejRefRejection13m || ""}</td>
								<td className="cell-style">{formData?.cls60?.rejRefRejection26m || ""}</td>

								<td className="cell-style">24M</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls52, "24m")}
								</td>
								<td className="cell-style">
									{" "}
									{formData.cls52?.acceptance24mCLB}{" "}
								</td>
								<td className="cell-style">
									{formData.cls52?.acceptance24mIU}
								</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls60, "24m")}
								</td>
								<td className="cell-style">
									{" "}
									{formData.cls60?.acceptance24mCLB}{" "}
								</td>
								<td className="cell-style">
									{formData.cls60?.acceptance24mIU}
								</td>
							</tr>

							{/* // total classified */}
							<tr>
								<td className="cell-style" colSpan={3}>
									Total Classified
								</td>
								<td className="cell-style">{formData.cls52?.totalClassified13m || ""}</td>
								<td className="cell-style">{formData.cls52?.totalClassified26m || ""}</td>
								<td className="cell-style">{formData.cls60?.totalClassified13m || ""}</td>
								<td className="cell-style">{formData.cls60?.totalClassified26m || ""}</td>

								<td className="cell-style">13M</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls52, "13m")}
								</td>
								<td className="cell-style">
									{formData.cls52?.acceptance13mCLB || ""}
								</td>
								<td className="cell-style">
									{formData.cls52?.acceptance13mIU || ""}
								</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls60, "13m")}
								</td>
								<td className="cell-style">
									{formData.cls60?.acceptance13mCLB || ""}
								</td>
								<td className="cell-style">
									{formData.cls60?.acceptance13mIU || ""}
								</td>
							</tr>

							{/* // cutbar */}

							<tr>
								<td className="cell-style" colSpan={3}>
									Cutbar
								</td>
								<td className="cell-style">{formData?.cls52?.rejRefCutbar13m || ""}</td>
								<td className="cell-style">{formData?.cls52?.rejRefCutbar26m || ""}</td>
								<td className="cell-style">{formData?.cls60?.rejRefCutbar13m || ""}</td>
								<td className="cell-style">{formData?.cls60?.rejRefCutbar26m || ""}</td>

								<td className="cell-style">12M</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls52, "12m")}
								</td>
								<td className="cell-style">
									{" "}
									{formData.cls52?.acceptance12mCLB}{" "}
								</td>
								<td className="cell-style">
									{formData.cls52?.acceptance12mIU}
								</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls60, "12m")}
								</td>
								<td className="cell-style">
									{" "}
									{formData.cls60?.acceptance12mCLB}{" "}
								</td>
								<td className="cell-style">
									{formData.cls60?.acceptance12mIU}
								</td>
							</tr>

							{/* REFINISH */}
							<tr>
								<td className="cell-style" colSpan={3}>
									Refinish
								</td>
								<td className="cell-style">{formData?.cls52?.rejRefRefinish13m || ""}</td>
								<td className="cell-style">{formData?.cls52?.rejRefRefinish26m || ""}</td>
								<td className="cell-style">{formData?.cls60?.rejRefRefinish13m || ""}</td>
								<td className="cell-style">{formData?.cls60?.rejRefRefinish26m || ""}</td>

								<td className="cell-style">11M</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls52, "11m")}
								</td>
								<td className="cell-style">
									{" "}
									{formData.cls52?.acceptance11mCLB}{" "}
								</td>
								<td className="cell-style">
									{formData.cls52?.acceptance11mIU}
								</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls60, "11m")}
								</td>
								<td className="cell-style">
									{" "}
									{formData.cls60?.acceptance11mCLB}{" "}
								</td>
								<td className="cell-style">
									{formData.cls60?.acceptance11mIU}
								</td>
							</tr>

							{/* Total Inspected */}

							<tr>
								<td className="cell-style" colSpan={3}>
									Total Inspected
								</td>
								<td className="cell-style">{formData.cls52?.totalInspected13m || ""}</td>
								<td className="cell-style">{formData.cls52?.totalInspected26m || ""}</td>
								<td className="cell-style">{formData.cls60?.totalInspected13m || ""}</td>
								<td className="cell-style">{formData.cls60?.totalInspected26m || ""}</td>

								<td className="cell-style">10M</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls52, "10m")}
								</td>
								<td className="cell-style">
									{" "}
									{formData.cls52?.acceptance10mCLB}{" "}
								</td>
								<td className="cell-style">
									{formData.cls52?.acceptance10mIU}
								</td>

								<td className="cell-style">
									{getSummedCLA(formData.cls60, "10m")}
								</td>
								<td className="cell-style">
									{" "}
									{formData.cls60?.acceptance10mCLB}{" "}
								</td>
								<td className="cell-style">
									{formData.cls60?.acceptance10mIU}
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div className="overflow-x-auto-iso-table">
					<table className="w-full iso-table">
						<thead>
							<tr>
								<th className="cell-style text-center" colSpan={12}>
									REJECTION ANALYSIS
								</th>
							</tr>
							<tr>
								<th className="cell-style text-center" colSpan={6}>
									52KG
								</th>
								<th className="cell-style text-center" colSpan={6}>
									60KG
								</th>
							</tr>

							<tr>
								<th className="cell-style text-center">REASON</th>
								<th className="cell-style text-center">13M</th>
								<th className="cell-style text-center">26M</th>
								<th className="cell-style text-center">REASON</th>
								<th className="cell-style text-center">13M</th>
								<th className="cell-style text-center">26M</th>
								<th className="cell-style text-center">REASON</th>
								<th className="cell-style text-center">13M</th>
								<th className="cell-style text-center">26M</th>
								<th className="cell-style text-center">REASON</th>
								<th className="cell-style text-center">13M</th>
								<th className="cell-style text-center">26M</th>
							</tr>
						</thead>

						<tbody>
							<tr>
								<td className="cell-style">NMI</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["NMI"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["NMI"] ?? ""}{" "}
								</td>

								<td className="cell-style">KK</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["KK"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["KK"] ?? ""}{" "}
								</td>

								<td className="cell-style">NMI</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["NMI"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["NMI"] ?? ""}{" "}
								</td>

								<td className="cell-style">KK</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["KK"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["KK"] ?? ""}{" "}
								</td>
							</tr>

							<tr>
								<td className="cell-style">MDF</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["MDF"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["MDF"] ?? ""}{" "}
								</td>

								<td className="cell-style">WY</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["WY"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["WY"] ?? ""}{" "}
								</td>

								<td className="cell-style">MDF</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["MDF"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["MDF"] ?? ""}{" "}
								</td>

								<td className="cell-style">WY</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["WY"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["WY"] ?? ""}{" "}
								</td>
							</tr>
							{/* 
								<tr>
									<td className="cell-style">MDM</td>
									<td className="cell-style"> {formData?.cls52?.defect13m["MDM"]} </td>
									<td className="cell-style"> {formData?.cls52?.defect26m["MDM"]} </td>

									<td className="cell-style">TW</td>
									<td className="cell-style"> {formData?.cls52?.defect13m["TW"]} </td>
									<td className="cell-style"> {formData?.cls52?.defect26m["TW"]} </td>

									<td className="cell-style">MDM</td>
									<td className="cell-style"> {formData?.cls60?.defect13m["MDM"]} </td>
									<td className="cell-style"> {formData?.cls60?.defect26m["MDM"]} </td>

									<td className="cell-style">TW</td>
									<td className="cell-style"> {formData?.cls60?.defect13m["TW"]} </td>
									<td className="cell-style"> {formData?.cls60?.defect26m["TW"]} </td>
								</tr> */}

							<tr>
								<td className="cell-style">MDM</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["MDM"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["MDM"] ?? ""}{" "}
								</td>
								<td className="cell-style">TW</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["TW"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["TW"] ?? ""}{" "}
								</td>
								<td className="cell-style">MDM</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["MDM"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["MDM"] ?? ""}{" "}
								</td>
								<td className="cell-style">TW</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["TW"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["TW"] ?? ""}{" "}
								</td>
							</tr>

							<tr>
								<td className="cell-style">HH</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["HH"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["HH"] ?? ""}{" "}
								</td>
								<td className="cell-style">LH</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["LH"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["LH"] ?? ""}{" "}
								</td>
								<td className="cell-style">HH</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["HH"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["HH"] ?? ""}{" "}
								</td>
								<td className="cell-style">LH</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["LH"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["LH"] ?? ""}{" "}
								</td>
							</tr>

							<tr>
								<td className="cell-style">OHT</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["OHT"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["OHT"] ?? ""}{" "}
								</td>
								<td className="cell-style">UHT</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["UHT"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["UHT"] ?? ""}{" "}
								</td>
								<td className="cell-style">OHT</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["OHT"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["OHT"] ?? ""}{" "}
								</td>
								<td className="cell-style">UHT</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["UHT"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["UHT"] ?? ""}{" "}
								</td>
							</tr>

							<tr>
								<td className="cell-style">NF</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["NF"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["NF"] ?? ""}{" "}
								</td>
								<td className="cell-style">WF</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["WF"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["WF"] ?? ""}{" "}
								</td>
								<td className="cell-style">NF</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["NF"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["NF"] ?? ""}{" "}
								</td>
								<td className="cell-style">WF</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["WF"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["WF"] ?? ""}{" "}
								</td>
							</tr>

							<tr>
								<td className="cell-style">TF(+)</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["TF(+)"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["TF(+)"] ?? ""}{" "}
								</td>
								<td className="cell-style">TF(-)</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["TF(-)"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["TF(-)"] ?? ""}{" "}
								</td>
								<td className="cell-style">TF(+)</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["TF(+)"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["TF(+)"] ?? ""}{" "}
								</td>
								<td className="cell-style">TF(-)</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["TF(-)"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["TF(-)"] ?? ""}{" "}
								</td>
							</tr>

							<tr>
								<td className="cell-style">HF(+)</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["HF(+)"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["HF(+)"] ?? ""}{" "}
								</td>
								<td className="cell-style">HF(-)</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["HF(-)"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["HF(-)"] ?? ""}{" "}
								</td>
								<td className="cell-style">HF(+)</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["HF(+)"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["HF(+)"] ?? ""}{" "}
								</td>
								<td className="cell-style">HF(-)</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["HF(-)"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["HF(-)"] ?? ""}{" "}
								</td>
							</tr>

							<tr>
								<td className="cell-style">HS</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["HS"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["HS"] ?? ""}{" "}
								</td>
								<td className="cell-style">LS</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["LS"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["LS"] ?? ""}{" "}
								</td>
								<td className="cell-style">HS</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["HS"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["HS"] ?? ""}{" "}
								</td>
								<td className="cell-style">LS</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["LS"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["LS"] ?? ""}{" "}
								</td>
							</tr>

							<tr>
								<td className="cell-style">TNW</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["TNW"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["TNW"] ?? ""}{" "}
								</td>
								<td className="cell-style">TKW</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect13m?.["TKW"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls52?.defect26m?.["TKW"] ?? ""}{" "}
								</td>
								<td className="cell-style">TNW</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["TNW"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["TNW"] ?? ""}{" "}
								</td>
								<td className="cell-style">TKW</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect13m?.["TKW"] ?? ""}{" "}
								</td>
								<td className="cell-style">
									{" "}
									{formData?.cls60?.defect26m?.["TKW"] ?? ""}{" "}
								</td>
							</tr>
			 

							<tr>
                <td className="cell-style">LAP</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["LAP"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["LAP"] ?? ""}{" "}
                </td>
                <td className="cell-style">WS</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["WS"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["WS"] ?? ""}{" "}
                </td>
                <td className="cell-style">LAP</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["LAP"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["LAP"] ?? ""}{" "}
                </td>
                <td className="cell-style">WS</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["WS"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["WS"] ?? ""}{" "}
                </td>
              </tr>


							<tr>
                <td className="cell-style">GM</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["GM"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["GM"] ?? ""}{" "}
                </td>
                <td className="cell-style">HNP</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["HNP"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["HNP"] ?? ""}{" "}
                </td>
                <td className="cell-style">GM</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["GM"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["GM"] ?? ""}{" "}
                </td>
                <td className="cell-style">HNP</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["HNP"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["HNP"] ?? ""}{" "}
                </td>
              </tr>





							<tr>
                <td className="cell-style">ASY(+)</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["ASY(+)"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["ASY(+)"] ?? ""}{" "}
                </td>
                <td className="cell-style">ASY(-)</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["ASY(-)"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["ASY(-)"] ?? ""}{" "}
                </td>
                <td className="cell-style">ASY(+)</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["ASY(+)"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["ASY(+)"] ?? ""}{" "}
                </td>
                <td className="cell-style">ASY(-)</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["ASY(-)"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["ASY(-)"] ?? ""}{" "}
                </td>
              </tr>

              <tr>
                <td className="cell-style">SL</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["SL"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["SL"] ?? ""}{" "}
                </td>
                <td className="cell-style">OS</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["OS"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["OS"] ?? ""}{" "}
                </td>
                <td className="cell-style">SL</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["SL"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["SL"] ?? ""}{" "}
                </td>
                <td className="cell-style">OS</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["OS"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["OS"] ?? ""}{" "}
                </td>
              </tr>



							<tr>
                <td className="cell-style">OHT</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["OHT"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["OHT"] ?? ""}{" "}
                </td>
                <td className="cell-style">NHN</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["NHN"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["NHN"] ?? ""}{" "}
                </td>
                <td className="cell-style">OHT</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["OHT"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["OHT"] ?? ""}{" "}
                </td>
                <td className="cell-style">NHN</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["NHN"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["NHN"] ?? ""}{" "}
                </td>
              </tr>


							<tr>
                <td className="cell-style">BM</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["BM"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["BM"] ?? ""}{" "}
                </td>
                <td className="cell-style">SCB</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["SCB"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["SCB"] ?? ""}{" "}
                </td>
                <td className="cell-style">BM</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["BM"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["BM"] ?? ""}{" "}
                </td>
                <td className="cell-style">SCB</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["SCB"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["SCB"] ?? ""}{" "}
                </td>
              </tr>

              <tr>
                <td className="cell-style">BR</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["BR"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["BR"] ?? ""}{" "}
                </td>
                <td className="cell-style">NS</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["NS"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["NS"] ?? ""}{" "}
                </td>
                <td className="cell-style">BR</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["BR"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["BR"] ?? ""}{" "}
                </td>
                <td className="cell-style">NS</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["NS"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["NS"] ?? ""}{" "}
                </td>
              </tr>

              <tr>
                <td className="cell-style">RM</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["RM"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["RM"] ?? ""}{" "}
                </td>
                <td className="cell-style">UT</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["UT"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["UT"] ?? ""}{" "}
                </td>
                <td className="cell-style">RM</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["RM"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["RM"] ?? ""}{" "}
                </td>
                <td className="cell-style">UT</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["UT"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["UT"] ?? ""}{" "}
                </td>
              </tr>

              <tr>
                <td className="cell-style">C-R/C</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["C-R/C"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["C-R/C"] ?? ""}{" "}
                </td>
                <td className="cell-style">OTHER</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect13m?.["Other"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls52?.defect26m?.["Other"] ?? ""}{" "}
                </td>
                <td className="cell-style">C-R/C</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["C-R/C"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["C-R/C"] ?? ""}{" "}
                </td>
                <td className="cell-style">OTHER</td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect13m?.["Other"] ?? ""}{" "}
                </td>
                <td className="cell-style">
                  {" "}
                  {formData?.cls60?.defect26m?.["Other"] ?? ""}{" "}
                </td>
              </tr>


							<tr>
								<td  colSpan={3} className="cell-style">REMARKS / ABNORMALITY</td>
								<td colSpan={12} rowSpan={4} className="cell-style">
									<div className="flex justify-end items-end mt-8">

									हस्ताक्षर / Signature: .............................................................. <br /> <br />
									नाम/ Name: ..........................................................................
									</div>
								</td>
							</tr>

							<tr>
								<td className="cell-style">STATUS</td>
								<td className="cell-style">13M</td>
								<td className="cell-style">26M</td>
							</tr>

							<tr>
								<td className="cell-style">UTNP</td>
								<td className="cell-style"></td>
								<td className="cell-style"></td>
							</tr>
							<tr>
								<td className="cell-style">UTNP(R)</td>
								<td className="cell-style"></td>
								<td className="cell-style"></td>
							</tr>
							



						</tbody>
					</table>
				</div>
			</div>
			<Button
				onClick={handlePrint}
				className="my-8 w-full mx-auto bg-darkBlueHover text-white"
			>
				Print
			</Button>
		</>
	);
};

export default SriFinalInsp;
