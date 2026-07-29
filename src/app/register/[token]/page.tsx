import { RegistrationForm } from "@/components/registration/registration-form";

export default async function RegisterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <RegistrationForm token={token} />;
}
