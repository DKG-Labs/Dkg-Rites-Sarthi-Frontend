/**
 * Production PKI Digital Signature Bridge
 * Exclusively supports Capricorn Signer with physical USB token.
 */

let isSigning = false;

/**
 * Helper to sanitize filename for OS compatibility
 * Replace: / \ : * ? " < > | with "_"
 */
function getSafeFileName(name) {
    if (!name) return "signed.pdf";
    return name
        .replace(/[\/\\:*?"<>|]/g, "_")
        .trim()
        .replace(/\.pdf$/i, "") + ".pdf";
}

/**
 * Main E-Sign Entry Point
 * @param {string} xmlData - The XML payload from backend
 * @param {string} fileName - The desired filename (Certificate Number)
 */
window.abc = async function(xmlData, fileName) {
    if (isSigning) {
        console.warn("Signature request already in progress...");
        return;
    }

    const safeFileName = getSafeFileName(fileName);
    console.log(`[PKI Bridge] Starting E-Sign flow. Mode: PRODUCTION`);
    console.log("Final Download File:", safeFileName);
    
    // 1. Popup Blocker Mitigation: Open blank tab immediately
    const previewTab = window.open('about:blank', '_blank');
    if (!previewTab) {
        alert("Please allow popups for this site to preview the certificate.");
        return;
    }

    const notify = (status, message) => {
        window.dispatchEvent(new CustomEvent('pki-status', { 
            detail: { status, message } 
        }));
    };

    try {
        isSigning = true;
        
        // 2. Strict XML Validation
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, "text/xml");
        
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            throw new Error("Invalid XML structure received from server.");
        }

        const command = xmlDoc.getElementsByTagName("command")[0]?.textContent;
        const txnId = xmlDoc.getElementsByTagName("txn")[0]?.textContent;
        const fileData = xmlDoc.getElementsByTagName("fileData")[0]?.textContent;

        if (!command || !txnId || !fileData) {
            throw new Error("Missing mandatory XML elements (command/txn/fileData).");
        }

        // 3. Integrity Check: JVBER (%PDF) header
        if (!fileData.startsWith("JVBER")) {
            throw new Error("Invalid PDF payload detected (Missing JVBER header).");
        }

        // 4. Size Guard (5MB limit)
        const sizeInMB = (fileData.length * 3 / 4) / (1024 * 1024);
        console.log(`[PKI Bridge] Txn: ${txnId}, Size: ${sizeInMB.toFixed(2)} MB`);
        if (sizeInMB > 5) {
            throw new Error("Payload exceeds the 5MB digital signature limit.");
        }

        notify('info', "Please connect your USB token and enter PIN to sign.");

        let signerResponse;

        // 5. Strict Production Signing Execution
        console.log("[PKI Bridge] Calling CapricornSigner...");
        if (typeof window.CapricornSigner === 'undefined' || !window.CapricornSigner.sign) {
            throw new Error("Digital signer not detected. Please ensure Capricorn extension is installed and USB token is connected.");
        }

        // Execute signing with a 30s timeout for user PIN entry
        signerResponse = await Promise.race([
            window.CapricornSigner.sign(xmlData),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Signing timed out. Please ensure your USB token is connected and try again.")), 30000))
        ]);

        console.log("[PKI Bridge] Signer Response Received.");

        // 6. Process Signer Response
        const responseDoc = parser.parseFromString(signerResponse, "text/xml");
        const status = responseDoc.getElementsByTagName("status")[0]?.textContent;
        const signedData = responseDoc.getElementsByTagName("signedData")[0]?.textContent;

        if (status !== "success" || !signedData) {
            const errorMsg = responseDoc.getElementsByTagName("error")[0]?.textContent || "Signer rejected the request.";
            throw new Error(errorMsg);
        }

        // 7. Base64 Integrity Check
        if (!signedData.startsWith("JVBER")) {
            throw new Error("Signed response is not a valid PDF.");
        }

        // 8. Convert to Blob (Uint8Array method)
        const byteCharacters = atob(signedData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobURL = URL.createObjectURL(blob);

        // 9. Synchronized Delivery: Preview + Download
        previewTab.location.href = blobURL;
        
        const link = document.createElement('a');
        link.href = blobURL;
        link.download = safeFileName;
        
        setTimeout(() => {
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notify('success', "Digital Signature Applied Successfully!");
        }, 300);

    } catch (error) {
        console.error("[PKI Bridge] Error:", error.message);
        if (previewTab) previewTab.close();
        notify('error', `Digital Signature Failed: ${error.message}`);
    } finally {
        isSigning = false;
    }
};

/**
 * Standalone PDF Viewer (Reuses hardened filename logic)
 */
window.viewPDF = function(xmlData, fileName) {
    try {
        const safeFileName = getSafeFileName(fileName);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, "text/xml");
        const fileData = xmlDoc.getElementsByTagName("fileData")[0]?.textContent;

        if (!fileData || !fileData.startsWith("JVBER")) {
            throw new Error("Invalid PDF data.");
        }

        const byteCharacters = atob(fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobURL = URL.createObjectURL(blob);

        window.open(blobURL, '_blank');
        
        const link = document.createElement('a');
        link.href = blobURL;
        link.download = safeFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log("Final View File:", safeFileName);
    } catch (error) {
        console.error("[PKI Bridge] Viewer Error:", error.message);
        alert("Failed to view PDF: " + error.message);
    }
};
