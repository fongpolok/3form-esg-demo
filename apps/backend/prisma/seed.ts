// Phase 1 (org + one user per role), Phase 2 (units, material types), and
// Phase 3 (the ESG metric catalog, emission factors, report templates) all
// land in this one seed — see prisma/seed-data/ for the actual reference
// data, kept out of this file so the orchestration stays readable.
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { UNITS } from './seed-data/units';
import { DIMENSION_TYPES } from './seed-data/dimensions';
import { METRIC_CATEGORIES } from './seed-data/metric-categories';
import { METRIC_DEFINITIONS } from './seed-data/metric-definitions';
import { EMISSION_FACTORS } from './seed-data/emission-factors';
import { REPORT_TEMPLATES } from './seed-data/report-templates';
import { DEVICES, SIMULATOR_DEVICE_API_KEY } from './seed-data/devices';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'ChangeMe123!';

async function main() {
  const passwordHash = await argon2.hash(DEMO_PASSWORD);

  const supplier = await prisma.supplier.create({
    data: { name_en: 'Wing Kai Recycle', name_zh: '永佳回收', brn: 'DEMO-0001' },
  });

  const facility = await prisma.facility.create({
    data: {
      supplier_id: supplier.id,
      name_en: 'Hong Kong Processing Plant #1 (Tsing Yi)',
      name_zh: '香港青衣加工廠 #1',
      address_en: 'Tsing Yi, New Territories, Hong Kong',
      gfa_sqm: 25169.84,
    },
  });

  const client = await prisma.client.create({
    data: {
      supplier_id: supplier.id,
      name_en: 'Swire Properties',
      name_zh: '太古地產',
      contact_email: 'esg-contact@example.com',
    },
  });

  const auditorUser = await prisma.user.create({
    data: {
      email: 'auditor@example.com',
      password_hash: passwordHash,
      display_name: 'Dr. K. Y. Wong',
      locale_pref: 'en',
    },
  });
  await prisma.membership.create({
    data: { user_id: auditorUser.id, role: 'AUDITOR', scope_type: 'GLOBAL' },
  });

  const supplierUser = await prisma.user.create({
    data: {
      email: 'supplier@example.com',
      password_hash: passwordHash,
      display_name: 'Facilities Director',
      locale_pref: 'en',
    },
  });
  await prisma.membership.create({
    data: {
      user_id: supplierUser.id,
      role: 'SUPPLIER_ADMIN',
      scope_type: 'FACILITY',
      scope_id: facility.id,
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: 'client@example.com',
      password_hash: passwordHash,
      display_name: 'Swire Properties ESG Contact',
      locale_pref: 'en',
    },
  });
  await prisma.membership.create({
    data: { user_id: clientUser.id, role: 'CLIENT_USER', scope_type: 'CLIENT', scope_id: client.id },
  });

  // --- Units ---
  const unitIdByCode = new Map<string, bigint>();
  for (const unit of UNITS) {
    const row = await prisma.unit.create({ data: unit });
    unitIdByCode.set(unit.code, row.id);
  }

  // Codes/labels taken directly from the work-order-mes and data-collection
  // Figma screens' "Material Type" columns/filters.
  await prisma.materialType.createMany({
    data: [
      { code: 'PAPER_CARDBOARD', name_en: 'Paper & Cardboard', name_zh: '紙張及紙皮', default_unit_id: unitIdByCode.get('KG') },
      { code: 'INDUSTRIAL_METALS', name_en: 'Industrial Metals', name_zh: '工業金屬', default_unit_id: unitIdByCode.get('KG') },
      { code: 'LDPE_PLASTICS', name_en: 'LDPE Plastics', name_zh: 'LDPE 塑膠', default_unit_id: unitIdByCode.get('KG') },
      { code: 'MIXED_EWASTE', name_en: 'Mixed E-waste', name_zh: '混合電子廢物', default_unit_id: unitIdByCode.get('KG') },
    ],
  });

  // --- Dimension types/values ---
  const dimensionTypeIdByCode = new Map<string, bigint>();
  const dimensionValueIdByCode = new Map<string, bigint>(); // keyed "TYPE:VALUE"
  for (const dt of DIMENSION_TYPES) {
    const dtRow = await prisma.dimensionType.create({ data: { code: dt.code } });
    dimensionTypeIdByCode.set(dt.code, dtRow.id);
    for (const dv of dt.values) {
      const dvRow = await prisma.dimensionValue.create({
        data: { dimension_type_id: dtRow.id, code: dv.code, name_en: dv.name_en, name_zh: dv.name_zh },
      });
      dimensionValueIdByCode.set(`${dt.code}:${dv.code}`, dvRow.id);
    }
  }

  // --- Metric categories ---
  const categoryIdByCode = new Map<string, bigint>();
  for (const cat of METRIC_CATEGORIES) {
    const row = await prisma.metricCategory.create({ data: cat });
    categoryIdByCode.set(cat.code, row.id);
  }

  // --- Metric definitions (two passes: definitions first, then
  // derivation_of_metric_id links, since a derived metric can reference a
  // definition that hasn't been created yet in seed-data's array order) ---
  const definitionIdByCode = new Map<string, bigint>();
  for (const def of METRIC_DEFINITIONS) {
    const row = await prisma.metricDefinition.create({
      data: {
        category_id: categoryIdByCode.get(def.category)!,
        code: def.code,
        gri_code: def.gri_code,
        hkex_code: def.hkex_code,
        name_en: def.name_en,
        name_zh: def.name_zh,
        value_type: def.value_type,
        default_unit_id: def.default_unit ? unitIdByCode.get(def.default_unit) : undefined,
        is_derived: def.is_derived ?? false,
        derivation_factor_category: def.derivation_factor_category,
      },
    });
    definitionIdByCode.set(def.code, row.id);

    if (def.dimensions) {
      for (const dimCode of def.dimensions) {
        await prisma.metricDefinitionDimension.create({
          data: { metric_definition_id: row.id, dimension_type_id: dimensionTypeIdByCode.get(dimCode)! },
        });
      }
    }
  }
  for (const def of METRIC_DEFINITIONS) {
    if (def.derivation_of) {
      await prisma.metricDefinition.update({
        where: { id: definitionIdByCode.get(def.code)! },
        data: { derivation_of_metric_id: definitionIdByCode.get(def.derivation_of)! },
      });
    }
  }

  // --- Emission factors / tunable parameters ---
  const parameterCategoryIdByCode = new Map<string, bigint>();
  for (const code of ['GRID_EMISSION_FACTOR', 'FUEL_EMISSION_FACTOR', 'GWP_REFRIGERANT', 'UNIT_CONVERSION', 'ENVIRONMENTAL_EQUIVALENCY']) {
    const row = await prisma.parameterCategory.create({ data: { code } });
    parameterCategoryIdByCode.set(code, row.id);
  }
  for (const ef of EMISSION_FACTORS) {
    await prisma.emissionFactor.create({
      data: {
        category_id: parameterCategoryIdByCode.get(ef.category)!,
        code: ef.code,
        utility_code: ef.utility_code,
        fuel_type_code: ef.fuel_type_code,
        refrigerant_type_code: ef.refrigerant_type_code,
        material_type_code: ef.material_type_code,
        scope_extra: ef.scope_extra,
        factor_value: ef.factor_value,
        factor_unit: ef.factor_unit,
        effective_from: new Date(ef.effective_from),
        source_reference: ef.source_reference,
        created_by_user_id: auditorUser.id,
      },
    });
  }

  // --- Simulated devices (see seed-data/devices.ts for the shared demo key) ---
  const deviceKeyHash = await argon2.hash(SIMULATOR_DEVICE_API_KEY);
  await prisma.device.createMany({
    data: DEVICES.map((d) => ({
      facility_id: facility.id,
      device_type: d.deviceType,
      device_code: d.deviceCode,
      purpose: d.purpose,
      is_simulated: true,
      api_key_hash: deviceKeyHash,
    })),
  });

  // --- Report templates ---
  for (const tpl of REPORT_TEMPLATES) {
    await prisma.reportTemplate.create({
      data: {
        code: tpl.code,
        name_en: tpl.name_en,
        name_zh: tpl.name_zh,
        description_en: tpl.description_en,
        description_zh: tpl.description_zh,
        framework: tpl.framework,
        section_scope: tpl.section_scope,
      },
    });
  }

  console.log('Seeded demo org + 3 users (password for all: %s):', DEMO_PASSWORD);
  console.log('  auditor@example.com   (AUDITOR / GLOBAL)');
  console.log('  supplier@example.com  (SUPPLIER_ADMIN / facility %s)', facility.id.toString());
  console.log('  client@example.com    (CLIENT_USER / client %s)', client.id.toString());
  console.log(
    'Seeded %d units, %d dimension types, %d metric categories, %d metric definitions, %d emission factors, %d report templates, %d devices.',
    UNITS.length,
    DIMENSION_TYPES.length,
    METRIC_CATEGORIES.length,
    METRIC_DEFINITIONS.length,
    EMISSION_FACTORS.length,
    REPORT_TEMPLATES.length,
    DEVICES.length,
  );
  console.log('Simulated device API key (SIMULATOR_DEVICE_API_KEY): %s', SIMULATOR_DEVICE_API_KEY);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
