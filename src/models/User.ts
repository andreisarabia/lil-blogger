import Model, { BaseProps } from './Model';
import { is_email } from '../util';

export interface UserProps extends BaseProps {
  email: string;
  password: string;
}

const MIN_PASSWORD_LENGTH = 15;
const MAX_PASSWORD_LENGTH = 45;

export default class User extends Model {
  private static readonly collectionName = 'articles';

  protected constructor(protected props: UserProps) {
    super(props, User.collectionName);
  }

  public static async verify_user_params({
    email,
    password
  }: UserProps): Promise<string[]> {
    const errors: string[] = [];

    if (!is_email(email) || (await User.exists(email))) {
      errors.push('Email is not valid');
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.push('Password is too short.');
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      errors.push('Password is too long.');
    }

    return errors;
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
