import redisClient from "../Utils/Redis.js";
import {Logger} from "../Utils/Logger.js";
import type { Request, Response } from "express";

export async function SecretGetMessageHandler(req: Request, res: Response) {
    const id = req.params.id;
    const query = req.query;
    if (!query || !query.controlmessage) {
        return res.status(400).json({error: 'controlmessage is required'});
    }
    const controlmessage = query.controlmessage;

    const secretString = await redisClient.get("secrets:" + id);
    if (!secretString) {
        Logger.log(
            Logger.logLevels.DEBUG,
            Logger.contexts.ROUTES,
            `Secret with id ${id} could not be found`
        );
        return res.status(404).json({error: 'Secret not found or has expired'});
    }

    const secretData = JSON.parse(secretString);
    if (secretData.controlmessage !== controlmessage) {
        Logger.log(Logger.logLevels.DEBUG, Logger.contexts.ROUTES, `Invalid controlmessage attempt for secret id ${id}`);
        return res.status(403).json({error: 'Invalid controlmessage'});
    }

    secretData.opens += 1;

    if (secretData.opens >= secretData.burnsAfterXOpens) {
        await redisClient.del("secrets:" + id);
        await redisClient.sRem(`usersecrets:${secretData.owner}`, id);
        Logger.log(Logger.logLevels.DEBUG, Logger.contexts.ROUTES, `Secret id ${id} has been accessed and burned after ${secretData.opens} opens`);
    } else {
        await redisClient.set("secrets:" + id, JSON.stringify(secretData));
        Logger.log(Logger.logLevels.DEBUG, Logger.contexts.ROUTES, `Secret id ${id} accessed, opens: (${secretData.opens}/${secretData.burnsAfterXOpens})`);
    }

    res.status(200).json({
        message: secretData.message,
        controlmessage: secretData.controlmessage,
        opens: secretData.opens,
        burnsAfterXOpens: secretData.burnsAfterXOpens,
        file: secretData.file || null,
    });
}