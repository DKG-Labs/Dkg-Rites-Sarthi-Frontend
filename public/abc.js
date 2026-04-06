/**
 * Capricon Identity Services - Production PKI Bridge
 * This version uses Web Events instead of alerts for a professional UI.
 */
window.abc = function(data, fileName) {
    console.log("Initiating E-Sign for file:", fileName);
    
    // Helper to send events back to React
    const notify = (status, message) => {
        window.dispatchEvent(new CustomEvent('pki-status', { 
            detail: { status, message } 
        }));
    };

    const url = "http://localhost:1620/";
    
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(data)
    })
    .then(response => response.text())
    .then(pkiResponse => {
        console.log("PKI Response Received:", pkiResponse);
        if (pkiResponse.includes("success")) {
            notify('success', "Digital Signature Applied Successfully!");
        } else {
             const parser = new DOMParser();
             const xmlDoc = parser.parseFromString(pkiResponse, "text/xml");
             const errorMsg = xmlDoc.getElementsByTagName("error")[0]?.textContent || "Signature failed";
             notify('error', "Digital Signature Failed: " + errorMsg);
        }
    })
    .catch(error => {
        notify('error', "Could not connect to Capricorn. Please ensure the signing software is running.");
    });
};
