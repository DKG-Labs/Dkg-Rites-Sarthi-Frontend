/**
 * FINAL Production PKI Digital Signature Bridge
 * Works with local Browser Signing Solution (127.0.0.1:1620)
 */

let isSigning = false;

function getSafeFileName(name) {
    if (!name) return "signed_certificate.pdf";
    return name
        .replace(/[\/\\:*?"<>|]/g, "_")
        .trim()
        .replace(/\.pdf$/i, "") + ".pdf";
}

window.abc = async function (xmlRequest, certificateNo, fileName) {
    if (isSigning) {
        console.warn("[PKI] Signature already in progress...");
        return;
    }

    const safeFileName = getSafeFileName(fileName || certificateNo);
    const notify = (status, message, signedData = null) => {
        window.dispatchEvent(new CustomEvent("pki-status", {
            detail: { status, message, signedData, certificateNo, fileName: safeFileName }
        }));
    };

    let previewTab = null;

    try {
        isSigning = true;
        notify("info", "Please connect USB token and enter PIN in popup");

        // Open preview window early to bypass popup blockers
        previewTab = window.open("about:blank", "_blank");
        if (!previewTab) {
            throw new Error("Popup blocked. Please allow popups for this site to sign PDFs.");
        }

        // 1. Mandatory Schema Validation
        if (!xmlRequest || !xmlRequest.includes("<request>") || (!xmlRequest.includes("<fileData>") && !xmlRequest.includes("<data>"))) {
            throw new Error("Invalid PKI Request: Missing mandatory tags.");
        }

        // 2. Strict PDF Validation
        if (!xmlRequest.includes("JVBER")) {
            throw new Error("Invalid PKI Request: PDF payload is missing or malformed (JVBER not found).");
        }

        // 3. XML Purification (Remove ALL whitespace between tags for Capricorn)
        xmlRequest = xmlRequest.replace(/>\s+</g, "><").trim();
        
        console.log("[PKI] TRANSMITTING XML TO BRIDGE...");

        // 4. Send to Local Capricorn Bridge
        const response = await fetch("http://127.0.0.1:1620", {
            method: "POST",
            headers: { "Content-Type": "application/xml" },
            body: xmlRequest
        });

        if (!response.ok) {
            throw new Error("Capricorn Bridge responded with an error (" + response.status + ")");
        }

        const pkiResponse = await response.text();
        console.log("[PKI] BRIDGE RESPONSE RECEIVED");

        const parser = new DOMParser();
        const xml = parser.parseFromString(pkiResponse, "text/xml");
        const status = xml.getElementsByTagName("status")[0]?.textContent;

        if (status !== "success" && status !== "ok") {
            const errorElement = xml.getElementsByTagName("error")[0];
            const errorCode = errorElement?.getAttribute("code") || "Unknown";
            const errorMsg = errorElement?.textContent || "Signing rejected by user or token error.";
            throw new Error(`PKI Error ${errorCode}: ${errorMsg}`);
        }

        // 5. Extract Signed Data
        let signedData = 
            xml.getElementsByTagName("signedData")[0]?.textContent ||
            xml.getElementsByTagName("fileData")[0]?.textContent ||
            xml.getElementsByTagName("data")[0]?.textContent;

        if (signedData) {
            signedData = signedData.replace(/\s+/g, "");
        }

        if (!signedData || !signedData.startsWith("JVBER")) {
            throw new Error("Invalid signed PDF received: Missing JVBER header.");
        }

        // 6. Base64 -> Blob -> URL
        const byteCharacters = atob(signedData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        // 7. Preview & Download
        previewTab.location.href = url;

        const link = document.createElement("a");
        link.href = url;
        link.download = safeFileName;
        
        // Wait slightly for browser to register the blob URL
        setTimeout(() => {
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notify("success", "Digital Signature Applied Successfully", signedData);
        }, 500);

    } catch (err) {
        console.error("[PKI BRIDGE ERROR]:", err);
        if (previewTab) previewTab.close();

        const message = err.message.includes("Failed to fetch")
            ? "Capricorn Bridge not detected. Please ensure 'Browser Signing Solution' is running."
            : err.message;

        notify("error", message);
        alert("Digital Signature Error: " + message);

    } finally {
        isSigning = false;
    }
};


/**
 * FIXED PDF VIEWER (IMPORTANT)
 * Uses <fileData> OR <data> (handles both)
 */
window.viewPDF = function (xmlData, fileName) {
    try {
        const safeFileName = getSafeFileName(fileName);

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, "text/xml");

        // ✅ SUPPORT ALL KNOWN TAGS (HARDENED FIX)
        const fileData =
            xmlDoc.getElementsByTagName("pdfData")[0]?.textContent ||
            xmlDoc.getElementsByTagName("signedData")[0]?.textContent ||
            xmlDoc.getElementsByTagName("fileData")[0]?.textContent ||
            xmlDoc.getElementsByTagName("data")[0]?.textContent;

        if (!fileData || !fileData.startsWith("JVBER")) {
            throw new Error("Invalid PDF data: Missing JVBER header.");
        }

        const byteCharacters = atob(fileData);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        const url = URL.createObjectURL(blob);

        window.open(url, "_blank");

        const link = document.createElement("a");
        link.href = url;
        link.download = safeFileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (err) {
        console.error("[VIEW PDF ERROR]:", err);
        alert("Failed to view PDF: " + err.message);
    }
};

/**
 * FETCH CERTIFICATE LIST (MANDATORY for PE-02 Fix)
 * Queries local bridge for all available DSC certificates
 */
window.getPKICertificates = async function () {
    try {
        const getBridgeTimestamp = () => {
            const now = new Date();
            const pad = (num) => String(num).padStart(2, '0');
            // Format: YYYY-MM-DDTHH:mm:ss+05:30
            const iso = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
                        'T' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
            return iso + "+05:30"; // Explicit Indian Standard Time Offset
        };

        const ts = getBridgeTimestamp();
        const txn = "SARTHI" + Date.now();
        
        // 🔥 Restrictive Discovery with Mandatory Reference Attribute
        let xmlRequest = `<request><command>pkiNetworkCert</command><ts>${ts}</ts><txn>${txn}</txn><certificateType>Both</certificateType></request>`;
        
        console.log("[PKI] PURIFIED REQUEST XML:", xmlRequest);

        const response = await fetch("http://127.0.0.1:1620", {
            method: "POST",
            headers: { "Content-Type": "application/xml" },
            body: xmlRequest
        });

        if (!response.ok) throw new Error("PKI Bridge not responding. Please ensure USB token app is running.");

        const xmlText = await response.text();
        console.log("[PKI] RAW BRIDGE RESPONSE (GET_CERTIFICATES):", xmlText);

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const status = xmlDoc.getElementsByTagName("status")[0]?.textContent;

        if (status !== "success") {
            const error = xmlDoc.getElementsByTagName("error")[0]?.textContent || "Failed to fetch certificates";
            console.error("[PKI] Bridge Error Response:", xmlText);
            throw new Error(error);
        }

        const certNodes = xmlDoc.getElementsByTagName("certificate");
        const certificates = [];
        const seenIds = new Set();

        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        for (let i = 0; i < certNodes.length; i++) {
            const certId = certNodes[i].getElementsByTagName("id")[0]?.textContent || 
                           certNodes[i].getElementsByTagName("alias")[0]?.textContent || 
                           certNodes[i].getElementsByTagName("serialNumber")[0]?.textContent;

            const subject = certNodes[i].getElementsByTagName("subject")[0]?.textContent;
            const issuer = certNodes[i].getElementsByTagName("issuer")[0]?.textContent;

            // 🔥 STRICT FILTERING (Resolves PE-02)
            if (!certId || !subject || !issuer) continue; // Skip incomplete
            if (guidRegex.test(certId)) continue; // Skip system GUIDs
            if (certId.toLowerCase().startsWith("trust_")) continue; // Skip trust roots
            if (seenIds.has(certId)) continue; // Skip duplicates

            seenIds.add(certId);
            certificates.push({
                certId: certId,
                subject: subject,
                issuer: issuer
            });
        }

        if (certificates.length === 0) {
            throw new Error("No valid DSC certificates found. Please ensure USB token is connected and correctly registered.");
        }

        return certificates;
    } catch (err) {
        console.error("[PKI] Certificate Fetch Error:", err);
        throw err;
    }
};