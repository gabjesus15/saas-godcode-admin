import { LIGHT_ONLY_THEME_SCRIPT } from "../../../components/theme/saas-theme-scope";

export default function Head() {
  return <script id="customer-portal-theme-scope" dangerouslySetInnerHTML={{ __html: LIGHT_ONLY_THEME_SCRIPT.trim() }} />;
}
