/* eslint-disable */
import { useState, useEffect } from 'react';
import { Table, Card, Modal, Image, message, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { getImageUrl, getFileName, isSupportedImageFormat } from '../utils/imageUtils';

const InspectionDataTable = ({
  dimensionalData = [],
  surfaceData = [],
  loading = false
}) => {
  const [dimensionalPageSize, setDimensionalPageSize] = useState(5);
  const [surfacePageSize, setSurfacePageSize] = useState(5);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentImageTitle, setCurrentImageTitle] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all images from surface data for navigation
  const getImagesWithData = () => {
    return surfaceData
      .map((item, index) => ({ ...item, originalIndex: index }))
      .filter(item => item.annotatedImage && isSupportedImageFormat(item.annotatedImage));
  };

  // Function to handle image viewing
  const handleImageView = (imagePath, title, imageIndex = 0) => {
    if (!imagePath) {
      message.error('Image path not available');
      return;
    }

    // Check if the path is a full URL or relative path
    let imageUrl = imagePath;
    if (!imagePath.startsWith('http') && !imagePath.startsWith('data:')) {
      // If it's a relative path, you might need to prepend your server URL
      // For now, we'll try to open it as is, but you may need to adjust this
      // based on where your images are served from
      imageUrl = imagePath;
    }

    setCurrentImageUrl(imageUrl);
    setCurrentImageTitle(title);
    setCurrentImageIndex(imageIndex);
    setImageModalVisible(true);
  };

  // Navigation functions
  const handleNextImage = () => {
    const images = getImagesWithData();
    if (images.length <= 1) return;

    const nextIndex = (currentImageIndex + 1) % images.length;
    const nextImage = images[nextIndex];
    const fileName = getFileName(nextImage.annotatedImage);
    const imageUrl = getImageUrl(nextImage.annotatedImage);

    setCurrentImageIndex(nextIndex);
    setCurrentImageUrl(imageUrl);
    setCurrentImageTitle(`Surface Inspection - Annotated - ${fileName}`);
  };

  const handlePrevImage = () => {
    const images = getImagesWithData();
    if (images.length <= 1) return;

    const prevIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
    const prevImage = images[prevIndex];
    const fileName = getFileName(prevImage.annotatedImage);
    const imageUrl = getImageUrl(prevImage.annotatedImage);

    setCurrentImageIndex(prevIndex);
    setCurrentImageUrl(imageUrl);
    setCurrentImageTitle(`Surface Inspection - Annotated - ${fileName}`);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!imageModalVisible) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevImage();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNextImage();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setImageModalVisible(false);
      }
    };

    if (imageModalVisible) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [imageModalVisible, currentImageIndex]);

  // Columns for Dimensional Inspection Table (4 columns)
  const dimensionalColumns = [
    {
      title: 'Camera Name',
      dataIndex: 'cameraName',
      key: 'cameraName',
      align: 'center',
      width: 120,
      render: (cameraName) => cameraName || 'Unknown',
    },
    {
      title: 'Distance From Head (m)',
      dataIndex: 'distanceFromHead',
      key: 'distanceFromHead',
      align: 'center',
      width: 150,
      render: (distanceFromHead) => {
        if (distanceFromHead === null || distanceFromHead === undefined) {
          return '-';
        }
        // Convert from cm to meters and format to 2 decimal places
        const distanceInMeters = (parseFloat(distanceFromHead) / 100).toFixed(2);
        return `${distanceInMeters} m`;
      },
    },

    {
      title: 'Defect Type',
      dataIndex: 'defectType',
      key: 'defectType',
      align: 'center',
      width: 150,
      render: (defectType) => {
        // Display exact database values
        if (defectType === null || defectType === undefined) {
          return 'null'; // Show "null" for null values
        }

        // Handle empty string
        if (defectType === '') {
          return ''; // Show empty for empty strings
        }

        // If it's a JSON string, parse it
        if (typeof defectType === 'string') {
          // Check if it's JSON format
          if (defectType.startsWith('[') || defectType.startsWith('{')) {
            try {
              const parsed = JSON.parse(defectType);
              if (Array.isArray(parsed)) {
                return parsed.join(', ');
              } else if (typeof parsed === 'object') {
                return Object.values(parsed).filter(v => v !== null && v !== undefined).join(', ');
              }
              return parsed.toString();
            } catch (e) {
              return defectType; // Return original string if JSON parsing fails
            }
          }
          // If it's a regular string, return as is
          return defectType;
        }

        // If it's already an object/array
        if (Array.isArray(defectType)) {
          return defectType.join(', ');
        }

        // For any other type, convert to string
        return String(defectType);
      },
    },
  ];

  // Columns for Surface Inspection Table (5 columns)
  const surfaceColumns = [
    {
      title: 'Camera Name',
      dataIndex: 'cameraName',
      key: 'cameraName',
      align: 'center',
      width: 120,
      render: (cameraName) => cameraName || 'Unknown',
    },
    {
      title: 'Defect Type',
      dataIndex: 'labelName',
      key: 'labelName',
      align: 'center',
      width: 150,
    },
    {
      title: 'Distance (m)',
      dataIndex: 'distance',
      key: 'distance',
      align: 'center',
      width: 120,
      render: (distance) => {
        // Convert cm to meters and format to 2 decimal places
        const distanceInMeters = (distance / 100).toFixed(2);
        return distanceInMeters;
      },
      sorter: (a, b) => a.distance - b.distance,
    },

    {
      title: 'Annotated Image',
      dataIndex: 'annotatedImage',
      key: 'annotatedImage',
      align: 'center',
      width: 120,
      render: (annotatedImage, record) => {
        if (!annotatedImage) {
          return '-';
        }

        // Check if it's a supported image format
        if (!isSupportedImageFormat(annotatedImage)) {
          return (
            <div style={{
              width: '60px',
              height: '40px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              fontSize: '10px',
              color: '#999',
              textAlign: 'center'
            }}>
              📄<br/>Unsupported
            </div>
          );
        }

        const fileName = getFileName(annotatedImage);
        const imageUrl = getImageUrl(annotatedImage);

        const handleImageClick = () => {
          // Find the index of this image in the filtered images array
          const images = getImagesWithData();
          const imageIndex = images.findIndex(img =>
            img.annotatedImage === annotatedImage &&
            img.id === record.id
          );
          handleImageView(imageUrl, `Surface Inspection - Annotated - ${fileName}`, imageIndex >= 0 ? imageIndex : 0);
        };

        return (
          <div
            onClick={handleImageClick}
            style={{
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            title={`Click to view full image: ${fileName}`}
          >
            <img
              src={imageUrl}
              alt="Annotated"
              style={{
                width: '60px',
                height: '40px',
                objectFit: 'cover',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
              onError={(e) => {
                console.error('Failed to load image:', imageUrl);
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `
                  <div style="
                    width: 60px;
                    height: 40px;
                    border: 1px solid #d9d9d9;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #f5f5f5;
                    font-size: 10px;
                    color: #999;
                    text-align: center;
                  ">
                    📷<br/>Not Found
                  </div>
                `;
              }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="inspection-data-tables">
      {/* Dimensional Inspection Table */}
      <Card
        title="Dimensional Inspection Data"
        className="mb-3"
        size="small"
        styles={{ body: { padding: '12px' } }}
      >
        <Table
          columns={dimensionalColumns}
          dataSource={dimensionalData}
          loading={loading}
          rowKey={(record, index) => `dimensional-${record.inspectionId || index}`}
          bordered
          size="small"
          pagination={{
            pageSize: dimensionalPageSize,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            size: 'small',
            showQuickJumper: false,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total}`,
            onShowSizeChange: (_, size) => setDimensionalPageSize(size),
          }}
          locale={{
            emptyText: 'No dimensional inspection data available'
          }}
        />
      </Card>

      {/* Surface Inspection Table */}
      <Card
        title="Surface Inspection Data"
        className="mb-3"
        size="small"
        styles={{ body: { padding: '12px' } }}
      >
        <Table
          columns={surfaceColumns}
          dataSource={surfaceData}
          loading={loading}
          rowKey={(record, index) => `surface-${record.id || index}`}
          bordered
          size="small"
          pagination={{
            pageSize: surfacePageSize,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            size: 'small',
            showQuickJumper: false,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total}`,
            onShowSizeChange: (_, size) => setSurfacePageSize(size),
          }}
          locale={{
            emptyText: 'No surface inspection data available'
          }}
        />
      </Card>

      {/* Image Viewer Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{currentImageTitle}</span>
            {getImagesWithData().length > 1 && (
              <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
                {currentImageIndex + 1} of {getImagesWithData().length}
              </span>
            )}
          </div>
        }
        open={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
        footer={null}
        width="80%"
        centered
        styles={{
          body: {
            padding: '20px',
            textAlign: 'center',
            position: 'relative'
          }
        }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Previous Image Button */}
          {getImagesWithData().length > 1 && (
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={handlePrevImage}
              style={{
                position: 'absolute',
                left: '-50px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
              }}
            />
          )}

          <Image
            src={currentImageUrl}
            alt={currentImageTitle}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain'
            }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
            preview={{
              mask: false,
            }}
          />

          {/* Next Image Button */}
          {getImagesWithData().length > 1 && (
            <Button
              type="text"
              icon={<RightOutlined />}
              onClick={handleNextImage}
              style={{
                position: 'absolute',
                right: '-50px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default InspectionDataTable;
