import prisma from "../../utils/prisma";
import { CreateMessageInput } from "./message.dto";

export async function createMessage(input: CreateMessageInput) {
  return prisma.message.create({
    data: {
      ...input,
      user: {
        connect: {
          id: input.userId,
        },
      },
    },
  });
}

export async function findMessage() {
  return prisma.message.findMany();
}
