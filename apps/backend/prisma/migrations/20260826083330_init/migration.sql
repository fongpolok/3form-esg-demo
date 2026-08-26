-- CreateTable
CREATE TABLE `suppliers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name_en` VARCHAR(191) NOT NULL,
    `name_zh` VARCHAR(191) NOT NULL,
    `brn` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facilities` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `supplier_id` BIGINT NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `name_zh` VARCHAR(191) NOT NULL,
    `address_en` VARCHAR(191) NULL,
    `address_zh` VARCHAR(191) NULL,
    `gfa_sqm` DECIMAL(12, 2) NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Hong_Kong',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `facilities_supplier_id_idx`(`supplier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `supplier_id` BIGINT NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `name_zh` VARCHAR(191) NOT NULL,
    `contact_email` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `clients_supplier_id_idx`(`supplier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `locale_pref` ENUM('en', 'zh_HK') NOT NULL DEFAULT 'en',
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `memberships` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `role` ENUM('AUDITOR', 'SUPPLIER_ADMIN', 'SUPPLIER_STAFF', 'CLIENT_USER') NOT NULL,
    `scope_type` ENUM('GLOBAL', 'SUPPLIER', 'FACILITY', 'CLIENT') NOT NULL,
    `scope_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `memberships_scope_type_scope_id_idx`(`scope_type`, `scope_id`),
    UNIQUE INDEX `memberships_user_id_role_scope_type_scope_id_key`(`user_id`, `role`, `scope_type`, `scope_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `name_zh` VARCHAR(191) NOT NULL,
    `unit_type` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `units_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_types` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `name_zh` VARCHAR(191) NOT NULL,
    `default_unit_id` BIGINT NULL,

    UNIQUE INDEX `material_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `devices` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `facility_id` BIGINT NOT NULL,
    `device_type` ENUM('WEIGHT_SCALE', 'CV_CAMERA') NOT NULL,
    `device_code` VARCHAR(191) NOT NULL,
    `purpose` ENUM('INLET', 'OUTLET', 'PROCESS_MONITOR') NOT NULL,
    `is_simulated` BOOLEAN NOT NULL DEFAULT true,
    `api_key_hash` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `devices_device_code_key`(`device_code`),
    INDEX `devices_facility_id_idx`(`facility_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `facility_id` BIGINT NOT NULL,
    `client_id` BIGINT NULL,
    `wip_no` VARCHAR(191) NOT NULL,
    `wip_date` DATE NOT NULL,
    `wip_time` TIME NOT NULL,
    `status` ENUM('ORDER_RECEIVED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'PROCESSING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ORDER_RECEIVED',
    `created_by_user_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `work_orders_wip_no_key`(`wip_no`),
    INDEX `work_orders_facility_id_idx`(`facility_id`),
    INDEX `work_orders_client_id_idx`(`client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_order_stage_events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `work_order_id` BIGINT NOT NULL,
    `stage` ENUM('ORDER_RECEIVED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'PROCESSING', 'COMPLETED', 'CANCELLED') NOT NULL,
    `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actor_user_id` BIGINT NULL,
    `note` VARCHAR(191) NULL,

    INDEX `work_order_stage_events_work_order_id_idx`(`work_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_order_materials` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `work_order_id` BIGINT NOT NULL,
    `material_type_id` BIGINT NOT NULL,
    `weight_kg` DECIMAL(12, 3) NOT NULL,
    `product_type` VARCHAR(191) NULL,
    `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `source` ENUM('MANUAL', 'IOT', 'CALCULATED') NOT NULL DEFAULT 'MANUAL',

    INDEX `work_order_materials_work_order_id_idx`(`work_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weight_readings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `reading_uuid` CHAR(36) NOT NULL,
    `work_order_id` BIGINT NULL,
    `device_id` BIGINT NOT NULL,
    `reading_type` ENUM('INLET', 'OUTLET') NOT NULL,
    `weight_kg` DECIMAL(12, 3) NOT NULL,
    `reading_at` DATETIME(3) NOT NULL,
    `source` ENUM('SIMULATED', 'REAL') NOT NULL,

    UNIQUE INDEX `weight_readings_reading_uuid_key`(`reading_uuid`),
    INDEX `weight_readings_work_order_id_idx`(`work_order_id`),
    INDEX `weight_readings_device_id_idx`(`device_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cv_readings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `reading_uuid` CHAR(36) NOT NULL,
    `work_order_id` BIGINT NULL,
    `device_id` BIGINT NOT NULL,
    `object_class` VARCHAR(191) NULL,
    `confidence` DECIMAL(4, 3) NULL,
    `estimated_weight_kg` DECIMAL(12, 3) NULL,
    `captured_at` DATETIME(3) NOT NULL,
    `source` ENUM('SIMULATED', 'REAL') NOT NULL,

    UNIQUE INDEX `cv_readings_reading_uuid_key`(`reading_uuid`),
    INDEX `cv_readings_work_order_id_idx`(`work_order_id`),
    INDEX `cv_readings_device_id_idx`(`device_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_order_photos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `work_order_id` BIGINT NOT NULL,
    `cv_reading_id` BIGINT NULL,
    `storage_key` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `captured_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `work_order_photos_work_order_id_idx`(`work_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `processed_material` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `work_order_id` BIGINT NOT NULL,
    `output_weight_kg` DECIMAL(12, 3) NOT NULL,
    `scrap_weight_kg` DECIMAL(12, 3) NOT NULL,
    `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `processed_material_work_order_id_key`(`work_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_trips` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `work_order_id` BIGINT NULL,
    `facility_id` BIGINT NOT NULL,
    `vehicle_type` ENUM('MOTORCYCLE', 'PASSENGER_CAR', 'PRIVATE_VAN', 'PUBLIC_LIGHT_BUS', 'LIGHT_GOODS_VEHICLE', 'HEAVY_GOODS_VEHICLE', 'MEDIUM_GOODS_VEHICLE') NOT NULL,
    `fuel_type` ENUM('PETROL', 'DIESEL', 'LPG') NOT NULL,
    `distance_km` DECIMAL(10, 2) NULL,
    `fuel_consumption_litres` DECIMAL(10, 2) NULL,
    `pickup_location` VARCHAR(191) NULL,
    `dropoff_location` VARCHAR(191) NULL,
    `further_destination` VARCHAR(191) NULL,
    `trip_date` DATE NOT NULL,

    INDEX `transport_trips_work_order_id_idx`(`work_order_id`),
    INDEX `transport_trips_facility_id_idx`(`facility_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metric_categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `name_zh` VARCHAR(191) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `metric_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metric_definitions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `category_id` BIGINT NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `gri_code` VARCHAR(191) NULL,
    `hkex_code` VARCHAR(191) NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `name_zh` VARCHAR(191) NOT NULL,
    `description_en` VARCHAR(191) NULL,
    `description_zh` VARCHAR(191) NULL,
    `value_type` ENUM('NUMERIC', 'TEXT', 'COUNT') NOT NULL,
    `default_unit_id` BIGINT NULL,
    `is_derived` BOOLEAN NOT NULL DEFAULT false,
    `derivation_of_metric_id` BIGINT NULL,
    `derivation_factor_category` ENUM('UNIT_CONVERSION', 'EMISSION_FACTOR', 'EQUIVALENCY') NULL,

    UNIQUE INDEX `metric_definitions_code_key`(`code`),
    INDEX `metric_definitions_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dimension_types` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `dimension_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dimension_values` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `dimension_type_id` BIGINT NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `name_zh` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `dimension_values_dimension_type_id_code_key`(`dimension_type_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metric_definition_dimensions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `metric_definition_id` BIGINT NOT NULL,
    `dimension_type_id` BIGINT NOT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `metric_definition_dimensions_metric_definition_id_dimension__key`(`metric_definition_id`, `dimension_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reporting_periods` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `facility_id` BIGINT NOT NULL,
    `period_code` VARCHAR(191) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'AUDITED', 'FINALIZED') NOT NULL DEFAULT 'DRAFT',

    UNIQUE INDEX `reporting_periods_facility_id_period_code_key`(`facility_id`, `period_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metric_values` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `reporting_period_id` BIGINT NOT NULL,
    `facility_id` BIGINT NOT NULL,
    `client_id` BIGINT NULL,
    `metric_definition_id` BIGINT NOT NULL,
    `numeric_value` DECIMAL(18, 4) NULL,
    `text_value` TEXT NULL,
    `unit_id` BIGINT NULL,
    `source` ENUM('MANUAL', 'SIMULATED_IOT', 'CALCULATED', 'IMPORTED') NOT NULL,
    `source_work_order_id` BIGINT NULL,
    `notes` TEXT NULL,
    `entered_by_user_id` BIGINT NOT NULL,
    `entered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_current` BOOLEAN NOT NULL DEFAULT true,
    `supersedes_id` BIGINT NULL,
    `correction_reason` TEXT NULL,
    `locale` ENUM('en', 'zh_HK') NULL,

    UNIQUE INDEX `metric_values_supersedes_id_key`(`supersedes_id`),
    INDEX `metric_values_reporting_period_id_idx`(`reporting_period_id`),
    INDEX `metric_values_facility_id_metric_definition_id_is_current_idx`(`facility_id`, `metric_definition_id`, `is_current`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metric_value_dimensions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `metric_value_id` BIGINT NOT NULL,
    `dimension_type_id` BIGINT NOT NULL,
    `dimension_value_id` BIGINT NOT NULL,

    INDEX `metric_value_dimensions_metric_value_id_idx`(`metric_value_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parameter_categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `parameter_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emission_factors` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `category_id` BIGINT NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `utility_code` VARCHAR(191) NULL,
    `fuel_type_code` VARCHAR(191) NULL,
    `refrigerant_type_code` VARCHAR(191) NULL,
    `vehicle_type_code` VARCHAR(191) NULL,
    `material_type_code` VARCHAR(191) NULL,
    `scope_extra` JSON NULL,
    `factor_value` DECIMAL(18, 8) NOT NULL,
    `factor_unit` VARCHAR(191) NOT NULL,
    `effective_from` DATE NOT NULL,
    `effective_to` DATE NULL,
    `source_reference` TEXT NULL,
    `created_by_user_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `emission_factors_category_id_code_effective_from_idx`(`category_id`, `code`, `effective_from`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_templates` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name_en` VARCHAR(191) NOT NULL,
    `name_zh` VARCHAR(191) NOT NULL,
    `description_en` VARCHAR(191) NULL,
    `description_zh` VARCHAR(191) NULL,
    `framework` VARCHAR(191) NULL,
    `section_scope` JSON NOT NULL,

    UNIQUE INDEX `report_templates_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `facility_id` BIGINT NOT NULL,
    `client_id` BIGINT NULL,
    `report_template_id` BIGINT NOT NULL,
    `audience` ENUM('OFFICIAL', 'CLIENT_SELF_SERVICE') NOT NULL,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `generation_status` ENUM('QUEUED', 'PROCESSING', 'READY', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    `review_status` ENUM('DRAFT', 'PENDING_REVIEW', 'FINALIZED', 'PUBLISHED') NULL,
    `generated_by_user_id` BIGINT NOT NULL,
    `generated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewed_by_user_id` BIGINT NULL,
    `reviewed_at` DATETIME(3) NULL,
    `finalized_at` DATETIME(3) NULL,
    `pdf_storage_key` VARCHAR(191) NULL,
    `file_size_bytes` INTEGER NULL,
    `emission_factor_snapshot` JSON NULL,

    INDEX `reports_facility_id_idx`(`facility_id`),
    INDEX `reports_client_id_idx`(`client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `facilities` ADD CONSTRAINT `facilities_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_types` ADD CONSTRAINT `material_types_default_unit_id_fkey` FOREIGN KEY (`default_unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_facility_id_fkey` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_facility_id_fkey` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_stage_events` ADD CONSTRAINT `work_order_stage_events_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_stage_events` ADD CONSTRAINT `work_order_stage_events_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_materials` ADD CONSTRAINT `work_order_materials_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_materials` ADD CONSTRAINT `work_order_materials_material_type_id_fkey` FOREIGN KEY (`material_type_id`) REFERENCES `material_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weight_readings` ADD CONSTRAINT `weight_readings_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weight_readings` ADD CONSTRAINT `weight_readings_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv_readings` ADD CONSTRAINT `cv_readings_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv_readings` ADD CONSTRAINT `cv_readings_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_photos` ADD CONSTRAINT `work_order_photos_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_order_photos` ADD CONSTRAINT `work_order_photos_cv_reading_id_fkey` FOREIGN KEY (`cv_reading_id`) REFERENCES `cv_readings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `processed_material` ADD CONSTRAINT `processed_material_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_trips` ADD CONSTRAINT `transport_trips_work_order_id_fkey` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_trips` ADD CONSTRAINT `transport_trips_facility_id_fkey` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_definitions` ADD CONSTRAINT `metric_definitions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `metric_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_definitions` ADD CONSTRAINT `metric_definitions_default_unit_id_fkey` FOREIGN KEY (`default_unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_definitions` ADD CONSTRAINT `metric_definitions_derivation_of_metric_id_fkey` FOREIGN KEY (`derivation_of_metric_id`) REFERENCES `metric_definitions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dimension_values` ADD CONSTRAINT `dimension_values_dimension_type_id_fkey` FOREIGN KEY (`dimension_type_id`) REFERENCES `dimension_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_definition_dimensions` ADD CONSTRAINT `metric_definition_dimensions_metric_definition_id_fkey` FOREIGN KEY (`metric_definition_id`) REFERENCES `metric_definitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_definition_dimensions` ADD CONSTRAINT `metric_definition_dimensions_dimension_type_id_fkey` FOREIGN KEY (`dimension_type_id`) REFERENCES `dimension_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reporting_periods` ADD CONSTRAINT `reporting_periods_facility_id_fkey` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_values` ADD CONSTRAINT `metric_values_reporting_period_id_fkey` FOREIGN KEY (`reporting_period_id`) REFERENCES `reporting_periods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_values` ADD CONSTRAINT `metric_values_facility_id_fkey` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_values` ADD CONSTRAINT `metric_values_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_values` ADD CONSTRAINT `metric_values_metric_definition_id_fkey` FOREIGN KEY (`metric_definition_id`) REFERENCES `metric_definitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_values` ADD CONSTRAINT `metric_values_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_values` ADD CONSTRAINT `metric_values_source_work_order_id_fkey` FOREIGN KEY (`source_work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_values` ADD CONSTRAINT `metric_values_entered_by_user_id_fkey` FOREIGN KEY (`entered_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_values` ADD CONSTRAINT `metric_values_supersedes_id_fkey` FOREIGN KEY (`supersedes_id`) REFERENCES `metric_values`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_value_dimensions` ADD CONSTRAINT `metric_value_dimensions_metric_value_id_fkey` FOREIGN KEY (`metric_value_id`) REFERENCES `metric_values`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_value_dimensions` ADD CONSTRAINT `metric_value_dimensions_dimension_type_id_fkey` FOREIGN KEY (`dimension_type_id`) REFERENCES `dimension_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metric_value_dimensions` ADD CONSTRAINT `metric_value_dimensions_dimension_value_id_fkey` FOREIGN KEY (`dimension_value_id`) REFERENCES `dimension_values`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emission_factors` ADD CONSTRAINT `emission_factors_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `parameter_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emission_factors` ADD CONSTRAINT `emission_factors_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_facility_id_fkey` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_report_template_id_fkey` FOREIGN KEY (`report_template_id`) REFERENCES `report_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_generated_by_user_id_fkey` FOREIGN KEY (`generated_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reviewed_by_user_id_fkey` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
