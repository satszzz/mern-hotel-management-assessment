const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

let rooms = [];
let nextId = 1;

const ALLOWED_TYPES = ['Single', 'Double', 'Suite', 'Deluxe', 'Family'];

const ALLOWED_SORT_FIELDS = ['name', 'pricePerNight', 'capacity'];
const ALLOWED_ORDERS = ['asc', 'desc'];
const RECOGNIZED_ROOM_FIELDS = [
  'name',
  'location',
  'type',
  'pricePerNight',
  'capacity',
  'available',
  'roomNumber'
];

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400) && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON' });
  }
  return res.status(500).json({ error: 'Internal Server Error' });
});

function validateName(val) {
  if (typeof val !== 'string') {
    return { valid: false, error: 'name must be a string' };
  }
  const trimmed = val.trim();
  if (trimmed.length < 3 || trimmed.length > 60) {
    return { valid: false, error: 'name must be between 3 and 60 characters' };
  }
  return { valid: true, value: trimmed };
}

function validateLocation(val) {
  if (typeof val !== 'string') {
    return { valid: false, error: 'location must be a string' };
  }
  const trimmed = val.trim();
  if (trimmed.length < 2 || trimmed.length > 40) {
    return { valid: false, error: 'location must be between 2 and 40 characters' };
  }
  return { valid: true, value: trimmed };
}

function validateType(val) {
  if (typeof val !== 'string') {
    return { valid: false, error: 'type must be a string' };
  }
  if (!ALLOWED_TYPES.includes(val)) {
    return { valid: false, error: 'type must be one of Single, Double, Suite, Deluxe, Family' };
  }
  return { valid: true, value: val };
}

function validatePricePerNight(val) {
  if (typeof val !== 'number' || isNaN(val) || !Number.isFinite(val)) {
    return { valid: false, error: 'pricePerNight must be a number' };
  }
  if (val <= 0 || val > 100000) {
    return { valid: false, error: 'pricePerNight must be greater than 0 and at most 100000' };
  }
  return { valid: true, value: val };
}

function validateCapacity(val) {
  if (typeof val !== 'number' || !Number.isInteger(val)) {
    return { valid: false, error: 'capacity must be an integer' };
  }
  if (val < 1 || val > 10) {
    return { valid: false, error: 'capacity must be between 1 and 10' };
  }
  return { valid: true, value: val };
}

function validateAvailable(val) {
  if (typeof val !== 'boolean') {
    return { valid: false, error: 'available must be a boolean' };
  }
  return { valid: true, value: val };
}

function validateRoomNumber(val) {
  if (typeof val !== 'string') {
    return { valid: false, error: 'roomNumber must be a string' };
  }
  const trimmed = val.trim();
  if (trimmed.length < 4 || trimmed.length > 20) {
    return { valid: false, error: 'roomNumber must be between 4 and 20 characters' };
  }
  return { valid: true, value: trimmed };
}

app.post('/api/rooms', (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  for (const field of RECOGNIZED_ROOM_FIELDS) {
    if (!(field in req.body) || req.body[field] === undefined || req.body[field] === null) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  const nameRes = validateName(req.body.name);
  if (!nameRes.valid) return res.status(400).json({ error: nameRes.error });

  const locRes = validateLocation(req.body.location);
  if (!locRes.valid) return res.status(400).json({ error: locRes.error });

  const typeRes = validateType(req.body.type);
  if (!typeRes.valid) return res.status(400).json({ error: typeRes.error });

  const priceRes = validatePricePerNight(req.body.pricePerNight);
  if (!priceRes.valid) return res.status(400).json({ error: priceRes.error });

  const capRes = validateCapacity(req.body.capacity);
  if (!capRes.valid) return res.status(400).json({ error: capRes.error });

  const availRes = validateAvailable(req.body.available);
  if (!availRes.valid) return res.status(400).json({ error: availRes.error });

  const roomNumRes = validateRoomNumber(req.body.roomNumber);
  if (!roomNumRes.valid) return res.status(400).json({ error: roomNumRes.error });

  const isDuplicate = rooms.some(
    r => r.roomNumber.toLowerCase() === roomNumRes.value.toLowerCase()
  );
  if (isDuplicate) {
    return res.status(409).json({ error: 'roomNumber already exists' });
  }

  const newRoom = {
    id: nextId++,
    name: nameRes.value,
    location: locRes.value,
    type: typeRes.value,
    pricePerNight: priceRes.value,
    capacity: capRes.value,
    available: availRes.value,
    roomNumber: roomNumRes.value
  };

  rooms.push(newRoom);
  return res.status(201).json(newRoom);
});

app.get('/api/rooms', (req, res) => {
  let page = 1;
  if (req.query.page !== undefined) {
    if (!/^[1-9]\d*$/.test(String(req.query.page))) {
      return res.status(400).json({ error: 'Invalid page parameter' });
    }
    page = parseInt(req.query.page, 10);
  }

  let limit = 10;
  if (req.query.limit !== undefined) {
    if (!/^[1-9]\d*$/.test(String(req.query.limit))) {
      return res.status(400).json({ error: 'Invalid limit parameter' });
    }
    limit = parseInt(req.query.limit, 10);
    if (limit > 50) {
      return res.status(400).json({ error: 'limit cannot exceed 50' });
    }
  }

  if (req.query.type !== undefined) {
    if (!ALLOWED_TYPES.includes(req.query.type)) {
      return res.status(400).json({ error: 'Invalid type parameter' });
    }
  }

  if (req.query.available !== undefined) {
    if (req.query.available !== 'true' && req.query.available !== 'false') {
      return res.status(400).json({ error: 'Invalid available parameter' });
    }
  }

  let minPrice;
  if (req.query.minPricePerNight !== undefined) {
    const minStr = String(req.query.minPricePerNight).trim();
    if (minStr === '' || isNaN(Number(minStr)) || !Number.isFinite(Number(minStr))) {
      return res.status(400).json({ error: 'Invalid minPricePerNight parameter' });
    }
    minPrice = Number(minStr);
  }

  let maxPrice;
  if (req.query.maxPricePerNight !== undefined) {
    const maxStr = String(req.query.maxPricePerNight).trim();
    if (maxStr === '' || isNaN(Number(maxStr)) || !Number.isFinite(Number(maxStr))) {
      return res.status(400).json({ error: 'Invalid maxPricePerNight parameter' });
    }
    maxPrice = Number(maxStr);
  }

  if (req.query.sort !== undefined) {
    if (!ALLOWED_SORT_FIELDS.includes(req.query.sort)) {
      return res.status(400).json({ error: 'Invalid sort parameter' });
    }
  }

  let order = 'asc';
  if (req.query.order !== undefined) {
    if (!ALLOWED_ORDERS.includes(req.query.order)) {
      return res.status(400).json({ error: 'Invalid order parameter' });
    }
    order = req.query.order;
  }

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return res.status(200).json({
      data: [],
      page,
      limit,
      total: 0,
      totalPages: 0
    });
  }

  let result = [...rooms];

  if (req.query.type !== undefined) {
    result = result.filter(r => r.type === req.query.type);
  }

  if (req.query.available !== undefined) {
    const boolVal = req.query.available === 'true';
    result = result.filter(r => r.available === boolVal);
  }

  if (minPrice !== undefined) {
    result = result.filter(r => r.pricePerNight >= minPrice);
  }

  if (maxPrice !== undefined) {
    result = result.filter(r => r.pricePerNight <= maxPrice);
  }

  if (req.query.search !== undefined && req.query.search !== '') {
    const term = String(req.query.search).toLowerCase();
    result = result.filter(
      r => r.name.toLowerCase().includes(term) || r.location.toLowerCase().includes(term)
    );
  }

  const total = result.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  if (req.query.sort !== undefined) {
    const sortField = req.query.sort;
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        const aVal = a.name.toLowerCase();
        const bVal = b.name.toLowerCase();
        if (aVal < bVal) cmp = -1;
        else if (aVal > bVal) cmp = 1;
        else cmp = 0;
      } else if (sortField === 'pricePerNight') {
        cmp = a.pricePerNight - b.pricePerNight;
      } else if (sortField === 'capacity') {
        cmp = a.capacity - b.capacity;
      }
      return order === 'desc' ? -cmp : cmp;
    });
  }

  const startIndex = (page - 1) * limit;
  const data = result.slice(startIndex, startIndex + limit);

  return res.status(200).json({
    data,
    page,
    limit,
    total,
    totalPages
  });
});

app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.find(r => String(r.id) === req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Record not found' });
  }
  return res.status(200).json(room);
});

app.put('/api/rooms/:id', (req, res) => {
  const roomIndex = rooms.findIndex(r => String(r.id) === req.params.id);
  if (roomIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  for (const field of RECOGNIZED_ROOM_FIELDS) {
    if (!(field in req.body) || req.body[field] === undefined || req.body[field] === null) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  const nameRes = validateName(req.body.name);
  if (!nameRes.valid) return res.status(400).json({ error: nameRes.error });

  const locRes = validateLocation(req.body.location);
  if (!locRes.valid) return res.status(400).json({ error: locRes.error });

  const typeRes = validateType(req.body.type);
  if (!typeRes.valid) return res.status(400).json({ error: typeRes.error });

  const priceRes = validatePricePerNight(req.body.pricePerNight);
  if (!priceRes.valid) return res.status(400).json({ error: priceRes.error });

  const capRes = validateCapacity(req.body.capacity);
  if (!capRes.valid) return res.status(400).json({ error: capRes.error });

  const availRes = validateAvailable(req.body.available);
  if (!availRes.valid) return res.status(400).json({ error: availRes.error });

  const roomNumRes = validateRoomNumber(req.body.roomNumber);
  if (!roomNumRes.valid) return res.status(400).json({ error: roomNumRes.error });

  const currentRoom = rooms[roomIndex];

  const isDuplicate = rooms.some(
    r => r.id !== currentRoom.id && r.roomNumber.toLowerCase() === roomNumRes.value.toLowerCase()
  );
  if (isDuplicate) {
    return res.status(409).json({ error: 'roomNumber already exists' });
  }

  const updatedRoom = {
    id: currentRoom.id,
    name: nameRes.value,
    location: locRes.value,
    type: typeRes.value,
    pricePerNight: priceRes.value,
    capacity: capRes.value,
    available: availRes.value,
    roomNumber: roomNumRes.value
  };

  rooms[roomIndex] = updatedRoom;
  return res.status(200).json(updatedRoom);
});

app.patch('/api/rooms/:id', (req, res) => {
  const roomIndex = rooms.findIndex(r => String(r.id) === req.params.id);
  if (roomIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const recognizedKeysInBody = RECOGNIZED_ROOM_FIELDS.filter(
    key => Object.prototype.hasOwnProperty.call(req.body, key)
  );

  if (recognizedKeysInBody.length === 0) {
    return res.status(400).json({ error: 'At least one recognised field is required' });
  }

  const currentRoom = rooms[roomIndex];
  let updatedFields = {};

  if ('name' in req.body) {
    const resName = validateName(req.body.name);
    if (!resName.valid) return res.status(400).json({ error: resName.error });
    updatedFields.name = resName.value;
  }

  if ('location' in req.body) {
    const resLoc = validateLocation(req.body.location);
    if (!resLoc.valid) return res.status(400).json({ error: resLoc.error });
    updatedFields.location = resLoc.value;
  }

  if ('type' in req.body) {
    const resType = validateType(req.body.type);
    if (!resType.valid) return res.status(400).json({ error: resType.error });
    updatedFields.type = resType.value;
  }

  if ('pricePerNight' in req.body) {
    const resPrice = validatePricePerNight(req.body.pricePerNight);
    if (!resPrice.valid) return res.status(400).json({ error: resPrice.error });
    updatedFields.pricePerNight = resPrice.value;
  }

  if ('capacity' in req.body) {
    const resCap = validateCapacity(req.body.capacity);
    if (!resCap.valid) return res.status(400).json({ error: resCap.error });
    updatedFields.capacity = resCap.value;
  }

  if ('available' in req.body) {
    const resAvail = validateAvailable(req.body.available);
    if (!resAvail.valid) return res.status(400).json({ error: resAvail.error });
    updatedFields.available = resAvail.value;
  }

  if ('roomNumber' in req.body) {
    const resRoomNum = validateRoomNumber(req.body.roomNumber);
    if (!resRoomNum.valid) return res.status(400).json({ error: resRoomNum.error });

    const isDuplicate = rooms.some(
      r => r.id !== currentRoom.id && r.roomNumber.toLowerCase() === resRoomNum.value.toLowerCase()
    );
    if (isDuplicate) {
      return res.status(409).json({ error: 'roomNumber already exists' });
    }
    updatedFields.roomNumber = resRoomNum.value;
  }

  const updatedRoom = {
    ...currentRoom,
    ...updatedFields,
    id: currentRoom.id
  };

  rooms[roomIndex] = updatedRoom;
  return res.status(200).json(updatedRoom);
});

app.delete('/api/rooms/:id', (req, res) => {
  const roomIndex = rooms.findIndex(r => String(r.id) === req.params.id);
  if (roomIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }

  rooms.splice(roomIndex, 1);
  return res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Hotel Rooms API server listening on port ${PORT}`);
});
