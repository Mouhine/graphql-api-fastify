import {
  Resolver,
  Arg,
  Ctx,
  Mutation,
  Query,
  Authorized,
  FieldResolver,
  Root,
  PubSub,
  PubSubEngine,
  Subscription,
} from "type-graphql";
import { Context } from "../../utils/createServer";
import { findUserById } from "../user/user.service";
import { CreateMessageInput, Message } from "./message.dto";
import { createMessage, findMessage } from "./message.service";

@Resolver()
class MessageResolver {
  @Query(() => [Message])
  messages() {
    return findMessage();
  }

  @Authorized()
  @Mutation(() => Message)
  async createMessage(
    @Arg("input") input: CreateMessageInput,
    @Ctx() context: Context,
    @PubSub() pubSub: PubSubEngine
  ) {
    try {
      const result = await createMessage({
        ...input,
        userId: context.user?.id!,
      });

      await pubSub.publish("NEW_MESSAGE", result);
      return result;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Subscription(() => [Message], {
    topics: "NEW_MESSAGE",
  })
  newMessage(@Root() message: Message) {
    return message;
  }

  @FieldResolver()
  async user(@Root() message: Message) {
    return await findUserById(message.userId);
  }
}
