import { AuthScreen } from "../../components/auth-screen";

export const metadata = {
  title: "Create your account | Supademo",
  robots: { index: false, follow: false }
};

export default function SignupPage() {
  return <AuthScreen initialView="sign-up" signupSurface />;
}
