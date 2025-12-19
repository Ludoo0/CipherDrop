import {randomUUID} from "crypto";
import redisClient from "../Utils/Redis.js";
import {Logger} from "../Utils/Logger.js";
import qrcode from "qrcode";
import type { Request, Response } from "express";

export async function SecretRegisterHandler(req: Request, res: Response) {
    const body = req.body;
    if (!body || !body.message || !body.controlmessage) {
        return res.status(400).json({error: 'securemessage and controlmessage are required'});
    }

    if (!body.file) {
        body.file=null;
    }

    const id = randomUUID();
    const secretData: secretData = {
        message: body.message,
        controlmessage: body.controlmessage,
        burnsAfterXOpens: body.burnsAfterXOpens || 1,
        opens: 0,
        file: body.file,
    };
    const expiration = body.ttl ? parseInt(body.ttl) : 3600; // Default to 24 hours
    await redisClient.set("secrets:" + id, JSON.stringify(secretData), {
        EX: expiration
    });
    const qrCodeDataURL = await qrcode.toDataURL(`${process.env.BASE_URL}/read?messageId=${id}`);

    Logger.log(Logger.logLevels.DEBUG, Logger.contexts.ROUTES, `Registered new secret with id ${id}, expires in ${expiration} seconds`);
    res.status(200).json({id, expiration, qrCodeDataURL});
}


type secretData = {
    message: string;
    controlmessage: string;
    burnsAfterXOpens: number;
    opens: number;
    file: {
        name: string;
        type: string;
        data: string;
    } | null;
}