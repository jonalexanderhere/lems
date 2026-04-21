import LoginClient from "./login-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const resetValue = Array.isArray(params.reset) ? params.reset[0] : params.reset;

  return <LoginClient resetSuccess={resetValue === "success"} />;
}
