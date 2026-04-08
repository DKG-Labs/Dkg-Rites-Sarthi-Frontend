/**
 * FINAL Production PKI Digital Signature Bridge
 * Works with local Browser Signing Solution (127.0.0.1:1620)
 */

let isSigning = false;

function getSafeFileName(name) {
    if (!name) return "signed.pdf";
    return name
        .replace(/[\/\\:*?"<>|]/g, "_")
        .trim()
        .replace(/\.pdf$/i, "") + ".pdf";
}

window.abc = async function (xmlRequest, certificateNo) {
    if (isSigning) {
        console.warn("Signature already in progress...");
        return;
    }

    const safeFileName = getSafeFileName(certificateNo);

    const notify = (status, message) => {
        window.dispatchEvent(new CustomEvent("pki-status", {
            detail: { status, message }
        }));
    };

    let previewTab = null;

    try {
        isSigning = true;

        notify("info", "Please connect USB token and enter PIN in popup");

        // Open tab early (popup blocker bypass)
        previewTab = window.open("about:blank", "_blank");

        if (!previewTab) {
            alert("Please allow popups for this site.");
            return;
        }

        console.log("[PKI] Sending request to local service...");

        // 🔥 SEND TO PKI
        const response = await fetch("http://127.0.0.1:1620/", {
            method: "POST",
            headers: {
                "Content-Type": "application/xml"
            },
            body: xmlRequest
        });

        const pkiResponse = await response.text();

        console.log("PKI RAW RESPONSE:", pkiResponse);

        // 🔥 PARSE RESPONSE
        const parser = new DOMParser();
        const xml = parser.parseFromString(pkiResponse, "text/xml");

        const status = xml.getElementsByTagName("status")[0]?.textContent;
        const signedData = xml.getElementsByTagName("signedData")[0]?.textContent;
        const error = xml.getElementsByTagName("error")[0]?.textContent;

        if (status !== "success") {
            throw new Error(error || "Digital signature failed");
        }

        if (!signedData || !signedData.startsWith("JVBER")) {
            throw new Error("Invalid signed PDF received");
        }

        // 🔥 BASE64 → PDF
        const byteCharacters = atob(signedData);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        const url = URL.createObjectURL(blob);

        // Preview
        previewTab.location.href = url;

        // Download
        const link = document.createElement("a");
        link.href = url;
        link.download = safeFileName;

        setTimeout(() => {
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            notify("success", "Digital Signature Applied Successfully");
        }, 300);

    } catch (err) {
        console.error("[PKI ERROR]:", err);

        if (previewTab) previewTab.close();

        const message = err.message.includes("Failed to fetch")
            ? "Please start Browser Signing Solution and connect USB token."
            : err.message;

        notify("error", message);
        alert("Digital Signature Failed: " + message);

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

        // ✅ SUPPORT BOTH TAGS (IMPORTANT FIX)
        const fileData =
            xmlDoc.getElementsByTagName("fileData")[0]?.textContent ||
            xmlDoc.getElementsByTagName("data")[0]?.textContent;

        if (!fileData || !fileData.startsWith("JVBER")) {
            throw new Error("Invalid PDF data");
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