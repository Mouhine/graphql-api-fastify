import { ObjectType, Field, ID, InputType } from "type-graphql";
import { IsEmail, Length } from "class-validator";
@ObjectType()
export class User {
  @Field(() => ID, { nullable: false })
  id: string;

  @Field(() => String, { nullable: false })
  username: string;

  @Field(() => String, { nullable: false })
  email: string;

  @Field(() => String, { nullable: false })
  password: string;
}

@InputType()
export class RegisterUserInput {
  @Field({ nullable: false })
  username: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(6, 56)
  password: string;
}

@InputType()
export class LoginInput {
  @Field({ nullable: false })
  usernameOremail: string;

  @Field()
  @Length(6, 56)
  password: string;
}

@ObjectType()
export class UserFollowers {
  @Field(() => Number)
  count: number;

  @Field(() => [User])
  items: [User];
}

@InputType()
export class FollowUserInput {
  @Field()
  username: string;
}
