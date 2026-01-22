const ownerRepository = require("../repositories/ownerRepository");
const spaceRepository = require("../repositories/spaceRepository");
const requestRepository = require("../repositories/requestRepository");

const ensureOwnerProfile = async userId => {
  const owner = await ownerRepository.findByUserId(userId);
  if (!owner) {
    const err = new Error("Owner profile not found for this user");
    err.status = 404;
    throw err;
  }
  return owner;
};

const createSpace = async (userId, payload) => {
  const owner = await ensureOwnerProfile(userId);
  const {
    spaceName,
    address,
    lat,
    lng,
    allowedRadius
  } = payload;

  if (!lat || !lng) {
    const err = new Error("lat and lng are required");
    err.status = 400;
    throw err;
  }

  if (!allowedRadius || allowedRadius <= 0) {
    const err = new Error("allowedRadius must be a positive number");
    err.status = 400;
    throw err;
  }

  const space = await spaceRepository.createSpace({
    ownerId: owner.owner_id,
    spaceName,
    address,
    lat: Number(lat),
    lng: Number(lng),
    allowedRadius: Number(allowedRadius)
  });

  return { space };
};

const listSpaces = async userId => {
  console.log(`[DEBUG] listSpaces called for userId: ${userId}`);
  const owner = await ensureOwnerProfile(userId);
  console.log(`[DEBUG] Resolved ownerId: ${owner.owner_id}`);
  const spaces = await spaceRepository.listByOwner(owner.owner_id);
  console.log(`[DEBUG] Found ${spaces.length} spaces`);
  return { spaces };
};

const listRequests = async userId => {
  const owner = await ensureOwnerProfile(userId);
  const requests = await requestRepository.listOwnerRequests(owner.owner_id);
  return { requests };
};

module.exports = {
  createSpace,
  listSpaces,
  listRequests
};
