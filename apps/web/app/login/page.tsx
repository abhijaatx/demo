import { AuthScreen } from "../../components/auth-screen";

export const metadata = {
  title: "Sign in | Supademo",
  robots: { index: false, follow: false }
};

/**
 * Keep the public login URL as an alias for the existing auth flow. This lets
 * copied Supademo links land on the same CSRF-protected, local-auth screen as
 * /auth without duplicating authentication logic.
 */
export default function LoginPage() {
  return <AuthScreen initialView="sign-in" />;
}
