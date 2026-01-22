const jwt = require("jsonwebtoken");
const publicRepository = require("../repositories/publicRepository");

const listVendors = async () => {
  return await publicRepository.listApprovedVendors();
};

const searchVendors = async filters => {
  return await publicRepository.searchVendors(filters);
};

const getCongestionData = async ({ bounds, zoom }) => {
  return await publicRepository.getVendorDensity({ bounds, zoom });
};

const verifyPermit = async qrCodeData => {
  if (!qrCodeData) {
    const err = new Error("QR code data is required");
    err.status = 400;
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(qrCodeData, process.env.JWT_SECRET);
  } catch (err) {
    const error = new Error("Invalid QR code signature");
    error.status = 401;
    throw error;
  }

  const permit = await publicRepository.findPermitByQrData(qrCodeData);
  if (!permit) {
    const err = new Error("Permit not found");
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const validFrom = new Date(permit.valid_from);
  const validTo = new Date(permit.valid_to);

  const checks = {
    permitStatus: permit.permit_status === "VALID",
    timeValidity: now >= validFrom && now <= validTo,
    requestStatus: permit.status === "APPROVED",
    spatialCorrectness: true
  };

  const isValid = checks.permitStatus && checks.timeValidity && checks.requestStatus && checks.spatialCorrectness;

  return {
    valid: isValid,
    permit: {
      permitId: permit.permit_id,
      businessName: permit.business_name,
      category: permit.category,
      licenseNumber: permit.license_number,
      vendorName: permit.vendor_name,
      spaceName: permit.space_name,
      address: permit.address,
      validFrom: permit.valid_from,
      validTo: permit.valid_to,
      permitStatus: permit.permit_status,
      issuedAt: permit.issued_at
    },
    checks,
    decoded
  };
};

module.exports = {
  listVendors,
  searchVendors,
  getCongestionData,
  verifyPermit
};
