export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';
