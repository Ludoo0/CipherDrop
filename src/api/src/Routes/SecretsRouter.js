// Imports
import express from 'express';
import redisClient from "../Utils/Redis.js"
import { randomUUID } from 'crypto';

// Express Router
const router = express.Router();

router.post('/register', async (req, res) => {
    const body = req.body;
    if (!body || !body.securemessage || !body.controlmessage) {
        return res.status(400).json({ error: 'securemessage and controlmessage are required' });
    }

    const id = randomUUID();
    const secretData = {
        securemessage: body.securemessage,
        controlmessage: body.controlmessage,
        burnsAfterXOpens: body.burnsAfterXOpens || 1,
        opens: 0
    };
    const expiration = body.ttl ? parseInt(body.ttl) : 3600; // Default to 24 hours
    await redisClient.set("secrets:" + id, JSON.stringify(secretData), {
        EX: expiration
    });
    res.status(200).json({id, expiration});
});


router.get("/exists/:id", async (req, res) => {
    const id = req.params.id;
    const exists = await redisClient.exists("secrets:" + id);
    res.status(200).json({ exists: exists === 1 });
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const body = req.body;
    if (!body ||!body.controlmessage) {
        return res.status(400).json({ error: 'controlmessage is required' });
    }
    const controlmessage = body.controlmessage;

    const secretString = await redisClient.get("secrets:" + id);
    if (!secretString) {
        return res.status(404).json({ error: 'Secret not found or has expired' });
    }

    const secretData = JSON.parse(secretString);
    if (secretData.controlmessage !== controlmessage) {
        return res.status(403).json({ error: 'Invalid controlmessage' });
    }

    secretData.opens += 1;

    if (secretData.opens >= secretData.burnsAfterXOpens) {
        await redisClient.del("secrets:" + id);
    } else {
        await redisClient.set("secrets:" + id, JSON.stringify(secretData));
    }

    res.status(200).json({
        securemessage: secretData.securemessage,
        controlmessage: secretData.controlmessage,
        opens: secretData.opens,
        burnsAfterXOpens: secretData.burnsAfterXOpens
    });
});



export default router;