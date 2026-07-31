import UserMemory from "../models/UserMemory.js";

export default class ProfileMemory {

    async saveFact(userId, key, value) {

        const existing = await UserMemory.findOne({
            userId,
            key
        });

        if (existing) {

            existing.value = value;

            await existing.save();

            return existing;
        }

        return await UserMemory.create({
            userId,
            key,
            value
        });
    }

    async getFacts(userId) {

        return await UserMemory.find({
            userId
        });

    }

    async getFact(userId, key) {

        return await UserMemory.findOne({
            userId,
            key
        });

    }

    async updateFact(userId, key, value) {

        return await UserMemory.findOneAndUpdate(
            {
                userId,
                key
            },
            {
                value
            },
            {
                new: true,
                upsert: true
            }
        );

    }

    async deleteFact(userId, key) {

        return await UserMemory.deleteOne({
            userId,
            key
        });

    }

}