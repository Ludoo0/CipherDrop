import {randomUUID} from "crypto";
import redisClient from "../Utils/Redis.js";
import {Logger} from "../Utils/Logger.js";
import qrcode from "qrcode";
import type { Request, Response } from "express";

export async function SecretRegisterHandler(req: Request, res: Response) {
    const body = req.body;
    if (!body || !body.securemessage || !body.controlmessage) {
        return res.status(400).json({error: 'securemessage and controlmessage are required'});
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
    const qrCodeDataURL = await qrcode.toDataURL(`${process.env.BASE_URL}/secrets/${id}`);

    Logger.log(Logger.logLevels.DEBUG, Logger.contexts.ROUTES, `Registered new secret with id ${id}, expires in ${expiration} seconds`);
    res.status(200).json({id, expiration, qrCodeDataURL});
}