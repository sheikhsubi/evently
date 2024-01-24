'use server'
import { CreateUserParams, UpdateUserParams } from "@/types"
import { handleError } from "../utils"
import { connectToDatabase } from "../database"
import User from "../database/models/user.model"
import Event from "../database/models/event.model"
import Order from "../database/models/order.model"
import { revalidatePath } from "next/cache"

export const createUser = async (user: CreateUserParams) => {
    try {
        await connectToDatabase();
        const newUser = await User.create(user);
        return JSON.parse(JSON.stringify(newUser));
    } catch (error) {
        handleError(error);
    }
}

export async function updateUser(clerkId: string, user: UpdateUserParams) {
    try {
        await connectToDatabase();
        const updateUser = await User.findByIdAndUpdate({ clerkId }, user, { new: true });
        if (!updateUser) {
            throw new Error('Failed to update the user');
        }
        return JSON.parse(JSON.stringify(updateUser));
    } catch (error) {
        handleError(error);
    }
}

export async function deleteUser(clerkId: string) {
    try {
        await connectToDatabase();
        const userToDelete = await User.findOne({ clerkId })
        if (!userToDelete) {
            throw new Error('User not found');
        }

        await Promise.all([
            Event.updateMany(
                { _id: { $in: userToDelete.events } },
                { $pull: { organizer: userToDelete._id } }
            ),
            Order.updateMany(
                { _id: { $in: userToDelete.orders } },
                { $unset: { buyer: 1 } },
            )
        ])
        const deletedUser = await User.findByIdAndDelete(userToDelete._id)
        revalidatePath('/')

        return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null
    } catch (error) {
        handleError(error);
    }
}