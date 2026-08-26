"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Phase 1 seed: just enough org data + one user per role to exercise auth
// and TenantScopeGuard end-to-end (plan §11 Phase 1 exit criteria).
// Phase 3 will extend this file to also seed the ESG metric catalog from the
// client's spreadsheet, initial emission-factor rows, and report templates —
// deliberately not done here to keep this seed matched to what Phase 1 needs.
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma = new client_1.PrismaClient();
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
    console.log('Seeded demo org + 3 users (password for all: %s):', DEMO_PASSWORD);
    console.log('  auditor@example.com   (AUDITOR / GLOBAL)');
    console.log('  supplier@example.com  (SUPPLIER_ADMIN / facility %s)', facility.id);
    console.log('  client@example.com    (CLIENT_USER / client %s)', client.id);
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map