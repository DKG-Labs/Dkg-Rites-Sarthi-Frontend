-- ============================================================
-- ERC Inspection Management System - Database Schema
-- Database: sarthiworkflow
-- Based on InspectionInitiationFormContent.js auto-fetched fields
-- Supports: Raw Material, Process Material, Final Product
-- ============================================================

-- ============================================================
-- USER AUTHENTICATION TABLES (Already exist in sarthiworkflow)
-- ============================================================
-- These tables are already created in the sarthiworkflow database
-- Refer to: sarthiworkflowDb20251214.sql for full schema

-- ============================================================
-- LOGIN CREDENTIALS (Existing Users in sarthiworkflow):
-- ============================================================
-- User ID: 1,  Password: password, Role: Vendor
-- User ID: 13, Password: password, Role: IE (Inspector Engineer)
-- User ID: 20, Password: password, Role: Control Manager
-- User ID: 21, Password: password, Role: Process IE
-- ============================================================

-- ============================================================
-- EXISTING ROLES IN DATABASE:
-- ============================================================
-- ROLEID 1: Vendor
-- ROLEID 2: RIO Help Desk
-- ROLEID 3: IE
-- ROLEID 4: IE Secondary
-- ROLEID 5: Control Manager
-- ROLEID 6: Rio Finance
-- ROLEID 7: Process IE
-- ROLEID 8: SBU Head
-- ============================================================

-- ============================================================
-- TABLE: inspection_schedule
-- Stores scheduling and rescheduling information for inspection calls
-- ============================================================

CREATE TABLE IF NOT EXISTS inspection_schedule (
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    call_no             VARCHAR(50)     NOT NULL,
    schedule_date       DATE            NOT NULL,
    reason              VARCHAR(255)    NULL,
    status              ENUM('SCHEDULED', 'RESCHEDULED') NOT NULL,
    created_by          VARCHAR(50)     NOT NULL,
    updated_by          VARCHAR(50)     NULL,
    created_date        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- SINGLE TABLE: inspection_initiation_master
-- Contains ALL auto-fetched fields from Section A, B, C, D
-- ============================================================

CREATE TABLE inspection_initiation_master (
    id                          BIGINT          PRIMARY KEY AUTO_INCREMENT,

    -- ==================== SECTION A: Main PO Information ====================
    po_no                       VARCHAR(50)     NOT NULL,                   -- PO Number
    po_date                     DATE            NOT NULL,                   -- PO Date
    po_amend_no                 VARCHAR(100)    NULL,                       -- PO Amendment Numbers
    po_amend_dates              VARCHAR(255)    NULL,                       -- PO Amendment Dates
    product_name                VARCHAR(255)    NOT NULL,                   -- Product Name
    pl_no                       VARCHAR(50)     NULL,                       -- PL Number
    vendor_name                 VARCHAR(255)    NOT NULL,                   -- Vendor Name
    purchasing_authority        VARCHAR(255)    NULL,                       -- Purchasing Authority
    bpo                         VARCHAR(100)    NULL,                       -- Bill Paying Officer
    po_qty                      INT             NOT NULL,                   -- PO Quantity
    delivery_period             VARCHAR(100)    NULL,                       -- Delivery Period
    place_of_inspection         VARCHAR(255)    NULL,                       -- Place of Inspection
    inspection_fees_payment     TEXT            NULL,                       -- Inspection Fees Payment Details

    -- ==================== SECTION B: Inspection Call Details ====================
    call_no                     VARCHAR(50)     NOT NULL UNIQUE,            -- Inspection Call Number
    call_date                   DATE            NOT NULL,                   -- Inspection Call Date
    po_item_sr_no               INT             DEFAULT 1,                  -- PO Item/Sr. No.
    product_type                VARCHAR(50)     NOT NULL,                   -- Product Type (RAW_MATERIAL/PROCESS_MATERIAL/FINAL_PRODUCT)
    call_qty                    INT             NOT NULL,                   -- Call Quantity
    offered_qty                 INT             NULL,                       -- Offered Quantity (readonly from vendor)
    rate                        DECIMAL(12,2)   NULL,                       -- Rate
    stage                       VARCHAR(100)    NOT NULL,                   -- Stage of Inspection
    previous_stage_ic_numbers   TEXT            NULL,                       -- IC Numbers of Previous Stages
    vendor_remarks              TEXT            NULL,                       -- Remarks for Inspection Call by Vendor

    -- ==================== SECTION C: Sub PO Details (Raw Material/Process) ====================
    raw_material_name           VARCHAR(255)    NULL,                       -- Raw Material Name
    sub_po_no                   VARCHAR(50)     NULL,                       -- Sub PO Number
    sub_po_date                 DATE            NULL,                       -- Sub PO Date
    contractor                  VARCHAR(255)    NULL,                       -- Contractor
    manufacturer                VARCHAR(255)    NULL,                       -- Manufacturer
    consignee                   VARCHAR(255)    NULL,                       -- Consignee

    -- ==================== SECTION D: Production Lines (Process Material) ====================
    -- Note: For multiple production lines, use inspection_production_lines child table
    line_number                 INT             NULL,                       -- Line Number (if single line)
    ic_number                   VARCHAR(50)     NULL,                       -- Inspection Call Number for line
    raw_material_ic_ids         TEXT            NULL,                       -- Raw Material IC IDs (comma-separated)
    line_product_type           VARCHAR(20)     NULL,                       -- Product Type (MK_III/MK_V/ERC_J)

    -- ==================== Audit Fields ====================
    status                      VARCHAR(20)     DEFAULT 'ACTIVE',           -- Status
    created_by                  VARCHAR(100)    NULL,                       -- Created By
    created_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,  -- Created Date
    updated_by                  VARCHAR(100)    NULL,                       -- Updated By
    updated_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Updated Date
);

-- Indexes for performance
CREATE INDEX idx_iim_po_no ON inspection_initiation_master(po_no);
CREATE INDEX idx_iim_call_no ON inspection_initiation_master(call_no);
CREATE INDEX idx_iim_vendor_name ON inspection_initiation_master(vendor_name);
CREATE INDEX idx_iim_product_type ON inspection_initiation_master(product_type);
CREATE INDEX idx_iim_status ON inspection_initiation_master(status);
CREATE INDEX idx_iim_call_date ON inspection_initiation_master(call_date);


-- ============================================================
-- CHILD TABLE: inspection_production_lines
-- For Section D - Multiple Production Lines (Process Material)
-- One-to-Many relationship with inspection_initiation_master
-- ============================================================

CREATE TABLE inspection_production_lines (
    id                          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    inspection_initiation_id    BIGINT          NOT NULL,                   -- FK to master table

    -- Production Line Details
    line_number                 INT             NOT NULL,                   -- Line Number (1, 2, 3...)
    ic_number                   VARCHAR(50)     NULL,                       -- Inspection Call Number
    po_number                   VARCHAR(50)     NULL,                       -- PO Number
    raw_material_ic_ids         TEXT            NULL,                       -- Raw Material IC IDs
    product_type                VARCHAR(20)     NULL,                       -- MK_III / MK_V / ERC_J

    -- Audit Fields
    status                      VARCHAR(20)     DEFAULT 'ACTIVE',
    created_by                  VARCHAR(100)    NULL,
    created_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_by                  VARCHAR(100)    NULL,
    updated_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_ipl_master FOREIGN KEY (inspection_initiation_id)
        REFERENCES inspection_initiation_master(id) ON DELETE CASCADE,
    UNIQUE KEY uk_ipl_line (inspection_initiation_id, line_number)
);

CREATE INDEX idx_ipl_master_id ON inspection_production_lines(inspection_initiation_id);
CREATE INDEX idx_ipl_line_number ON inspection_production_lines(line_number);


-- ============================================================
-- RAW MATERIAL SUBMODULE TABLES
-- ============================================================

-- ============================================================
-- TABLE: rm_calibration_documents
-- Stores Calibration & Documents submodule data
-- ============================================================

CREATE TABLE rm_calibration_documents (
    id                          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    inspection_initiation_id    BIGINT          NOT NULL,
    call_no                     VARCHAR(50)     NOT NULL,

    -- Calibration Details
    instrument_name             VARCHAR(255)    NOT NULL,
    instrument_id               VARCHAR(100)    NULL,
    calibration_date            DATE            NULL,
    calibration_valid_until     DATE            NULL,
    calibration_certificate_no  VARCHAR(100)    NULL,
    calibration_status          VARCHAR(20)     DEFAULT 'PENDING',

    -- Document Verification
    document_type               VARCHAR(100)    NULL,
    document_number             VARCHAR(100)    NULL,
    document_date               DATE            NULL,
    document_verified           BOOLEAN         DEFAULT FALSE,
    verification_remarks        TEXT            NULL,

    -- Audit Fields
    status                      VARCHAR(20)     DEFAULT 'ACTIVE',
    created_by                  VARCHAR(100)    NULL,
    created_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_by                  VARCHAR(100)    NULL,
    updated_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rcd_master FOREIGN KEY (inspection_initiation_id)
        REFERENCES inspection_initiation_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_rcd_call_no ON rm_calibration_documents(call_no);
CREATE INDEX idx_rcd_master_id ON rm_calibration_documents(inspection_initiation_id);


-- ============================================================
-- TABLE: rm_visual_inspection
-- Stores Visual Inspection submodule data
-- ============================================================

CREATE TABLE rm_visual_inspection (
    id                          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    inspection_initiation_id    BIGINT          NOT NULL,
    call_no                     VARCHAR(50)     NOT NULL,
    heat_no                     VARCHAR(50)     NOT NULL,

    -- Visual Defects (stored as JSON for flexibility)
    defects_json                JSON            NULL,

    -- Individual Defect Fields
    no_defect                   BOOLEAN         DEFAULT FALSE,
    distortion                  INT             DEFAULT 0,
    twist                       INT             DEFAULT 0,
    kink                        INT             DEFAULT 0,
    not_straight                INT             DEFAULT 0,
    fold                        INT             DEFAULT 0,
    lap                         INT             DEFAULT 0,
    crack                       INT             DEFAULT 0,
    pit                         INT             DEFAULT 0,
    groove                      INT             DEFAULT 0,
    excessive_scaling           INT             DEFAULT 0,
    internal_defect             INT             DEFAULT 0,

    -- Overall Status
    visual_status               VARCHAR(20)     DEFAULT 'PENDING',
    inspector_remarks           TEXT            NULL,

    -- Audit Fields
    status                      VARCHAR(20)     DEFAULT 'ACTIVE',
    created_by                  VARCHAR(100)    NULL,
    created_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_by                  VARCHAR(100)    NULL,
    updated_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rvi_master FOREIGN KEY (inspection_initiation_id)
        REFERENCES inspection_initiation_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_rvi_call_no ON rm_visual_inspection(call_no);
CREATE INDEX idx_rvi_heat_no ON rm_visual_inspection(heat_no);
CREATE INDEX idx_rvi_master_id ON rm_visual_inspection(inspection_initiation_id);


-- ============================================================
-- TABLE: rm_visual_material_testing
-- Stores Visual & Material Testing submodule data
-- ============================================================

CREATE TABLE rm_visual_material_testing (
    id                          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    inspection_initiation_id    BIGINT          NOT NULL,
    call_no                     VARCHAR(50)     NOT NULL,
    heat_no                     VARCHAR(50)     NOT NULL,

    -- Visual Defects
    defects_json                JSON            NULL,

    -- Dimensional Samples (20 samples per heat)
    dimensional_samples_json    JSON            NULL,

    -- Material Testing Results
    chemical_composition_json   JSON            NULL,
    tensile_test_json           JSON            NULL,
    hardness_test_json          JSON            NULL,

    -- Packing & Storage Verification
    packing_verified            BOOLEAN         DEFAULT FALSE,
    storage_verified            BOOLEAN         DEFAULT FALSE,
    packing_remarks             TEXT            NULL,

    -- Overall Status
    testing_status              VARCHAR(20)     DEFAULT 'PENDING',
    inspector_remarks           TEXT            NULL,

    -- Audit Fields
    status                      VARCHAR(20)     DEFAULT 'ACTIVE',
    created_by                  VARCHAR(100)    NULL,
    created_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_by                  VARCHAR(100)    NULL,
    updated_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rvmt_master FOREIGN KEY (inspection_initiation_id)
        REFERENCES inspection_initiation_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_rvmt_call_no ON rm_visual_material_testing(call_no);
CREATE INDEX idx_rvmt_heat_no ON rm_visual_material_testing(heat_no);
CREATE INDEX idx_rvmt_master_id ON rm_visual_material_testing(inspection_initiation_id);


-- ============================================================
-- TABLE: rm_dimensional_check
-- Stores Dimensional Check data (20 samples per heat)
-- ============================================================

CREATE TABLE rm_dimensional_check (
    id                          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    inspection_initiation_id    BIGINT          NOT NULL,
    call_no                     VARCHAR(50)     NOT NULL,
    heat_no                     VARCHAR(50)     NOT NULL,

    -- Dimensional Samples (20 samples per heat stored as JSON)
    dimensional_samples_json    JSON            NULL,

    -- Individual Sample Fields (for querying)
    sample_01                   DECIMAL(8,3)    NULL,
    sample_02                   DECIMAL(8,3)    NULL,
    sample_03                   DECIMAL(8,3)    NULL,
    sample_04                   DECIMAL(8,3)    NULL,
    sample_05                   DECIMAL(8,3)    NULL,
    sample_06                   DECIMAL(8,3)    NULL,
    sample_07                   DECIMAL(8,3)    NULL,
    sample_08                   DECIMAL(8,3)    NULL,
    sample_09                   DECIMAL(8,3)    NULL,
    sample_10                   DECIMAL(8,3)    NULL,
    sample_11                   DECIMAL(8,3)    NULL,
    sample_12                   DECIMAL(8,3)    NULL,
    sample_13                   DECIMAL(8,3)    NULL,
    sample_14                   DECIMAL(8,3)    NULL,
    sample_15                   DECIMAL(8,3)    NULL,
    sample_16                   DECIMAL(8,3)    NULL,
    sample_17                   DECIMAL(8,3)    NULL,
    sample_18                   DECIMAL(8,3)    NULL,
    sample_19                   DECIMAL(8,3)    NULL,
    sample_20                   DECIMAL(8,3)    NULL,

    -- Computed Statistics
    min_value                   DECIMAL(8,3)    NULL,
    max_value                   DECIMAL(8,3)    NULL,
    avg_value                   DECIMAL(8,3)    NULL,
    std_deviation               DECIMAL(8,4)    NULL,

    -- Status
    dimensional_status          VARCHAR(20)     DEFAULT 'PENDING',
    inspector_remarks           TEXT            NULL,

    -- Audit Fields
    status                      VARCHAR(20)     DEFAULT 'ACTIVE',
    created_by                  VARCHAR(100)    NULL,
    created_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_by                  VARCHAR(100)    NULL,
    updated_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rdc_master FOREIGN KEY (inspection_initiation_id)
        REFERENCES inspection_initiation_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_rdc_call_no ON rm_dimensional_check(call_no);
CREATE INDEX idx_rdc_heat_no ON rm_dimensional_check(heat_no);
CREATE INDEX idx_rdc_master_id ON rm_dimensional_check(inspection_initiation_id);


-- ============================================================
-- TABLE: rm_material_testing
-- Stores Material Testing data (Chemical, Tensile, Hardness)
-- ============================================================

CREATE TABLE rm_material_testing (
    id                          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    inspection_initiation_id    BIGINT          NOT NULL,
    call_no                     VARCHAR(50)     NOT NULL,
    heat_no                     VARCHAR(50)     NOT NULL,

    -- Chemical Composition
    chemical_carbon             DECIMAL(6,4)    NULL,
    chemical_manganese          DECIMAL(6,4)    NULL,
    chemical_silicon            DECIMAL(6,4)    NULL,
    chemical_sulphur            DECIMAL(6,4)    NULL,
    chemical_phosphorus         DECIMAL(6,4)    NULL,
    chemical_chromium           DECIMAL(6,4)    NULL,
    chemical_nickel             DECIMAL(6,4)    NULL,
    chemical_molybdenum         DECIMAL(6,4)    NULL,
    chemical_vanadium           DECIMAL(6,4)    NULL,
    chemical_copper             DECIMAL(6,4)    NULL,

    -- Tensile Test Results
    tensile_uts                 DECIMAL(10,2)   NULL,
    tensile_yield_strength      DECIMAL(10,2)   NULL,
    tensile_elongation          DECIMAL(6,2)    NULL,
    tensile_reduction_area      DECIMAL(6,2)    NULL,
    tensile_gauge_length        DECIMAL(8,2)    NULL,

    -- Hardness Test Results
    hardness_hrc                DECIMAL(6,2)    NULL,
    hardness_hb                 DECIMAL(6,2)    NULL,
    hardness_hv                 DECIMAL(6,2)    NULL,

    -- Test Certificate Details
    test_certificate_no         VARCHAR(100)    NULL,
    test_certificate_date       DATE            NULL,
    testing_lab                 VARCHAR(255)    NULL,

    -- Status
    testing_status              VARCHAR(20)     DEFAULT 'PENDING',
    inspector_remarks           TEXT            NULL,

    -- Audit Fields
    status                      VARCHAR(20)     DEFAULT 'ACTIVE',
    created_by                  VARCHAR(100)    NULL,
    created_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_by                  VARCHAR(100)    NULL,
    updated_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rmt_master FOREIGN KEY (inspection_initiation_id)
        REFERENCES inspection_initiation_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_rmt_call_no ON rm_material_testing(call_no);
CREATE INDEX idx_rmt_heat_no ON rm_material_testing(heat_no);
CREATE INDEX idx_rmt_master_id ON rm_material_testing(inspection_initiation_id);


-- ============================================================
-- TABLE: rm_packing_storage
-- Stores Packing & Storage Verification data
-- ============================================================

CREATE TABLE rm_packing_storage (
    id                          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    inspection_initiation_id    BIGINT          NOT NULL,
    call_no                     VARCHAR(50)     NOT NULL,
    heat_no                     VARCHAR(50)     NULL,

    -- Packing Details
    packing_type                VARCHAR(100)    NULL,
    packing_material            VARCHAR(100)    NULL,
    packing_condition           VARCHAR(50)     NULL,
    bundle_size                 INT             NULL,
    bundle_weight               DECIMAL(10,2)   NULL,
    identification_marking      BOOLEAN         DEFAULT FALSE,
    marking_legible             BOOLEAN         DEFAULT FALSE,

    -- Storage Details
    storage_location            VARCHAR(255)    NULL,
    storage_condition           VARCHAR(50)     NULL,
    storage_temp_ok             BOOLEAN         DEFAULT FALSE,
    storage_humidity_ok         BOOLEAN         DEFAULT FALSE,
    protection_from_elements    BOOLEAN         DEFAULT FALSE,

    -- Verification
    packing_verified            BOOLEAN         DEFAULT FALSE,
    storage_verified            BOOLEAN         DEFAULT FALSE,
    verification_date           DATE            NULL,

    -- Remarks
    packing_remarks             TEXT            NULL,
    storage_remarks             TEXT            NULL,

    -- Status
    verification_status         VARCHAR(20)     DEFAULT 'PENDING',
    inspector_remarks           TEXT            NULL,

    -- Audit Fields
    status                      VARCHAR(20)     DEFAULT 'ACTIVE',
    created_by                  VARCHAR(100)    NULL,
    created_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_by                  VARCHAR(100)    NULL,
    updated_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rps_master FOREIGN KEY (inspection_initiation_id)
        REFERENCES inspection_initiation_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_rps_call_no ON rm_packing_storage(call_no);
CREATE INDEX idx_rps_heat_no ON rm_packing_storage(heat_no);
CREATE INDEX idx_rps_master_id ON rm_packing_storage(inspection_initiation_id);


-- ============================================================
-- TABLE: rm_summary_reports
-- Stores Summary & Reports submodule data (read-only aggregation)
-- ============================================================

CREATE TABLE rm_summary_reports (
    id                          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    inspection_initiation_id    BIGINT          NOT NULL,
    call_no                     VARCHAR(50)     NOT NULL,

    -- Summary Counts
    total_heats                 INT             DEFAULT 0,
    heats_passed                INT             DEFAULT 0,
    heats_failed                INT             DEFAULT 0,
    total_samples_tested        INT             DEFAULT 0,

    -- Submodule Completion Status
    calibration_completed       BOOLEAN         DEFAULT FALSE,
    visual_inspection_completed BOOLEAN         DEFAULT FALSE,
    material_testing_completed  BOOLEAN         DEFAULT FALSE,
    dimensional_check_completed BOOLEAN         DEFAULT FALSE,
    packing_verified            BOOLEAN         DEFAULT FALSE,

    -- Final Decision
    final_decision              VARCHAR(20)     NULL,
    decision_date               DATE            NULL,
    decision_remarks            TEXT            NULL,

    -- Report Generation
    report_generated            BOOLEAN         DEFAULT FALSE,
    report_generated_date       TIMESTAMP       NULL,
    report_file_path            VARCHAR(500)    NULL,

    -- Audit Fields
    status                      VARCHAR(20)     DEFAULT 'ACTIVE',
    created_by                  VARCHAR(100)    NULL,
    created_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_by                  VARCHAR(100)    NULL,
    updated_date                TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rsr_master FOREIGN KEY (inspection_initiation_id)
        REFERENCES inspection_initiation_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_rsr_call_no ON rm_summary_reports(call_no);
CREATE INDEX idx_rsr_master_id ON rm_summary_reports(inspection_initiation_id);


-- ============================================================
-- END OF SCHEMA
-- ============================================================


-- ============================================================
-- API TABLE MAPPING REFERENCE
-- Maps API response fields to SINGLE table columns
-- ============================================================

/*
+---------------------------+---------------------------+--------------------------------+
| API Field (camelCase)     | DB Column (snake_case)    | Table                          |
+---------------------------+---------------------------+--------------------------------+
| SECTION A: Main PO Information                                                         |
+---------------------------+---------------------------+--------------------------------+
| poNo                      | po_no                     | inspection_initiation_master   |
| poDate                    | po_date                   | inspection_initiation_master   |
| poAmendNo                 | po_amend_no               | inspection_initiation_master   |
| poAmendDates              | po_amend_dates            | inspection_initiation_master   |
| productName               | product_name              | inspection_initiation_master   |
| plNo                      | pl_no                     | inspection_initiation_master   |
| vendorName                | vendor_name               | inspection_initiation_master   |
| purchasingAuthority       | purchasing_authority      | inspection_initiation_master   |
| bpo                       | bpo                       | inspection_initiation_master   |
| poQty                     | po_qty                    | inspection_initiation_master   |
| deliveryPeriod            | delivery_period           | inspection_initiation_master   |
| placeOfInspection         | place_of_inspection       | inspection_initiation_master   |
| inspectionFeesPayment     | inspection_fees_payment   | inspection_initiation_master   |
+---------------------------+---------------------------+--------------------------------+
| SECTION B: Inspection Call Details                                                     |
+---------------------------+---------------------------+--------------------------------+
| callNo                    | call_no                   | inspection_initiation_master   |
| callDate                  | call_date                 | inspection_initiation_master   |
| poItemSrNo                | po_item_sr_no             | inspection_initiation_master   |
| productType               | product_type              | inspection_initiation_master   |
| callQty                   | call_qty                  | inspection_initiation_master   |
| offeredQty                | offered_qty               | inspection_initiation_master   |
| rate                      | rate                      | inspection_initiation_master   |
| stage                     | stage                     | inspection_initiation_master   |
| previousStageIcNumbers    | previous_stage_ic_numbers | inspection_initiation_master   |
| vendorRemarks             | vendor_remarks            | inspection_initiation_master   |
+---------------------------+---------------------------+--------------------------------+
| SECTION C: Sub PO Details (Raw Material/Process)                                       |
+---------------------------+---------------------------+--------------------------------+
| rawMaterialName           | raw_material_name         | inspection_initiation_master   |
| subPoNo                   | sub_po_no                 | inspection_initiation_master   |
| subPoDate                 | sub_po_date               | inspection_initiation_master   |
| contractor                | contractor                | inspection_initiation_master   |
| manufacturer              | manufacturer              | inspection_initiation_master   |
| consignee                 | consignee                 | inspection_initiation_master   |
+---------------------------+---------------------------+--------------------------------+
| SECTION D: Production Lines (Process Material) - Child Table                          |
+---------------------------+---------------------------+--------------------------------+
| lineNumber                | line_number               | inspection_production_lines    |
| icNumber                  | ic_number                 | inspection_production_lines    |
| poNumber                  | po_number                 | inspection_production_lines    |
| rawMaterialICs            | raw_material_ic_ids       | inspection_production_lines    |
| productType               | product_type              | inspection_production_lines    |
+---------------------------+---------------------------+--------------------------------+
| AUDIT FIELDS (Both Tables)                                                             |
+---------------------------+---------------------------+--------------------------------+
| status                    | status                    | inspection_initiation_master   |
| createdBy                 | created_by                | inspection_initiation_master   |
| createdDate               | created_date              | inspection_initiation_master   |
| updatedBy                 | updated_by                | inspection_initiation_master   |
| updatedDate               | updated_date              | inspection_initiation_master   |
+---------------------------+---------------------------+--------------------------------+
*/

