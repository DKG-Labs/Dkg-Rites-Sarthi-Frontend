import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import { processFeedbackApiService } from '../../services/processFeedbackApiService';
import Modal from '../../components/Modal';

const CACHE_KEY = 'draftDiscrepancyData';

const getCachedData = (key, defaultVal) => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed[key] || defaultVal;
    }
  } catch (e) {
    return defaultVal;
  }
  return defaultVal;
};

const CreateDiscrepancyModal = ({ onClose, onSuccess, showNotification, currentUserId, poiCode, defaultProductType = 'ERC' }) => {
  const [productType, setProductType] = useState(() => getCachedData('productType', defaultProductType));
  const [vendorCode, setVendorCode] = useState(() => getCachedData('vendorCode', ''));
  const [plantId, setPlantId] = useState(() => getCachedData('plantId', ''));
  const [poNumber, setPoNumber] = useState(() => getCachedData('poNumber', ''));
  const [category, setCategory] = useState(() => getCachedData('category', ''));
  const [subCategory, setSubCategory] = useState(() => getCachedData('subCategory', ''));
  const [urgency, setUrgency] = useState(() => getCachedData('urgency', ''));
  const [description, setDescription] = useState(() => getCachedData('description', ''));
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [vendorsList, setVendorsList] = useState([]);
  const [plantsList, setPlantsList] = useState([]);
  const [poList, setPoList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isVendorsLoading, setIsVendorsLoading] = useState(false);
  const [isPlantsLoading, setIsPlantsLoading] = useState(false);
  const [isPOsLoading, setIsPOsLoading] = useState(false);

  useEffect(() => {
    const data = { productType, vendorCode, plantId, poNumber, category, subCategory, urgency, description };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  }, [productType, vendorCode, plantId, poNumber, category, subCategory, urgency, description]);

  // Fetch Vendors when productType changes
  useEffect(() => {
    if (productType) {
      setIsVendorsLoading(true);
      processFeedbackApiService.fetchVendorsByProduct(productType)
        .then(data => {
          const vendors = data.responseData || [];
          const formattedVendors = vendors.map(v => ({
            ...v,
            vendorCode: (v.vendorCode && !v.vendorCode.startsWith(':')) ? `:${v.vendorCode}` : v.vendorCode
          }));
          setVendorsList(formattedVendors);
        })
        .catch(err => console.error("Error fetching vendors", err))
        .finally(() => setIsVendorsLoading(false));
    }
  }, [productType]);

  // Fetch Plants when vendorCode changes
  useEffect(() => {
    if (vendorCode) {
      setIsPlantsLoading(true);
      processFeedbackApiService.fetchPlantsByVendor(vendorCode)
        .then(data => setPlantsList(data.responseData || []))
        .catch(err => console.error("Error fetching plants", err))
        .finally(() => setIsPlantsLoading(false));
    }
  }, [vendorCode]);

  // Fetch POs when vendorCode and productType change
  useEffect(() => {
    if (vendorCode && productType) {
      setIsPOsLoading(true);
      processFeedbackApiService.fetchPOsByVendorAndProduct(vendorCode, productType)
        .then(data => {
            const list = data.responseData || [];
            // Assuming response has rlyShortName and poNo
            setPoList(list.map(item => `${item.rlyShortName} - ${item.poNo}`));
        })
        .catch(err => console.error("Error fetching POs", err))
        .finally(() => setIsPOsLoading(false));
    }
  }, [vendorCode, productType]);

  // Handle SubCategory mapping based on Product + Category
  useEffect(() => {
    if (category === 'Manual Error') {
        setSubCategoryList(['Lack of Skill', 'Lack of Seriousness']);
    } else if (category === 'STR') {
        if (productType === 'ERC') setSubCategoryList(['Shearing', 'Turning', 'MPI', 'Forging']);
        if (productType === 'Sleeper') setSubCategoryList(['Mould Cleaning', 'Wire Tensioning']);
        if (productType === 'Rail Pad') setSubCategoryList(['Batch Mixing']);
    } else {
        setSubCategoryList([]);
    }
  }, [category, productType]);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > 1024 || height > 1024) {
            if (width > height) {
              height *= 1024 / width;
              width = 1024;
            } else {
              width *= 1024 / height;
              height = 1024;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.7);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleFileChange = async (e) => {
    let file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        file = await compressImage(file);
      }
      
      if (file.size > 2 * 1024 * 1024) {
        showNotification('File size cannot exceed 2MB.', 'error');
        e.target.value = null; // Clear the input
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productType || !vendorCode || !poNumber || !category || !subCategory || !urgency || !description) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const discrepancyData = {
        createdBy: currentUserId,
        productType,
        vendorCode,
        plantId: plantId ? parseInt(plantId, 10) : null,
        poNumber,
        category,
        subCategory,
        urgency,
        description
      };

      await processFeedbackApiService.createDiscrepancy(discrepancyData, selectedFile, poiCode);
      
      localStorage.removeItem(CACHE_KEY); // Clear draft on success
      
      showNotification('Discrepancy created successfully.', 'success');
      onSuccess();
    } catch (error) {
      console.error("Error creating discrepancy", error);
      showNotification('Failed to create discrepancy.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create Process Inspection Discrepancy"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Submit'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="form-group">
            <label className="form-label required">Product Type</label>
            <Select 
              style={{ width: '100%', height: '38px' }} 
              value={productType} 
              onChange={(value) => {
                setProductType(value);
                setVendorCode('');
                setPlantId('');
                setPoNumber('');
                setSubCategory('');
              }}
            >
              <Select.Option value="ERC">ERC</Select.Option>
              <Select.Option value="SLEEPER">Sleeper</Select.Option>
              <Select.Option value="RAILPAD">Rail Pad</Select.Option>
            </Select>
          </div>
          <div className="form-group">
            <label>Vendor Code <span className="text-danger">*</span></label>
            <Select
              style={{ width: '100%', height: '38px' }}
              value={vendorCode || undefined}
              onChange={(value) => {
                setVendorCode(value);
                setPlantId('');
                setPoNumber('');
              }}
              placeholder="Select Vendor"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
              }
              loading={isVendorsLoading}
            >
              {vendorsList.map((v, idx) => (
                <Select.Option key={idx} value={v.vendorCode} label={`${v.vendorName} ${v.vendorCode}`}>
                  <div style={{ whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: '1.2', padding: '4px 0' }}>
                    {v.vendorName} ({v.vendorCode})
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="form-group">
            <label>Plant <span className="text-danger">*</span></label>
            <Select
              style={{ width: '100%', height: '38px' }}
              value={plantId || undefined}
              onChange={(value) => setPlantId(value)}
              disabled={!vendorCode}
              placeholder="Select Plant"
              loading={isPlantsLoading}
            >
              {plantsList.map((p, idx) => (
                <Select.Option key={idx} value={p.plantId}>
                  <div style={{ whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: '1.2', padding: '4px 0' }}>
                    {p.unitName}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="form-group">
            <label>PO Number <span className="text-danger">*</span></label>
            <Select
              style={{ width: '100%', height: '38px' }}
              value={poNumber || undefined}
              onChange={(value) => setPoNumber(value)}
              disabled={!vendorCode}
              placeholder="Select PO"
              loading={isPOsLoading}
            >
              {poList.map((po, idx) => (
                <Select.Option key={idx} value={po.split(' - ')[1]}>
                  <div style={{ whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: '1.2', padding: '4px 0' }}>
                    {po}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="form-group">
            <label>Category <span className="text-danger">*</span></label>
            <Select 
              style={{ width: '100%', height: '38px' }} 
              value={category || undefined} 
              onChange={(value) => {
                setCategory(value);
                setSubCategory('');
              }}
              placeholder="Select Category"
            >
              <Select.Option value="STR">STR</Select.Option>
              <Select.Option value="Manual Error">Manual Error</Select.Option>
            </Select>
          </div>

          <div className="form-group">
            <label>Sub Category <span className="text-danger">*</span></label>
            <Select
              style={{ width: '100%', height: '38px' }}
              value={subCategory || undefined}
              onChange={(value) => setSubCategory(value)}
              disabled={!category}
              placeholder="Select Sub Category"
            >
              {subCategoryList.map((sub, idx) => (
                <Select.Option key={idx} value={sub}>{sub}</Select.Option>
              ))}
            </Select>
          </div>

          <div className="form-group">
            <label>Urgency <span className="text-danger">*</span></label>
            <Select 
              style={{ width: '100%', height: '38px' }} 
              value={urgency || undefined} 
              onChange={(value) => setUrgency(value)}
              placeholder="Select Urgency"
            >
              <Select.Option value="Immediate">Immediate</Select.Option>
              <Select.Option value="Need based">Need based</Select.Option>
              <Select.Option value="Planned">Planned</Select.Option>
            </Select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Description <span className="text-danger">*</span></label>
            <textarea
              className="form-control"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>
          
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Photos/Documents Upload <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: 'normal' }}>(Max size: 2MB)</span></label>
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDiscrepancyModal;
