const db = require("../db");
const vendorRepository = require("../repositories/vendorRepository");
const spaceRepository = require("../repositories/spaceRepository");
const requestRepository = require("../repositories/requestRepository");
const { pointFromLatLng, radiusFromDims } = require("../services/spatialService");

const ensureVendorExists = async userId => {
  const vendor = await vendorRepository.findByUserId(userId);
  if (!vendor) {
    const err = new Error("Vendor profile not found");
    err.status = 404;
    throw err;
  }
  return vendor;
};

const validateRequestLocation = async ({ spaceId, lat, lng, maxWidth, maxLength }) => {
  const space = await spaceRepository.findById(spaceId);
  if (!space) {
    const err = new Error("Space not found");
    err.status = 404;
    throw err;
  }

  // Calculate request radius from dimensions
  const requestRadius = radiusFromDims(maxWidth, maxLength);

  // Check if request center is within space allowed radius (accounting for request size)
  const result = await db.query(
    `
    SELECT
      ST_DWithin(
        ${pointFromLatLng(lat, lng)},
        s.center,
        s.allowed_radius - $1
      ) AS within_space
    FROM spaces s
    WHERE s.space_id = $2;
    `,
    [requestRadius, spaceId]
  );

  if (!result.rows[0]?.within_space) {
    const err = new Error(
      `Request location must be within space allowed radius (${space.allowed_radius}m). ` +
      `Request size requires ${requestRadius.toFixed(2)}m radius from center.`
    );
    err.status = 400;
    throw err;
  }

  return space;
};

const checkConflicts = async ({ spaceId, lat, lng, maxWidth, maxLength, startTime, endTime }) => {
  const requestRadius = radiusFromDims(maxWidth, maxLength);

  // Check for spatial + temporal conflicts with APPROVED requests
  const conflicts = await requestRepository.checkSpatialTemporalConflicts({
    spaceId,
    lat,
    lng,
    maxWidth,
    maxLength,
    startTime,
    endTime
  });

  if (conflicts.length > 0) {
    const err = new Error(
      `Spatial and temporal conflict detected: ${conflicts.length} approved request(s) overlap with this time window`
    );
    err.status = 409;
    err.conflicts = conflicts;
    throw err;
  }
};

const submitRequest = async (userId, payload) => {
  const vendor = await ensureVendorExists(userId);

  const {
    spaceId,
    lat,
    lng,
    maxWidth,
    maxLength,
    startTime,
    endTime
  } = payload;

  if (!lat || !lng) {
    const err = new Error("lat and lng are required");
    err.status = 400;
    throw err;
  }

  if (!maxWidth || maxWidth <= 0 || !maxLength || maxLength <= 0) {
    const err = new Error("maxWidth and maxLength must be positive numbers");
    err.status = 400;
    throw err;
  }

  if (new Date(startTime) >= new Date(endTime)) {
    const err = new Error("startTime must be before endTime");
    err.status = 400;
    throw err;
  }

  if (spaceId) {
    const space = await validateRequestLocation({ spaceId, lat, lng, maxWidth, maxLength });
    // Check conflicts only if attached to a space (or we could check global conflicts later)
    await checkConflicts({ spaceId, lat, lng, maxWidth, maxLength, startTime, endTime });
  }

  const request = await requestRepository.createRequest({
    vendorId: vendor.vendor_id,
    spaceId,
    lat: Number(lat),
    lng: Number(lng),
    maxWidth: Number(maxWidth),
    maxLength: Number(maxLength),
    startTime,
    endTime
  });

  return request;
};

const listRequests = async userId => {
  const vendor = await ensureVendorExists(userId);
  return await requestRepository.listVendorRequests(vendor.vendor_id);
};

const listPermits = async userId => {
  const vendor = await ensureVendorExists(userId);
  return await requestRepository.listVendorPermits(vendor.vendor_id);
};

module.exports = {
  submitRequest,
  listRequests,
  listPermits
};
