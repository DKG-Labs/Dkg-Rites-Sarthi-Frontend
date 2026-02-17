export const TOLERANCE_RULES = {
    weight: {
        'MK III': { min: 904, max: 937 },
        'MK V': { min: 1068, max: 1108 }
    },
    toeLoad: {
        'MK III': { min: 850, max: 1100 },
        'MK V': { min: 1200, max: 1500 }
    },
    lengthCutBar: { min: 350, max: 351.5 },
    dia: {
        'MK III': { min: 20.47, max: 20.84 },
        'MK V': { min: 22.81, max: 23.23 }
    },
    forgingTemperature: { min: 900, max: Infinity },
    temperingTemperature: { min: 400, max: 550 },
    temperingHardness: { min: 40, max: 44 },
    quenchingTemperature: { min: -Infinity, max: 70 },
    turningDia: {
        'MK III': { min: 20.47, max: 20.84 },
        'MK V': { min: 20.47, max: 20.84 }
    },
    parallelLength: { min: 81.5, max: 82.5 },
    fullLength: { min: 89.5, max: 90.5 }
};

export const checkTolerance = (field, value, productType) => {
    if (value === '' || value === null || value === undefined) return { isValid: true, isApplicable: false };
    const num = parseFloat(value);
    if (isNaN(num)) return { isValid: false, isApplicable: true };

    const isMk3 = /MK-?III/i.test(productType || '');
    const isMkV = /MK-?V/i.test(productType || '');
    let rules = TOLERANCE_RULES[field];

    if (!rules) return { isValid: true, isApplicable: false };

    // Handle product-specific rules
    if (rules['MK III'] || rules['MK V']) {
        if (isMk3) rules = rules['MK III'];
        else if (isMkV) rules = rules['MK V'];
        else rules = null;
    }

    if (!rules) return { isValid: true, isApplicable: false };

    return {
        isValid: num >= rules.min && num <= rules.max,
        isApplicable: true
    };
};

export const getToleranceStyle = (field, value, productType) => {
    const { isValid, isApplicable } = checkTolerance(field, value, productType);
    if (!isApplicable) return {};
    return isValid ? { backgroundColor: '#dcfce7' } : { backgroundColor: '#fee2e2' };
};
