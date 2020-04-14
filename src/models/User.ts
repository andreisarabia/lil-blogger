import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

import Model from './Model';
import { isEmail, isSafePassword } from '../util/validators';

import { UserProps, UserPropsKey } from '../typings';

const MIN_PASSWORD_LENGTH = 15;
const MAX_PASSWORD_LENGTH = 50;
const SALT_ROUNDS = 10;

export default class User extends Model<UserProps> {
  protected static readonly collectionName = 'users';

  protected constructor(props: UserProps) {
    super(props, User.collectionName);
  }

  public get id(): ObjectId {
    return <ObjectId>this.props._id;
  }

  private get password(): string {
    return this.props.password;
  }

  public async update(propsToUpdate: Partial<UserProps>): Promise<void> {
    const updatedProps: { [key: string]: UserProps[UserPropsKey] } = {};

    for (const key of <UserPropsKey[]>Object.keys(propsToUpdate)) {
      if (!(key in this.props)) continue;

      const value = propsToUpdate[key];

      if (value === undefined) continue;

      this.updateProps(key, value);
      updatedProps[key] = value;
    }

    await Model.updateOne(User.collectionName, { _id: this.id }, updatedProps);
  }

  public static async create(
    email: string,
    password: string,
    cookie: string
  ): Promise<void> {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    await new User({
      email,
      cookie,
      password: hash,
      uniqueId: uuidv4(),
    }).save();
  }

  public static async find(criteria: Partial<UserProps>): Promise<User | null> {
    const userData = await super.searchOne({
      collection: this.collectionName,
      criteria,
    });

    return userData ? new User(userData) : null;
  }

  public static async validateCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = await this.find({ email });
    const isValidPassword = await bcrypt.compare(
      password,
      user ? user.password : ''
    );

    return user && isValidPassword ? user : null;
  }

  public static async verifyUserData(
    email: string,
    password: string
  ): Promise<string[] | null> {
    const errors: string[] = [];

    if (!isEmail(email) || (await this.exists(email)))
      errors.push('Email is not valid.');

    if (password.length < MIN_PASSWORD_LENGTH)
      errors.push('Password is too short.');
    else if (password.length > MAX_PASSWORD_LENGTH)
      errors.push('Password is too long.');

    if (!isSafePassword(password))
      errors.push(
        `Your password contains invalid characters. Please use:
        At least one lowercase letter
        At least one uppercase letter
        At least one number
        At least one special character (Allowed: ! @ # $ % ^ & *)`
      );

    return errors.length > 0 ? errors : null;
  }

  private static async exists(email: string): Promise<boolean> {
    const userData = await super.searchOne<UserProps>({
      collection: this.collectionName,
      criteria: { email },
    });

    return Boolean(userData);
  }
}
