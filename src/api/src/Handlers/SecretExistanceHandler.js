import redisClient from "../Utils/Redis.js";

export async function SecretExistanceHandler(req, res){
    const id = req.params.id;
    const exists = await redisClient.exists("secrets:" + id);
    res.status(200).json({ exists: exists === 1 });
}