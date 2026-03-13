import "../super-admin.tailwind.css";
import { SaasThemeScope } from "../../components/theme/saas-theme-scope";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SaasThemeScope />
      {children}
    </>
  );
}
