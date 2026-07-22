const express = require('express');
const fs = require('fs');
const fsPromises = require('fs/promises');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config({
  path: require('path').join(__dirname, '.env'),
  quiet: true,
});

const app = express();
const port = process.env.PORT || 3000;
const dbFilePath = path.join(__dirname, 'db.json');
// users DB file path
const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
// Uploads configuration
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'users');
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeExtension = extension || '.jpg';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Tipul fisierului nu este acceptat.'));
      return;
    }

    cb(null, true);
  },
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ message: 'Poza este prea mare. Maxim 2MB.' });
    }

    return res.status(400).json({ message: 'Upload invalid.' });
  }

  if (error.message === 'Tipul fisierului nu este acceptat.') {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: 'Eroare interna de server.' });
});

// END Uploads configuration
// Cors configuration - Allows requests from localhost and configured production frontends.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isLocalhost = /^https?:\/\/localhost:\d+$/.test(origin);
    if (isLocalhost) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  optionsSuccessStatus: 204,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use(cors(corsOptions));
// Use express.json() middleware to parse JSON bodies of requests
app.use(express.json({ limit: '5mb' }));
// GET route - Allows to get all the items
// example: localhost:3000/clothes?page=0&perPage=2
app.get('/clothes', (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const perPage = parseInt(req.query.perPage) || 10;

  fs.readFile(dbFilePath, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
      return;
    }

    const jsonData = JSON.parse(data);

    const start = page * perPage;
    const end = start + perPage;

    const result = jsonData.items.slice(start, end);

    res.status(200).json({
      items: result,
      total: jsonData.items.length,
      page,
      perPage,
      totalPages: Math.ceil(jsonData.items.length / perPage),
    });
  });
});

// GET by id route - Allows to get a single item
// example: localhost:3000/clothes/1
app.get('/clothes/:id', (req, res) => {
  const id = parseInt(req.params.id);

  fs.readFile(dbFilePath, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
      return;
    }

    const jsonData = JSON.parse(data);
    const item = jsonData.items.find((entry) => entry.id === id);

    if (!item) {
      res.status(404).send('Not Found');
      return;
    }

    res.status(200).json(item);
  });
});

// POST route - Allows to add a new item
// example: localhost:3000/clothes
/*
  body: {
    "image": "https://your-image-url.com/image.png",
    "name": "T-shirt",
    "price": "10",
    "rating": 4
  }
*/
app.post('/clothes', (req, res) => {
  const { image, name, price, rating } = req.body;

  fs.readFile(dbFilePath, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
      return;
    }

    const jsonData = JSON.parse(data);

    const maxId = jsonData.items.reduce(
      (max, item) => Math.max(max, item.id),
      0,
    );

    const newItem = {
      id: maxId + 1,
      image,
      name,
      price,
      rating,
    };

    jsonData.items.push(newItem);

    fs.writeFile(dbFilePath, JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
        return;
      }

      res.status(201).json(newItem);
    });
  });
});

// PUT route - Allows to update an item
// example: localhost:3000/clothes/1
/*
  body: {
    "image": "https://your-image-url.com/image.png",
    "name": "T-shirt",
    "price": "10",
    "rating": 4
  }
*/
app.put('/clothes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { image, name, price, rating } = req.body;

  fs.readFile(dbFilePath, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
      return;
    }

    const jsonData = JSON.parse(data);

    const index = jsonData.items.findIndex((item) => item.id === id);

    if (index === -1) {
      res.status(404).send('Not Found');
      return;
    }

    jsonData.items[index] = {
      id,
      image,
      name,
      price,
      rating,
    };

    fs.writeFile(dbFilePath, JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
        return;
      }

      res.status(200).json(jsonData.items[index]);
    });
  });
});

// DELETE route - Allows to delete an item
// example: localhost:3000/clothes/1
app.delete('/clothes/:id', (req, res) => {
  const id = parseInt(req.params.id);

  fs.readFile(dbFilePath, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
      return;
    }

    const jsonData = JSON.parse(data);

    const index = jsonData.items.findIndex((item) => item.id === id);

    if (index === -1) {
      res.status(404).send('Not Found');
      return;
    }

    jsonData.items.splice(index, 1);

    fs.writeFile(dbFilePath, JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
        return;
      }

      res.status(204).send();
    });
  });
});

// Users Routes

async function readUsers() {
  try {
    const fileContent = await fsPromises.readFile(USERS_FILE, 'utf-8');
    const users = JSON.parse(fileContent);
    return Array.isArray(users) ? users : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fsPromises.writeFile(USERS_FILE, '[]', 'utf-8');
      return [];
    }

    throw error;
  }
}

async function writeUsers(users) {
  await fsPromises.writeFile(
    USERS_FILE,
    JSON.stringify(users, null, 2),
    'utf-8',
  );
}

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function sanitizeUser(user) {
  const storedPhoto = typeof user.photo === 'string' ? user.photo : '';
  const isExternalOrAbsolute =
    storedPhoto.startsWith('http://') ||
    storedPhoto.startsWith('https://') ||
    storedPhoto.startsWith('/');

  return {
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    photo: storedPhoto
      ? isExternalOrAbsolute
        ? storedPhoto
        : `/uploads/users/${storedPhoto}`
      : '',
    createdAt: user.createdAt,
  };
}

// ====================== USERS CRUD ======================

// Get all users
app.get('/users', async (_req, res) => {
  try {
    const users = await readUsers();
    res.json(users.map(sanitizeUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Eroare la citirea utilizatorilor.' });
  }
});

// Get one user
app.get('/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const users = await readUsers();
    const user = users.find((u) => u.id === id);

    if (!user) {
      return res.status(404).json({ message: 'Utilizatorul nu exista.' });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Eroare de server.' });
  }
});
// Delete user
app.delete('/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const users = await readUsers();
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Utilizatorul nu exista.' });
    }

    const deletedUser = users[index];

    // Sterge poza daca exista
    if (deletedUser.photo) {
      const photoPath = path.join(UPLOADS_DIR, deletedUser.photo);

      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    users.splice(index, 1);

    await writeUsers(users);

    res.json({ message: 'Utilizator sters cu succes.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Eroare de server.' });
  }
});
//Register route
app.post('/auth/register', upload.single('photo'), async (req, res) => {
  const { name, surname, email, password, repeatPassword } = req.body;

  if (
    !name ||
    !surname ||
    !email ||
    !password ||
    !repeatPassword ||
    typeof name !== 'string' ||
    typeof surname !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof repeatPassword !== 'string'
  ) {
    return res.status(400).json({ message: 'Date invalide.' });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: 'Parola trebuie sa aiba minim 6 caractere.' });
  }

  if (password !== repeatPassword) {
    return res.status(400).json({ message: 'Parolele nu coincid.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Poza este obligatorie.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = await readUsers();
  const existingUser = users.find((user) => user.email === normalizedEmail);

  if (existingUser) {
    return res
      .status(409)
      .json({ message: 'Exista deja un cont cu acest email.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    name: name.trim(),
    surname: surname.trim(),
    email: normalizedEmail,
    passwordHash,
    photo: req.file.filename,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeUsers(users);

  const token = generateToken(newUser);

  return res.status(201).json({
    message: 'Cont creat cu succes.',
    token,
    user: sanitizeUser(newUser),
  });
});
// Login route
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (
    !email ||
    !password ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return res
      .status(400)
      .json({ message: 'Emailul si parola sunt obligatorii.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = await readUsers();
  const user = users.find((item) => item.email === normalizedEmail);

  if (!user) {
    return res.status(401).json({ message: 'Email sau parola invalide.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Email sau parola invalide.' });
  }

  const token = generateToken(user);

  return res.json({
    message: 'Autentificare reusita.',
    token,
    user: sanitizeUser(user),
  });
});
// Test route to check if the server is running
app.get('/auth/health', (_req, res) => {
  res.json({ status: 'ok' });
});
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
