import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import Model, { BaseProps } from './Model';
import { is_email, is_safe_password } from '../util';

export interface UserProps extends BaseProps {
  email: string;
  password: string;
  uniqueId: string;
  cookie: string;
}

type UserPropsKey = keyof UserProps;

const MIN_PASSWORD_LENGTH = 15;
const MAX_PASSWORD_LENGTH = 45;
const SALT_ROUNDS = 10;

export default class User extends Model {
  private static readonly collectionName = 'users';
  private static recentUsersCache = new Map<string, User>();

  protected constructor(protected props: UserProps) {
    super(props, User.collectionName);
  }

  private get cookie(): string {
    return this.props.cookie;
  }

  private get password(): string {
    return this.props.password;
  }

  private update_props<Key extends UserPropsKey>(
    key: Key,
    value: UserProps[Key]
  ) {
    this.props[key] = value;
  }

  public async update(propsToUpdate: Partial<UserProps>): Promise<void> {
    const keys = Object.keys(propsToUpdate) as UserPropsKey[];

    for (const key of keys) {
      if (!(key in this.props)) continue;

      const value = propsToUpdate[key];

      if (value !== undefined) this.update_props(key, value);
    }

    await this.save();
  }

  public static async create({
    email,
    password,
    cookie
  }: Omit<UserProps, 'uniqueId'>): Promise<User> {
    const uniqueId = uuidv4(); // client facing unique id, not Mongo's _id
    password = await bcrypt.hash(password, SALT_ROUNDS);

    return new User({ email, password, uniqueId, cookie });
  }

  public static async find(searchProps: Partial<UserProps>): Promise<User> {
    if (searchProps.cookie && this.recentUsersCache.has(searchProps.cookie))
      return this.recentUsersCache.get(searchProps.cookie);

    const userData = (await Model.search({
      collection: User.collectionName,
      criteria: searchProps,
      limit: 1
    })) as UserProps;

    if (!userData) return null;

    const user = new User(userData);

    this.recentUsersCache.set(user.cookie, user);

    return user;
  }

  public static async validate_login(
    email: string,
    password: string
  ): Promise<boolean> {
    const user = await User.find({ email });
    const hash = user ? user.password : '';
    const isMatchingPassword = await bcrypt.compare(password, hash);

    return isMatchingPassword;
  }

  public static async verify_user_data(
    email: string,
    password: string
  ): Promise<string[]> {
    const errors: string[] = [];

    if (!is_email(email) || (await User.exists(email)))
      errors.push('Email is not valid.');

    if (password.length < MIN_PASSWORD_LENGTH)
      errors.push('Password is too short.');
    else if (password.length > MAX_PASSWORD_LENGTH)
      errors.push('Password is too long.');

    if (!is_safe_password(password))
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
    const userData = (await Model.search({
      collection: User.collectionName,
      criteria: { email },
      limit: 1
    })) as UserProps;

    return Boolean(userData);
  }
}
