import { FollowUserInput, LoginInput, RegisterUserInput } from "./user.dto";
import prisma from "../../utils/prisma";
import argon2 from "argon2";
export async function createUser(input: RegisterUserInput) {
  const hashpassword = argon2.hash(input.password);
  return prisma.user.create({
    data: {
      ...input,
      email: input.email.toLocaleLowerCase(),
      username: input.username.toLocaleLowerCase(),
      password: hashpassword,
    },
  });
}

export async function findUsrByEmailOrUsername(input: LoginInput) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { username: input.usernameOremail },
        { email: input.usernameOremail },
      ],
    },
  });
}

export async function verifyPassword(
  condidatePassword: string,
  password: string
) {
  return argon2.verify(password, condidatePassword);
}

export async function followUser(userId: string, username: string) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      following: {
        connect: { username },
      },
    },
  });
}

export async function findUsers() {
  return prisma.user.findMany();
}

export async function findUserFollowing(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      following: true,
    },
  });
}

export async function findUserFollowers(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      followedBy: true,
    },
  });
}

export async function unfollowUser(userId: string, username: string) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      following: {
        disconnect: { username },
      },
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findFirst({
    where: {
      id,
    },
  });
}
