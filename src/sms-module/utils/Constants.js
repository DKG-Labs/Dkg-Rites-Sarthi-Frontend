/* eslint-disable */
export const regexMatch = {
    intRegex: /^\d+$/,
    floatRegex: /^-?\d+(\.\d+)?$/
}

export const TENSILE_FOOT = "Tensile Foot";
export const TENSILE = "Tensile";
export const PH = "PH";
export const MICRO = "Micro";
export const MACRO = "Macro";
export const TLT = "TLT";
export const HARDNESS = "Hardness";
export const DECARB = "Decarb"

export const RG_880 = "880"
export const RG_880NC = "880NC"
export const RG_R260 = "R260"
export const RG_R350HT = "R350HT"
export const RG_1080HH = "1080HH"

export const FATIGUE = "FATIGUE"
export const RESIDUAL = "RESIDUAL"
export const FCGR = "FCGR"
export const FRACTURE_TOUGHNESS = "FRACTURE_TOUGHNESS"
export const CENTER_LINE_RSH = "CENTER_LINE_RSH"

export const qctTestList = [
    {
        key: "FATIGUE",
        value: 'Fatigue'
    },
    {
        key: "RESIDUAL",
        value: 'Residual'
    },
    {
        key: "FCGR",
        value: 'FCGR'
    },
    {
        key: "FRACTURE_TOUGHNESS",
        value: 'Fracture Toughness'
    },
    {
        key: "CENTER_LINE_RSH",
        value: 'Center Line RSH'
    },
]

export const testStatusDropdown = [
    {
        label: "ACCEPTED",
        value: "ACCEPTED"
    },
    {
        label: "REJECTED",
        value: "REJECTED"
    },
    {
        label: "RETEST",
        value: "RETEST"
    }
]
