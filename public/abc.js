/**
 * Production PKI Digital Signature Bridge
 * Integrates with Browser Signing Solution running locally on port 1620.
 * Refactored for direct localhost FETCH (No Browser Extension Required).
 */

let isSigning = false;

/**
 * Helper to sanitize filename for OS compatibility
 * Replace: / \ : * ? " < > | with "_"
 * Ensure .pdf extension
 */
function getSafeFileName(name) {
    if (!name) return "signed_certificate.pdf";
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
        console.warn("[PKI Bridge] Signature request already in progress...");
        return;
    }

    const safeFileName = getSafeFileName(fileName);
    const notify = (status, message) => {
        window.dispatchEvent(new CustomEvent('pki-status', { 
            detail: { status, message } 
        }));
    };

    console.log(`[PKI Bridge] Starting Local E-Sign flow. Target: http://127.0.0.1:1620/`);
    
    try {
        isSigning = true;
        notify('info', "Preparing digital signature... Please check your taskbar for the PKI popup.");

        // 1. Timeout Controller (15 Seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let response;
        // 2. Direct Local PKI Call
        console.info(`[PKI-DEBUG] Sending XML to Local Bridge:`, xmlData);
        
        try {
            response = await fetch("http://127.0.0.1:1620/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/xml"
                },
                body: xmlData,
                signal: controller.signal
            });
        } catch (fetchError) {
            if (fetchError.name === 'AbortError') {
                throw new Error("PKI service not responding. Please restart Browser Signing Solution.");
            }
            // Mixed content or network error
            throw new Error("Please start Browser Signing Solution and connect USB token. (If already running, ensure browser allows local connections)");
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            throw new Error(`PKI Service Error: ${response.statusText}`);
        }

        const responseXml = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(responseXml, "text/xml");

        // 3. Parse Response XML & Safety Check
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            throw new Error("Invalid response from PKI service.");
        }

        const status = xmlDoc.getElementsByTagName("status")[0]?.textContent;
        const signedData = xmlDoc.getElementsByTagName("signedData")[0]?.textContent;
        const errorMsg = xmlDoc.getElementsByTagName("error")[0]?.textContent;

        // 4. Validate Business Logic
        if (status !== "success") {
            if (errorMsg && errorMsg.toLowerCase().includes("token not found")) {
                throw new Error("USB token not detected.");
            }
            throw new Error(errorMsg || "Signer rejected the request.");
        }

        if (!signedData) {
            throw new Error("No signed data received from PKI service.");
        }

        // 5. Hardened PDF Validation (JVBER = %PDF)
        if (!signedData.startsWith("JVBER")) {
            throw new Error("Corrupted signed PDF received (Invalid JVBER header).");
        }

        // Trial Decode to catch corrupted Base64
        try {
            atob(signedData);
        } catch (e) {
            throw new Error("Corrupted signed PDF received (Base64 Decode Failed).");
        }

        // 6. Convert to PDF Blob
        const byteCharacters = atob(signedData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobURL = URL.createObjectURL(blob);

        // 7. Preview + Download Delivery
        // Open preview in new tab
        window.open(blobURL, '_blank');
        
        // Trigger download
        const link = document.createElement('a');
        link.href = blobURL;
        link.download = safeFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        notify('success', "Digital Signature Applied Successfully!");
        console.log(`[PKI Bridge] Flow complete. File: ${safeFileName}`);

    } catch (error) {
        console.error("[PKI Bridge] Error:", error.message);
        
        // Final Friendly Error Mapping
        let finalMessage = error.message;
        if (finalMessage.includes("Failed to fetch")) {
            finalMessage = "Browser blocked local PKI call. Please use Chrome and allow local connections.";
        }
        
        notify('error', finalMessage);
    } finally {
        isSigning = false;
    }
};

/**
 * Standalone PDF Viewer
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
        
    } catch (error) {
        console.error("[PKI Bridge] Viewer Error:", error.message);
        alert("Failed to view PDF: " + error.message);
    }
};
