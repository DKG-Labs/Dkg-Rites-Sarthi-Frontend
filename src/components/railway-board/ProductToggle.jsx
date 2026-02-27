import React from 'react';

const ProductToggle = ({ selectedProduct, setSelectedProduct }) => {

    // Filter out 'all' if the user only wants specific toggles as per image, 
    // but usually 'All' is needed to clear filters. 
    // The image showed 4 specific buttons. 
    // If I click one, it selects it. If I click it again, does it deselect? 
    // Usually toggle groups work like radio buttons.
    // I will include 'all' but maybe visually separate or just include it as the first option.
    // The user image showed: [ERC] [PSC Sleeper] ... 
    // It didn't explicitly show 'All'. 
    // However, existing logic has 'all'. 
    // I'll stick to the requested 4 buttons. If none matches 'active', maybe none are highlighted?
    // But selectedProduct defaults to 'all'. 
    // Let's render the specific 4. If selectedProduct is 'all', none are active? 
    // Or maybe we treat one as default? 
    // Let's add 'All' as the first option to be safe and consistent with FilterBar.

    // Actually, looking at the screenshot again (if I could), it usually helps to have an "All".
    // I will implement the 4 specific ones + All.

    const displayProducts = [
        { id: 'ERC', label: 'ERC' },
        { id: 'PSC Sleeper', label: 'PSC Sleeper' },
        { id: 'Rail Pad', label: 'Rail Pad' },
        { id: 'Elastomeric Pad', label: 'Elastomeric Pad' }
    ];

    return (
        <div className="product-toggle-container">
            {/* <button
                className={`product-toggle-btn ${selectedProduct === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedProduct('all')}
            >
                All Products
            </button> */}
            {displayProducts.map(prod => (
                <button
                    key={prod.id}
                    className={`product-toggle-btn ${selectedProduct === prod.id ? 'active' : ''}`}
                // onClick={() => setSelectedProduct(prod.id)} // Disabled as per request
                >
                    {prod.label}
                </button>
            ))}
        </div>
    );
};

export default ProductToggle;
