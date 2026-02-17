/**
 * IS 2500 Standard Calculations
 * Table 1: Sample Size based on Lot Size / No. of Bags
 * Table 2: Double Sampling for Dimension & Weight (AQL 2.5)
 * Table 2: Double Sampling for Hardness & Toe Load
 */

/* Table 1 - Sample Size based on Lot Size */
export const calculateSampleSize = (lotSize) => {
  const size = parseInt(lotSize, 10) || 0;
  if (size <= 0) return 0;
  if (size <= 8) return 2;
  if (size <= 15) return 3;
  if (size <= 25) return 5;
  if (size <= 50) return 8;
  if (size <= 90) return 13;
  if (size <= 150) return 20;
  if (size <= 280) return 32;
  if (size <= 500) return 50;
  if (size <= 1200) return 80;
  if (size <= 3200) return 125;
  if (size <= 10000) return 200;
  if (size <= 35000) return 315;
  if (size <= 150000) return 500;
  if (size <= 500000) return 800;
  return 1250;
};

/* Table 1 - Bags for Sampling based on Total Bags */
export const calculateBagsForSampling = (totalBags) => {
  return calculateSampleSize(totalBags);
};

/**
 * Table 2 - Double Sampling for Dimension & Weight (AQL 2.5)
 * Returns: { n1, ac1, re1, n2, cummRej, useSingleSampling }
 */
export const getDimensionWeightAQL = (lotSize) => {
  const size = parseInt(lotSize, 10) || 0;
  
  // 2-150: Double sampling not provided, use single sampling
  if (size <= 150) {
    return { n1: calculateSampleSize(size), ac1: 0, re1: 1, n2: 0, cummRej: 1, useSingleSampling: true };
  }
  if (size <= 280) return { n1: 20, ac1: 0, re1: 3, n2: 20, cummRej: 4, useSingleSampling: false };
  if (size <= 500) return { n1: 32, ac1: 1, re1: 3, n2: 32, cummRej: 5, useSingleSampling: false };
  if (size <= 1200) return { n1: 50, ac1: 2, re1: 5, n2: 50, cummRej: 7, useSingleSampling: false };
  if (size <= 3200) return { n1: 80, ac1: 3, re1: 6, n2: 125, cummRej: 10, useSingleSampling: false };
  if (size <= 10000) return { n1: 125, ac1: 5, re1: 9, n2: 200, cummRej: 13, useSingleSampling: false };
  if (size <= 35000) return { n1: 200, ac1: 7, re1: 11, n2: 315, cummRej: 19, useSingleSampling: false };
  if (size <= 150000) return { n1: 315, ac1: 11, re1: 16, n2: 500, cummRej: 27, useSingleSampling: false };
  if (size <= 500000) return { n1: 500, ac1: 11, re1: 16, n2: 800, cummRej: 27, useSingleSampling: false };
  return { n1: 500, ac1: 11, re1: 16, n2: 800, cummRej: 27, useSingleSampling: false };
};

/**
 * Table 2 - Double Sampling for Hardness & Toe Load
 * Returns: { n1, ac1, re1, n2, cummRej, useSingleSampling }
 */
export const getHardnessToeLoadAQL = (lotSize) => {
  const size = parseInt(lotSize, 10) || 0;
  
  // 2-150: Double sampling not provided, use single sampling
  if (size <= 150) {
    return { n1: calculateSampleSize(size), ac1: 0, re1: 1, n2: 0, cummRej: 1, useSingleSampling: true };
  }
  if (size <= 280) return { n1: 20, ac1: 0, re1: 2, n2: 20, cummRej: 2, useSingleSampling: false };
  if (size <= 500) return { n1: 32, ac1: 0, re1: 3, n2: 32, cummRej: 4, useSingleSampling: false };
  if (size <= 1200) return { n1: 50, ac1: 1, re1: 3, n2: 50, cummRej: 5, useSingleSampling: false };
  if (size <= 3200) return { n1: 125, ac1: 2, re1: 5, n2: 125, cummRej: 7, useSingleSampling: false };
  if (size <= 10000) return { n1: 200, ac1: 3, re1: 6, n2: 200, cummRej: 10, useSingleSampling: false };
  if (size <= 35000) return { n1: 315, ac1: 5, re1: 9, n2: 315, cummRej: 13, useSingleSampling: false };
  if (size <= 150000) return { n1: 500, ac1: 7, re1: 11, n2: 500, cummRej: 19, useSingleSampling: false };
  if (size <= 500000) return { n1: 800, ac1: 11, re1: 16, n2: 800, cummRej: 27, useSingleSampling: false };
  return { n1: 800, ac1: 11, re1: 16, n2: 800, cummRej: 27, useSingleSampling: false };
};

