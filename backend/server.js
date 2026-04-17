const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create API Log interceptor
const apiLogger = async (req, res, next) => {
  const oldJson = res.json;
  const startTime = Date.now();
  res.json = function(data) {
      if (req.client) {
          prisma.apiLog.create({
              data: {
                  endpoint: req.path,
                  client_id: req.client.id,
                  response_time: Date.now() - startTime
              }
          }).catch(e => console.error("Logger error:", e));
      }
      return oldJson.call(this, data);
  };
  next();
};

// Auth middleware for API access
const requireApiKey = async (req, res, next) => {
  const apiKey = req.header('x-api-key');
  if (!apiKey) return res.status(401).json({ error: "Missing x-api-key header" });
  
  const client = await prisma.client.findUnique({ where: { api_key: apiKey } });
  if (!client) return res.status(403).json({ error: "Invalid API key" });
  
  req.client = client;
  next();
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later."
});

// Admin Routes
app.post('/admin/register', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  
  const api_key = "pk_" + Math.random().toString(36).substr(2, 10) + Date.now().toString(36);
  const secret = "sk_" + Math.random().toString(36).substr(2, 15);
  
  const client = await prisma.client.create({
      data: { name, api_key, secret }
  });
  res.json({ message: "Client created successfully", client });
});

app.get('/admin/stats', async (req, res) => {
  const totalClients = await prisma.client.count();
  const totalCalls = await prisma.apiLog.count();
  const recentLogs = await prisma.apiLog.findMany({ take: 10, orderBy: { timestamp: 'desc' }, include: { client: true } });
  
  // Chart data: requests grouped by date (simplistic implementation)
  const logs = await prisma.apiLog.findMany({ select: { timestamp: true }});
  const usageByDate = {};
  logs.forEach(l => {
      const date = l.timestamp.toISOString().split('T')[0];
      usageByDate[date] = (usageByDate[date] || 0) + 1;
  });

  res.json({ totalClients, totalCalls, topUsage: usageByDate, recentLogs });
});

app.get('/admin/clients', async (req, res) => {
    const clients = await prisma.client.findMany({
        include: { _count: { select: { apiLogs: true } } }
    });
    res.json(clients);
});

// Data API Routes
const apiRoutes = express.Router();
apiRoutes.use(requireApiKey);
apiRoutes.use(limiter);
apiRoutes.use(apiLogger);

apiRoutes.get('/states', async (req, res) => {
    const states = await prisma.state.findMany();
    res.json(states);
});

apiRoutes.get('/districts', async (req, res) => {
    const { state_id } = req.query;
    if (!state_id) return res.status(400).json({ error: "Missing state_id query param" });
    const dicts = await prisma.district.findMany({ where: { state_id: parseInt(state_id) } });
    res.json(dicts);
});

apiRoutes.get('/subdistricts', async (req, res) => {
    const { district_id } = req.query;
    if (!district_id) return res.status(400).json({ error: "Missing district_id query param" });
    const subdicts = await prisma.subDistrict.findMany({ where: { district_id: parseInt(district_id) } });
    res.json(subdicts);
});

apiRoutes.get('/villages', async (req, res) => {
    const { sub_district_id } = req.query;
    if (!sub_district_id) return res.status(400).json({ error: "Missing sub_district_id query param" });
    // Pagination just in case there are thousands
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    
    const vills = await prisma.village.findMany({ 
        where: { sub_district_id: parseInt(sub_district_id) },
        skip,
        take: limit
    });
    const total = await prisma.village.count({ where: { sub_district_id: parseInt(sub_district_id) } });
    res.json({ villages: vills, total, page, totalPages: Math.ceil(total / limit) });
});

apiRoutes.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 3) return res.status(400).json({ error: "Search term must be at least 3 chars" });
    
    const villages = await prisma.village.findMany({
        where: { name: { contains: q, } },
        take: 20,
        include: {
            subDistrict: {
                include: {
                    district: {
                        include: {
                            state: true
                        }
                    }
                }
            }
        }
    });
    
    res.json(villages);
});

app.use('/api/v1', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
