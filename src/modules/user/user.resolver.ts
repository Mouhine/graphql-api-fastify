import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  FieldResolver,
  Root,
  Authorized,
} from "type-graphql";
import { Context } from "../../utils/createServer";
import {
  FollowUserInput,
  LoginInput,
  RegisterUserInput,
  User,
  UserFollowers,
} from "./user.dto";
import {
  createUser,
  findUserFollowers,
  findUserFollowing,
  findUsers,
  findUsrByEmailOrUsername,
  followUser,
  unfollowUser,
  verifyPassword,
} from "./user.service";
import { ApolloError } from "apollo-server-core";
@Resolver(() => User)
export class UserResolver {
  @Mutation(() => User)
  async register(@Arg("input") input: RegisterUserInput) {
    try {
      const user = await createUser(input);
      return user;
    } catch (error) {
      throw error;
    }
  }

  @Authorized()
  @Query(() => User)
  me(@Ctx() context: Context) {
    return context.user;
  }

  @Query(() => [User])
  async users() {
    const users = await findUsers();
    return users;
  }

  @Mutation(() => String)
  async Login(@Arg("input") input: LoginInput, @Ctx() context: Context) {
    const user = await findUsrByEmailOrUsername(input);

    if (!user) {
      throw new ApolloError("invalid credentials");
    }

    const isValid = await verifyPassword(input.password, user.password);

    if (!isValid) {
      throw new ApolloError("invalid credentials");
    }

    const token = await context.reply?.jwtSign({
      id: user.id,
      uername: user.username,
      email: user.email,
    });

    context.reply?.setCookie("token", token!, {
      domain: "localhost",
      path: "/",
      secure: false,
      httpOnly: true,
      sameSite: false,
    });

    return token;
  }

  @Authorized()
  @Mutation(() => User)
  async fallowUser(
    @Arg("input") input: FollowUserInput,
    @Ctx() context: Context
  ) {
    try {
      const result = await followUser(context.user?.id!, input.username);
      return result;
    } catch (error: any) {
      throw new ApolloError(error.message);
    }
  }

  @Authorized()
  @Mutation()
  async unfollowUser(
    @Arg("input") input: FollowUserInput,
    @Ctx() context: Context
  ) {
    try {
      const result = await unfollowUser(context.user?.id!, input.username);
      return result;
    } catch (error: any) {
      throw new ApolloError(error.message);
    }
  }

  @Authorized()
  @FieldResolver(() => UserFollowers)
  async followers(@Root() user: User) {
    const data = await findUserFollowing(user.id);
    return {
      count: data.following.length,
      items: data.following,
    };
  }

  @Authorized()
  @FieldResolver(() => UserFollowers)
  async following(@Root() user: User) {
    const data = await findUserFollowers(user?.id!);
    return {
      count: data.followedBy.length,
      items: data.followedBy,
    };
  }
}
