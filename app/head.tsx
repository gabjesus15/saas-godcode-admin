import { LANDING_LIGHT_SCOPE_SCRIPT } from "../components/theme/saas-theme-scope";

export default function Head() {
  return (
    <script
      id="landing-theme-scope"
      dangerouslySetInnerHTML={{ __html: LANDING_LIGHT_SCOPE_SCRIPT.trim() }}
    />
  );
}
